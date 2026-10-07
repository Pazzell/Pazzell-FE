const RETURN_PATH_KEY = "pazzell_return_to";
const QUIZ_SLUG_KEY_PREFIX = "pazzell_quiz_slug_";

/**
 * Where to send a visitor after they log in or sign up, e.g. back to the
 * shared quiz link (`/q/:slug`) they opened while logged out.
 */
export function setReturnPath(path: string) {
  try {
    sessionStorage.setItem(RETURN_PATH_KEY, path);
  } catch {}
}

export function getReturnPath(): string | null {
  try {
    const path = sessionStorage.getItem(RETURN_PATH_KEY);
    // Only ever an in-app share link — never an arbitrary or external URL.
    return path && /^\/q\/[\w-]+$/.test(path) ? path : null;
  } catch {
    return null;
  }
}

export function clearReturnPath() {
  try {
    sessionStorage.removeItem(RETURN_PATH_KEY);
  } catch {}
}

/**
 * A shared quiz is started by slug, but a session only knows the quiz id.
 * Remembering the pair lets Retry on the result screen start it again.
 */
export function rememberQuizSlug(quizId: string, slug: string) {
  try {
    sessionStorage.setItem(QUIZ_SLUG_KEY_PREFIX + quizId, slug);
  } catch {}
}

export function recallQuizSlug(quizId: string): string | null {
  try {
    return sessionStorage.getItem(QUIZ_SLUG_KEY_PREFIX + quizId);
  } catch {
    return null;
  }
}
