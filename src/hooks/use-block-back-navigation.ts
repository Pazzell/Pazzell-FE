import { useEffect } from "react";

/**
 * Traps the browser back button while `active` is true by re-pushing the
 * current history entry whenever a popstate fires. Used so a player can't
 * navigate back mid-question (the server only ever serves
 * the current question — there's nothing sane to go "back" to).
 */
export function useBlockBackNavigation(active: boolean) {
  useEffect(() => {
    if (!active) return;

    window.history.pushState(null, "", window.location.href);
    const onPopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [active]);
}
