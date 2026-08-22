
import axios from "axios";


// ==========================================
// AXIOS INSTANCE
// ==========================================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,

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
    // We will add automatic token-refresh
    // handling here after authApi.ts is created.

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
