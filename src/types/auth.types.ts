/**
 * Auth Types untuk API Nalara
 * Sesuai dengan schema OpenAPI /api/auth/login dan /api/auth/logout
 */

// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
}

// ─── Response Shapes ──────────────────────────────────────────────────────────

/** Data user yang dikembalikan setelah login berhasil */
export interface AuthUser {
  email: string;
  name: string;
  role: string;
}

/** Payload data di dalam response login */
export interface LoginData {
  user: AuthUser;
  token: string;
}

/** Response sukses login dari POST /api/auth/login */
export interface LoginResponse {
  success: boolean;
  message: string;
  data?: LoginData;
}

/** Response logout dari POST /api/auth/logout */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

// ─── Generic API Response ─────────────────────────────────────────────────────

export interface ApiError {
  success: false;
  message: string;
}
