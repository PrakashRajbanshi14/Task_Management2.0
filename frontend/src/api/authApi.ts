
import api from "./axios";

import type {
  AuthResponse,
  AuthData,
  LoginRequest,
  RegisterRequest,
  RefreshTokenResponse,
  User,
} from "../types/auth";


// ==========================================
// REGISTER
// ==========================================

export const register = async (
  data: RegisterRequest,
): Promise<AuthResponse<AuthData>> => {

  const response = await api.post<AuthResponse<AuthData>>(
    "/auth/register",
    data,
  );

  return response.data;
};


// ==========================================
// LOGIN
// ==========================================

export const login = async (
  data: LoginRequest,
): Promise<AuthResponse<AuthData>> => {

  const response = await api.post<AuthResponse<AuthData>>(
    "/auth/login",
    data,
  );

  return response.data;
};


// ==========================================
// GOOGLE LOGIN
// ==========================================

export const googleLogin = (): void => {

  window.location.href =
    `${import.meta.env.VITE_API_URL}/auth/google`;
};


// ==========================================
// REFRESH ACCESS TOKEN
// ==========================================

export const refreshAccessToken = async (): Promise<
  RefreshTokenResponse
> => {

  const response =
    await api.post<RefreshTokenResponse>(
      "/auth/refresh",
    );

  return response.data;
};


// ==========================================
// LOGOUT
// ==========================================

export const logout = async (): Promise<
  AuthResponse
> => {

  const response =
    await api.post<AuthResponse>(
      "/auth/logout",
    );

  return response.data;
};


// ==========================================
// GET CURRENT USER
// ==========================================

export const getMyAccount =
  async (): Promise<AuthResponse<User>> => {

    const response =
      await api.get<AuthResponse<User>>(
        "/auth/me",
      );

    return response.data;
  };

