import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { BASE_URL } from "@/app/_utils/constants";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import type { ApiErrorBody, UserData } from "@/types";

const USER_STORAGE_KEY = "user";

export function readStoredUser(): UserData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserData) : null;
  } catch {
    return null;
  }
}

function writeStoredUser(user: UserData | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const user = readStoredUser();
  if (user?.accessToken && !config.headers?.Authorization) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${user.accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ accessToken: string }>(
        `${BASE_URL}${ENDPOINTS.REFRESH}`,
        {},
        { withCredentials: true }
      )
      .then((res) => res.data.accessToken)
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function redirectToLogin() {
  writeStoredUser(null);
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true;
      const newToken = await refreshAccessToken();

      if (newToken) {
        const user = readStoredUser();
        if (user) writeStoredUser({ ...user, accessToken: newToken });
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

/** The API's `{ message, code, details }` error body, when the failure came from the server. */
export function getApiError(error: unknown): ApiErrorBody | undefined {
  return axios.isAxiosError<ApiErrorBody>(error) ? error.response?.data : undefined;
}

export default api;
