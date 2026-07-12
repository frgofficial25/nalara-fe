/**
 * Base HTTP Client untuk Nalara API
 *
 * Semua service yang consume API backend harus menggunakan helper ini
 * agar base URL dan error handling konsisten di seluruh aplikasi.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL as string;

/** Opsi tambahan untuk setiap request */
interface RequestOptions {
  /** Bearer token untuk endpoint yang memerlukan autentikasi */
  token?: string;
/** Override headers tambahan */
  headers?: Record<string, string>;
}

function handleApiError(response: Response, data: any) {
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('nalara_auth_token');
      localStorage.removeItem('nalara_auth_token');
      sessionStorage.removeItem('nalara_user_info');
      localStorage.removeItem('nalara_user_info');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }
  const errorMessage =
    (data as { message?: string; error?: string }).message ||
    (data as { message?: string; error?: string }).error ||
    `Request gagal dengan status ${response.status}`;
  throw new Error(errorMessage);
}

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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  // Coba parse JSON — jika gagal (misal: server error HTML), lempar error generik
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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'GET',
    headers,
  });

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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });

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
  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'DELETE',
    headers,
  });

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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });

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


/**
 * Kirim upload file (multipart/form-data) ke backend API.
 *
 * @param path    - Path endpoint, contoh: '/api/profile/avatar'
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
  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'PUT',
    headers,
    body: formData,
  });

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

/**
 * Kirim upload file (multipart/form-data) via POST ke backend API.
 *
 * @param path    - Path endpoint, contoh: '/api/materi/{id}/upload'
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
  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

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
