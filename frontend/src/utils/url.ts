const defaultApiBaseUrl = "http://localhost:3000/api";

export const getApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_URL || defaultApiBaseUrl;
  return String(configured).replace(/\/+$/, "");
};

export const getBackendUrl = (path: string) => {
  const apiBaseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
};

export const getSocketUrl = () => {
  const configured = import.meta.env.VITE_SOCKET_URL;

  if (configured) {
    return String(configured).replace(/\/+$/, "");
  }

  return getApiBaseUrl().replace(/\/api$/, "");
};
