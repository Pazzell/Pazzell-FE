/**
 * What a question asks. A picture card saved without a caption still needs a prompt, so it
 * asks "What is this?", the same wording the server gives captioned picture cards.
 */
export function questionPrompt(question: { type: string; text?: string | null }): string | null {
  const text = question.text?.trim();
  if (text) return text;
  return question.type === "image" ? "What is this?" : null;
}
