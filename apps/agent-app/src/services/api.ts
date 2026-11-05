import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// Use the shared Axios singleton so legacy pages importing axios directly
// receive the same token and single-flight refresh interceptors.
const api = axios;
const API_BASE_URL = API_URL.endsWith("/") ? API_URL.slice(0, -1) : API_URL;
api.defaults.baseURL = API_BASE_URL;
api.defaults.timeout = 45000;

const configuredApiPath = (() => {
  try {
    const pathname = new URL(API_BASE_URL || "/api", window.location.origin).pathname;
    return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  } catch {
    return "";
  }
})();
// Do not set a global Content-Type. Axios must set the multipart boundary
// itself for FormData uploads; JSON requests are serialized automatically.

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
  // Older helpers pass a full "/api/..." path while newer pages call
  // "/agent/..." or "/catalog/..." relative to the configured API base.
  // Strip an already-present API prefix before Axios combines baseURL.
  if (
    configuredApiPath &&
    config.url &&
    config.url.startsWith(configuredApiPath + "/") &&
    !config.url.startsWith("http://") &&
    !config.url.startsWith("https://")
  ) {
    config.url = config.url.slice(configuredApiPath.length);
  }
  const token = localStorage.getItem("agent_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    if (error.code === "ECONNABORTED") {
      error.message = "GasMobil is taking too long to respond. Check your connection and try again.";
    } else if (!error.response) {
      error.message = "We couldn't connect to GasMobil. Check your internet connection and try again.";
    } else if (error.response.status === 429) {
      error.response.data = { ...(error.response.data || {}), error: "Too many requests were made. Please wait a moment and try again." };
    } else if (error.response.status >= 500) {
      error.response.data = { ...(error.response.data || {}), error: "GasMobil is temporarily unavailable. Please try again shortly." };
    }
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
    } catch (refreshError: any) {
      const refreshStatus = refreshError?.response?.status;
      if (refreshStatus === 400 || refreshStatus === 401 || refreshStatus === 403) {
        clearAgentSession();
      }
      // Keep the saved session during network/5xx outages; a later request can retry.
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
  const isAbsoluteUrl = url.startsWith("https://") || url.startsWith("http://");
  const fullUrl = isAbsoluteUrl
    ? url
    : `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
  const response = await api.request<ApiResponse<T>>({ method, url: fullUrl, data });
  return response.data;
}

export default api;
