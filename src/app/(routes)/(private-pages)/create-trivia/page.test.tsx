import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/layout/main-layout", () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import CreateTriviaPage from "./page";

describe("Create Trivia page", () => {
  it("offers AI generated and manually created trivia", () => {
    render(<CreateTriviaPage />);
    expect(screen.getByRole("link", { name: "Create Trivia" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /AI generated/ })).toHaveAttribute("href", "/ai-trivia");
    expect(screen.getByRole("link", { name: /Manually created/ })).toHaveAttribute(
      "href",
      "/create-trivia/manual"
    );
  });
});
