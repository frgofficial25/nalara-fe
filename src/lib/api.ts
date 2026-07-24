/**
 * Base HTTP Client untuk Nalara API
 *
 * Semua service yang consume API backend harus menggunakan helper ini
 * agar base URL dan error handling konsisten di seluruh aplikasi.
 *
 * ── Auto Token Refresh ────────────────────────────────────────────────────────
 * Ketika server mengembalikan 401, client akan mencoba memanggil
 * POST /api/auth/refresh dengan refresh_token dari storage.
 * Jika berhasil, access_token baru disimpan dan request asli di-retry 1 kali.
 * Jika refresh juga gagal, semua storage dibersihkan dan user diarahkan ke /login.
 */

// Backend base URL kini dikelola oleh middleware (src/middleware.ts)
// Frontend mengirim request ke /api-proxy/... untuk di-intercept
function resolveApiUrl(path: string): string {
  // Pastikan path selalu dimulai dengan /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // Ganti awalan /api menjadi /api-proxy
  return normalizedPath.replace(/^\/api/, '/api-proxy');
}

const TOKEN_KEY         = 'nalara_auth_token';
const REFRESH_TOKEN_KEY = 'nalara_refresh_token';
const USER_INFO_KEY     = 'nalara_user_info';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Opsi tambahan untuk setiap request */
interface RequestOptions {
  /** Bearer token untuk endpoint yang memerlukan autentikasi */
  token?: string;
  /** Override headers tambahan */
  headers?: Record<string, string>;
  /** Internal — sudah pernah di-retry setelah refresh, jangan retry lagi */
  _retried?: boolean;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    sessionStorage.getItem(REFRESH_TOKEN_KEY) ||
    localStorage.getItem(REFRESH_TOKEN_KEY) ||
    null
  );
}

