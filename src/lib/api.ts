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

// No `withCredentials`: the API answers with `Access-Control-Allow-Origin: *`, and a
// browser refuses a credentialed cross-origin request under a wildcard origin. Auth
// travels in the Authorization header instead.
export const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const user = readStoredUser();
  if (user?.accessToken && !config.headers?.Authorization) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${user.accessToken}`;
  }
  return config;
});

// What the API's auth check answers when the access token is expired, malformed or
// belongs to a closed session. It uses 400 for these, and 401 only for a missing header.
const TOKEN_FAILURE_MESSAGES = new Set([
  "jwt expired",
  "jwt malformed",
  "invalid token",
  "invalid signature",
  "Access token not valid",
  "User not found",
]);

function isAuthFailure(error: AxiosError): boolean {
  const status = error.response?.status;
  if (status === 401) return true;
  if (status !== 400 || !error.config?.headers?.Authorization) return false;
  const message = (error.response?.data as { message?: unknown } | undefined)?.message;
  return typeof message === "string" && TOKEN_FAILURE_MESSAGES.has(message);
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    // The refresh token is sent in the body: a cross-site cookie can't be relied on.
    refreshPromise = axios
      .post<{ accessToken: string }>(`${BASE_URL}${ENDPOINTS.REFRESH}`, {
        refreshToken: readStoredUser()?.refreshToken,
      })
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

    if (isAuthFailure(error) && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true;
      const newToken = await refreshAccessToken();

      if (newToken) {
        const user = readStoredUser();
        if (user) writeStoredUser({ ...user, accessToken: newToken });
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      // Nobody was logged in to begin with: let the caller handle the error.
      if (readStoredUser()) redirectToLogin();
    }

    return Promise.reject(error);
  }
);

/** The API's `{ message, code, details }` error body, when the failure came from the server. */
export function getApiError(error: unknown): ApiErrorBody | undefined {
  return axios.isAxiosError<ApiErrorBody>(error) ? error.response?.data : undefined;
}

/** Closes the server session. Best effort: the local sign-out goes ahead either way. */
export function logoutFromServer() {
  if (!readStoredUser()?.accessToken) return;
  axios
    .post(
      `${BASE_URL}${ENDPOINTS.LOGOUT}`,
      {},
      { headers: { Authorization: `Bearer ${readStoredUser()?.accessToken}` } }
    )
    .catch(() => {});
}

export default api;
