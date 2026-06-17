/**
 * Auth Service — Nalara Academy
 *
 * Mengonsumsi endpoint nyata dari Nalara API:
 *   POST /api/auth/login   → login dengan email & password
 *   POST /api/auth/logout  → logout dan invalidasi sesi
 *
 * Semua komunikasi HTTP dilakukan melalui `src/lib/api.ts`.
 */

import { apiPost } from '@/lib/api';
import type {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
} from '@/types/auth.types';

// ─── Re-export types agar komponen cukup import dari sini ─────────────────────
export type { LoginRequest, LoginResponse, LogoutResponse } from '@/types/auth.types';
export type { AuthUser, LoginData } from '@/types/auth.types';

// ─── Storage key ──────────────────────────────────────────────────────────────
const TOKEN_KEY = 'nalara_auth_token';

// ─── Fungsi utama ─────────────────────────────────────────────────────────────

/**
 * Login user menggunakan email dan password.
 *
 * Menghubungi POST /api/auth/login dan menyimpan token ke sessionStorage
 * (atau localStorage jika rememberMe = true).
 *
 * @returns LoginResponse dari server
 * @throws  Error dengan pesan dari server jika login gagal
 */
export async function loginApi(
  credentials: LoginRequest & { rememberMe?: boolean }
): Promise<LoginResponse> {
  const { email, password, rememberMe } = credentials;

  // Validasi sederhana di sisi client sebelum request dikirim
  if (!email || !email.includes('@')) {
    return { success: false, message: 'Format email tidak valid' };
  }
  if (!password || password.length < 1) {
    return { success: false, message: 'Password tidak boleh kosong' };
  }

  try {
    const response = await apiPost<LoginResponse>('/api/auth/login', {
      email,
      password,
    });

    // Simpan token jika login berhasil
    if (response.success && response.data?.token) {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(TOKEN_KEY, response.data.token);
    }

    return response;
  } catch (error) {
    // apiPost sudah melempar Error dengan pesan dari server
    const message =
      error instanceof Error
        ? error.message
        : 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
    return { success: false, message };
  }
}

/**
 * Logout user saat ini.
 *
 * Menghubungi POST /api/auth/logout dan membersihkan token dari storage.
 *
 * @returns LogoutResponse dari server
 */
export async function logoutApi(): Promise<LogoutResponse> {
  const token = getStoredToken();

  try {
    const response = await apiPost<LogoutResponse>(
      '/api/auth/logout',
      {},
      token ? { token } : {}
    );
    return response;
  } catch (error) {
    // Tetap lanjutkan logout lokal meskipun server error
    const message =
      error instanceof Error ? error.message : 'Logout gagal di sisi server';
    return { success: false, message };
  } finally {
    // Selalu hapus token dari storage saat logout
    clearStoredToken();
  }
}

// ─── Helper token management ──────────────────────────────────────────────────

/** Ambil token yang tersimpan (cek sessionStorage lalu localStorage) */
export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || null
  );
}

/** Hapus token dari semua storage */
export function clearStoredToken(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

/** Cek apakah user sedang login (ada token tersimpan) */
export function isAuthenticated(): boolean {
  return getStoredToken() !== null;
}