function saveTokens(accessToken: string, refreshToken: string) {
  if (typeof window === 'undefined') return;
  // Ikuti storage yang sebelumnya dipakai (prefer localStorage jika ada)
  const useLocal = !!localStorage.getItem(TOKEN_KEY);
  const storage  = useLocal ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function clearAllAuth() {
  if (typeof window === 'undefined') return;
  [sessionStorage, localStorage].forEach(s => {
    s.removeItem(TOKEN_KEY);
    s.removeItem(REFRESH_TOKEN_KEY);
    s.removeItem(USER_INFO_KEY);
  });
}

// ─── Token Refresh (Public) ───────────────────────────────────────────────────

/**
 * Simpan refresh_token saat login.
 * Panggil ini dari services/auth.ts setelah login berhasil.
 */
export function saveRefreshToken(refreshToken: string, remember = false) {
  if (typeof window === 'undefined') return;
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

// ─── Token Refresh (Internal) ─────────────────────────────────────────────────

/**
 * Memanggil POST /api/auth/refresh dan menyimpan token baru.
 * Mengembalikan access token baru, atau null jika gagal.
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const res = await fetch(resolveApiUrl('/api/auth/refresh'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json() as {
      success: boolean;
      data?: { token: string; refresh_token: string };
    };

    if (!data.success || !data.data?.token) return null;

    saveTokens(data.data.token, data.data.refresh_token);
    return data.data.token;
  } catch {
    return null;
  }
}

// ─── Error Handler ────────────────────────────────────────────────────────────

function handleApiError(response: Response, data: any): never {
  const errorMessage =
    (data as { message?: string; error?: string }).message ||
    (data as { message?: string; error?: string }).error ||
    `Request gagal dengan status ${response.status}`;
  throw new Error(errorMessage);
}

// ─── Generic Fetcher dengan Auto-Refresh ──────────────────────────────────────

async function apiFetch<TResponse>(
  path: string,
  init: RequestInit,
  options: RequestOptions = {}
): Promise<TResponse> {
  const response = await fetch(resolveApiUrl(path), init);

  // Auto-refresh sekali jika 401 dan belum pernah di-retry
  if (response.status === 401 && !options._retried) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Inject token baru ke headers lalu retry
      const retryInit: RequestInit = {
        ...init,
        headers: {
          ...(init.headers as Record<string, string>),
          Authorization: `Bearer ${newToken}`,
        },
      };
      return apiFetch<TResponse>(path, retryInit, { ...options, _retried: true });
    }
    // Refresh gagal → paksa logout
    clearAllAuth();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  let data: TResponse;
  try {
    data = (await response.json()) as TResponse;
  } catch {
    throw new Error(`Server mengembalikan response yang tidak valid (HTTP ${response.status})`);
  }

  if (!response.ok) {
    handleApiError(response, data);
  }

  return data;
}

// ─── Build Headers ────────────────────────────────────────────────────────────

function buildHeaders(
  options: RequestOptions,
  extra: Record<string, string> = {}
): Record<string, string> {
  const headers: Record<string, string> = { ...extra, ...options.headers };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

  return headers;
}

// ─── Public API Functions ─────────────────────────────────────────────────────

/**
 * Kirim POST request ke backend API.
 *
 * @param path    - Path endpoint, contoh: '/api/auth/login'
 * @param body    - Payload JSON yang akan dikirim
 * @param options - Opsi tambahan (token, headers)
 * @returns       Parsed JSON response
 * @throws        Error dengan pesan dari server jika response tidak OK
 */
export async function apiPost<TResponse>(
  path: string,
  body: unknown,
  options: RequestOptions = {}
): Promise<TResponse> {
  return apiFetch<TResponse>(path, {
    method: 'POST',
    headers: buildHeaders(options, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  }, options);
}

/**
 * Kirim GET request ke backend API.
 *
 * @param path    - Path endpoint, contoh: '/api/users'
 * @param options - Opsi tambahan (token, headers)
 * @returns       Parsed JSON response
 */
export async function apiGet<TResponse>(
  path: string,
  options: RequestOptions = {}
): Promise<TResponse> {
  return apiFetch<TResponse>(path, {
    method: 'GET',
    headers: buildHeaders(options, { 'Content-Type': 'application/json' }),
  }, options);
}

/**
 * Kirim PUT request ke backend API.
 *
 * @param path    - Path endpoint, contoh: '/api/pembelajaran/uuid'
 * @param body    - Payload JSON yang akan dikirim
 * @param options - Opsi tambahan (token, headers)
 * @returns       Parsed JSON response
 */
export async function apiPut<TResponse>(
  path: string,
  body: unknown,
  options: RequestOptions = {}
): Promise<TResponse> {
  return apiFetch<TResponse>(path, {
    method: 'PUT',
    headers: buildHeaders(options, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  }, options);
}

/**
 * Kirim DELETE request ke backend API.
 *
 * @param path    - Path endpoint, contoh: '/api/modul/uuid'
 * @param options - Opsi tambahan (token, headers)
 * @returns       Parsed JSON response
 */
export async function apiDelete<TResponse>(
  path: string,
  options: RequestOptions = {}
): Promise<TResponse> {
  return apiFetch<TResponse>(path, {
    method: 'DELETE',
    headers: buildHeaders(options),
  }, options);
}

/**
 * Kirim PATCH request ke backend API.
 *
 * @param path    - Path endpoint, contoh: '/api/study-case-submissions/uuid/verify'
 * @param body    - Payload JSON yang akan dikirim
 * @param options - Opsi tambahan (token, headers)
 * @returns       Parsed JSON response
 */
export async function apiPatch<TResponse>(
  path: string,
  body: unknown,
  options: RequestOptions = {}
): Promise<TResponse> {
  return apiFetch<TResponse>(path, {
    method: 'PATCH',
    headers: buildHeaders(options, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  }, options);
}

/**
 * Kirim upload file (multipart/form-data) via PUT ke backend API.
 *
 * @param path     - Path endpoint, contoh: '/api/profile/avatar'
 * @param formData - FormData yang berisi file
 * @param options  - Opsi tambahan (token, headers)
 * @returns        Parsed JSON response
 */
export async function apiUpload<TResponse>(
  path: string,
  formData: FormData,
  options: RequestOptions = {}
): Promise<TResponse> {
  // Jangan set Content-Type — browser akan auto-set boundary untuk multipart
  return apiFetch<TResponse>(path, {
    method: 'PUT',
    headers: buildHeaders(options),
    body: formData,
  }, options);
}

/**
 * Kirim upload file (multipart/form-data) via POST ke backend API.
 *
 * @param path     - Path endpoint, contoh: '/api/materi/{id}/upload'
 * @param formData - FormData yang berisi file
 * @param options  - Opsi tambahan (token, headers)
 * @returns        Parsed JSON response
 */
export async function apiUploadPost<TResponse>(
  path: string,
  formData: FormData,
  options: RequestOptions = {}
): Promise<TResponse> {
  // Jangan set Content-Type — browser akan auto-set boundary untuk multipart
  return apiFetch<TResponse>(path, {
    method: 'POST',
    headers: buildHeaders(options),
    body: formData,
  }, options);
}
