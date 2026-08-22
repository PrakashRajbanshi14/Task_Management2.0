// ==========================================
// USER ROLE
// ==========================================

export type UserRole =
  | "admin"
  | "projectManager"
  | "employee"
  | "user";


// ==========================================
// USER
// ==========================================

export interface User {
  id: string;
  userName: string;
  email: string;
  password: string | null;
  googleId: string | null;
  fullName: string;
  profileImage: string | null;
  role: UserRole;
  isActive: boolean;
}


// ==========================================
// AUTH RESPONSE
// ==========================================

export interface AuthResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}


// ==========================================
// LOGIN REQUEST
// ==========================================

export interface LoginRequest {
  email: string;
  password: string;
}


// ==========================================
// REGISTER REQUEST
// ==========================================

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
  fullName: string;
}


// ==========================================
// AUTH DATA
// ==========================================

export interface AuthData {
  user: User;
}


// ==========================================
// REFRESH TOKEN RESPONSE
// ==========================================

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data?: {
    accessToken?: string;
    user?: User;
  };
}


// ==========================================
// API ERROR
// ==========================================

export interface ApiError {
  success?: boolean;
  message: string;
  error?: string;
}