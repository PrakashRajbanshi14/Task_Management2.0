
import axios from "axios";
import { getApiBaseUrl } from "../utils/url";


// ==========================================
// AXIOS INSTANCE
// ==========================================

const baseURL =
  getApiBaseUrl();

const api = axios.create({
  baseURL,

  // Important because your backend
  // authentication uses HTTP-only cookies.
  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },
});


// ==========================================
// REQUEST INTERCEPTOR
// ==========================================

api.interceptors.request.use(
  (config) => {
    return config;
  },

  (error) => {
    return Promise.reject(error);
  },
);


// ==========================================
// RESPONSE INTERCEPTOR
// ==========================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 503) {
      window.location.assign("/maintenance");
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !String(originalRequest.url).includes("/auth/refresh") &&
      !String(originalRequest.url).includes("/auth/login")
    ) {
      originalRequest._retry = true;

      try {
        await api.post("/auth/refresh");
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      console.error(
        "API Error:",
        error.response.status,
        error.response.data,
      );
    } else {
      console.error(
        "Network Error:",
        error.message,
      );
    }

    return Promise.reject(error);
  },
);


export default api;
