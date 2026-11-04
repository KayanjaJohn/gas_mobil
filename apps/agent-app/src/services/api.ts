import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// Use the shared Axios singleton so legacy pages importing axios directly
// receive the same token and single-flight refresh interceptors.
const api = axios;
api.defaults.timeout = 30000;
api.defaults.headers.common["Content-Type"] = "application/json";

type RetriableRequest = InternalAxiosRequestConfig & { _gasmobilRetry?: boolean };
let refreshInFlight: Promise<string> | null = null;

function clearAgentSession() {
  localStorage.removeItem("agent_token");
  localStorage.removeItem("agent_refresh_token");
  localStorage.removeItem("agent_user");
  delete api.defaults.headers.common.Authorization;
  window.dispatchEvent(new Event("gasmobil:session-expired"));
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("agent_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const request = error.config as RetriableRequest | undefined;
    const status = error.response?.status;
    const url = request?.url || "";

    if (
      status !== 401 ||
      !request ||
      request._gasmobilRetry ||
      /\/auth\/(login|refresh)/i.test(url)
    ) {
      return Promise.reject(error);
    }

    request._gasmobilRetry = true;

    try {
      const savedRefreshToken = localStorage.getItem("agent_refresh_token");
      if (!savedRefreshToken) {
        clearAgentSession();
        return Promise.reject(error);
      }

      if (!refreshInFlight) {
        refreshInFlight = axios.post(
          `${API_URL}/auth/refresh`,
          { refreshToken: savedRefreshToken },
          { timeout: 20000 }
        ).then((response) => {
          const payload = response.data?.data || response.data;
          const accessToken = payload?.accessToken || payload?.token;
          const nextRefreshToken = payload?.refreshToken;

          if (!accessToken) {
            throw new Error("The refresh endpoint did not return an access token.");
          }

          localStorage.setItem("agent_token", accessToken);
          if (nextRefreshToken) {
            localStorage.setItem("agent_refresh_token", nextRefreshToken);
          }
          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          window.dispatchEvent(new CustomEvent("gasmobil:token-refreshed", {
            detail: { token: accessToken },
          }));
          return accessToken as string;
        }).finally(() => {
          refreshInFlight = null;
        });
      }

      const newToken = await refreshInFlight;
      request.headers = request.headers || ({} as any);
      request.headers.Authorization = `Bearer ${newToken}`;
      return api.request(request);
    } catch (refreshError) {
      clearAgentSession();
      return Promise.reject(refreshError);
    }
  }
);

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export async function apiRequest<T>(
  method: "get" | "post" | "put" | "delete" | "patch",
  url: string,
  data?: unknown
): Promise<ApiResponse<T>> {
  const fullUrl = /^https?:\\/\\//i.test(url)
    ? url
    : `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
  const response = await api.request<ApiResponse<T>>({ method, url: fullUrl, data });
  return response.data;
}

export default api;
