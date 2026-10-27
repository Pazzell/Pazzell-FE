import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios, { AxiosError, type AxiosAdapter } from "axios";
import { api } from "./api";
import { getReturnPath } from "./return-path";

// An expired session on a shared link: the refresh fails and the user is sent to log in.
const tokenExpired: AxiosAdapter = (config) =>
  Promise.reject(
    new AxiosError("expired", "ERR_BAD_REQUEST", config, null, {
      status: 400,
      statusText: "Bad Request",
      headers: {},
      config,
      data: { message: "jwt expired" },
    })
  );

describe("api session expiry", () => {
  const location = window.location;

  beforeEach(() => {
    sessionStorage.clear();
    localStorage.setItem("user", JSON.stringify({ accessToken: "old", refreshToken: "old" }));
    vi.spyOn(axios, "post").mockRejectedValue(new Error("refresh failed"));
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...location, pathname: "/q/AbC123", href: "http://localhost/q/AbC123" },
    });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(window, "location", { configurable: true, value: location });
  });

  it("remembers the shared quiz link so login brings the player back to it", async () => {
    await expect(api.get("/custom-quizzes/link/AbC123/play-info", { adapter: tokenExpired })).rejects.toBeTruthy();
    expect(window.location.href).toBe("/login");
    expect(localStorage.getItem("user")).toBeNull();
    expect(getReturnPath()).toBe("/q/AbC123");
  });
});
