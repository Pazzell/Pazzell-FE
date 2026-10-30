import { routes } from "@/app/_utils/routes";
import { isAiTrivia, isPersonalTrivia } from "@/lib/return-path";
import type { TriviaSourceType } from "@/types";

/**
 * Where "leave" and "done" lead from a trivia session. An owner or brand test
 * play goes back to what they were building; everyone else goes to the topics.
 */
export function sessionExit(
  source: { type: TriviaSourceType; id: string },
  isPreview: boolean
): { href: string; label: string } {
  if (isPreview && source.type === "custom") {
    return { href: routes.USER.MY_QUIZ_EDIT(source.id), label: "Back to Quiz" };
  }
  if (isPreview && source.type === "campaign") {
    return { href: routes.BRAND.CAMPAIGN_EDIT(source.id), label: "Back to Campaign" };
  }
  if (source.type === "custom" && isAiTrivia(source.id)) {
    return { href: routes.USER.AI_TRIVIA, label: "Back to AI Trivia" };
  }
  if (source.type === "custom" && isPersonalTrivia(source.id)) {
    return { href: routes.USER.MY_TRIVIA, label: "Back to My Trivia" };
  }
  return { href: routes.USER.TRIVIA, label: "Pick Another Topic" };
}
