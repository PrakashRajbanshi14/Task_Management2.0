
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import type {
  User,
  LoginRequest,
  RegisterRequest,
} from "../types/auth";

import {
  login as loginApi,
  register as registerApi,
  logout as logoutApi,
  getMyAccount,
} from "../api/authApi";
import { getErrorMessage } from "../utils/api";


// ==========================================
// AUTH STATE
// ==========================================

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  profileRequestId: string | null;
}


// ==========================================
// INITIAL STATE
// ==========================================

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  profileRequestId: null,
};

const normalizeUser = (value: unknown): User | null => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    const first = value[0] as { User?: User; user?: User } | undefined;
    return first?.User ?? first?.user ?? null;
  }

  const maybeWrapped = value as { user?: User; User?: User };
  return maybeWrapped.user ?? maybeWrapped.User ?? (value as User);
};


// ==========================================
// LOGIN
// ==========================================

export const loginUser = createAsyncThunk<
  User,
  LoginRequest,
  { rejectValue: string }
>(
  "auth/loginUser",

  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginApi(credentials);

      if (!response.success || !response.data) {
        return rejectWithValue(
          response.message || "Login failed",
        );
      }

      return normalizeUser(response.data) ?? response.data.user;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to login"),
      );
    }
  },
);


// ==========================================
// REGISTER
// ==========================================

export const registerUser = createAsyncThunk<
  User,
  RegisterRequest,
  { rejectValue: string }
>(
  "auth/registerUser",

  async (data, { rejectWithValue }) => {
    try {
      const response = await registerApi(data);

      if (!response.success || !response.data) {
        return rejectWithValue(
          response.message || "Registration failed",
        );
      }

      return normalizeUser(response.data) ?? response.data.user;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to register"),
      );
    }
  },
);


// ==========================================
// GET CURRENT USER
// ==========================================

export const fetchCurrentUser = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>(
  "auth/fetchCurrentUser",

  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyAccount();

      if (!response.success || !response.data) {
        return rejectWithValue(
          response.message || "Authentication failed",
        );
      }

      const user = normalizeUser(response.data);

      if (!user) {
        return rejectWithValue("Unable to read account profile");
      }

      return user;
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to fetch account"),
      );
    }
  },
);


// ==========================================
// LOGOUT
// ==========================================

export const logoutUser = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>(
  "auth/logoutUser",

  async (_, { rejectWithValue }) => {
    try {
      const response = await logoutApi();

      if (!response.success) {
        return rejectWithValue(
          response.message || "Logout failed",
        );
      }
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Unable to logout"),
      );
    }
  },
);


// ==========================================
// SLICE
// ==========================================

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },

    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.profileRequestId = null;
    },
  },

  extraReducers: (builder) => {

    // ========================================
    // LOGIN
    // ========================================

    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        // Ignore any session-restore request that began before this login.
        state.profileRequestId = null;
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error =
          action.payload || "Login failed";
      });


    // ========================================
    // REGISTER
    // ========================================

    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })

      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        state.profileRequestId = null;
      })

      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error =
          action.payload || "Registration failed";
      });


    // ========================================
    // CURRENT USER
    // ========================================

    builder
      .addCase(fetchCurrentUser.pending, (state, action) => {
        state.isLoading = true;
        state.profileRequestId = action.meta.requestId;
      })

      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        if (state.profileRequestId !== action.meta.requestId) {
          return;
        }

        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
        state.profileRequestId = null;
      })

      .addCase(fetchCurrentUser.rejected, (state, action) => {
        if (state.profileRequestId !== action.meta.requestId) {
          return;
        }

        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.profileRequestId = null;
      });


    // ========================================
    // LOGOUT
    // ========================================

    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.profileRequestId = null;
      })

      .addCase(logoutUser.rejected, (state) => {
        // Even if the backend logout request fails,
        // clear the frontend authentication state.
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
        state.profileRequestId = null;
      });
  },
});


export const {
  clearAuthError,
  clearAuth,
} = authSlice.actions;


export default authSlice.reducer;

