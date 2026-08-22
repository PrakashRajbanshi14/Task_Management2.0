
import api from "./axios";
import { getBackendUrl } from "../utils/url";

import type {
  AuthResponse,
  AuthData,
  LoginRequest,
  RegisterRequest,
  RefreshTokenResponse,
  User,
  UserRole,
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
    getBackendUrl("/auth/google");
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

export const addEmployeeDetails = async (
  userId: string,
  data: {
    fullname: string;
    contact: string;
    address: string;
    jobTitle: string;
  },
): Promise<AuthResponse<User>> => {
  const response = await api.post<AuthResponse<User>>(
    `/auth/add-employee-details/${userId}`,
    data,
  );

  return response.data;
};

export const updateUserRole = async (
  userId: string,
  role: Extract<UserRole, "employee" | "projectManager">,
): Promise<AuthResponse> => {
  const endpoint =
    role === "employee"
      ? `/auth/update-role-to-employee/${userId}`
      : `/auth/update-role-to-project-manager/${userId}`;

  const response = await api.post<AuthResponse>(endpoint);

  return response.data;
};

