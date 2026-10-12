import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiError, renderWithQuery } from "@/test-utils";

const { api } = vi.hoisted(() => ({ api: { get: vi.fn(), post: vi.fn() } }));

vi.mock("@/lib/api", () => ({
  api,
  getApiError: (e: { response?: { data?: unknown } }) => e?.response?.data,
}));

import { LoadStarterDialog } from "./load-starter-dialog";

const topic = (slug: string, name: string, total: number, missing: number, topicId: string | null) => ({
  slug,
  name,
  description: "",
  topicId,
  total,
  missing,
});

const loaded = {
  created: 54,
  topics: [
    { slug: "music-theory-beginner", name: "Music Theory: Beginner", topicId: "t1", topicCreated: true, created: 44 },
    { slug: "biology", name: "Biology", topicId: "t2", topicCreated: false, created: 10 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({
    data: {
      topics: [
        topic("football", "Football", 20, 0, "t0"),
        topic("biology", "Biology", 20, 10, "t2"),
        topic("music-theory-beginner", "Music Theory: Beginner", 44, 44, null),
      ],
    },
  });
  api.post.mockResolvedValue({ data: { loaded } });
});

describe("LoadStarterDialog", () => {
  it("preselects the topics with something to add and reports what was added", async () => {
    const onLoaded = vi.fn();
    renderWithQuery(<LoadStarterDialog open onOpenChange={vi.fn()} onLoaded={onLoaded} />);

    // Fully loaded: shown, but not selectable.
    const football = await screen.findByRole("checkbox", { name: "Football" });
    expect(football).toBeDisabled();
    expect(football).not.toBeChecked();
    expect(screen.getByText("All 20 questions loaded")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Biology" })).toBeChecked();
    expect(screen.getByText("10 of 20 questions to add")).toBeInTheDocument();
    expect(screen.getByText("44 questions to add · creates the topic")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Add 54 questions" }));

    expect(await screen.findByText("Added 54 questions to 2 topics.")).toBeInTheDocument();
    expect(screen.getByText("Music Theory: Beginner: 44 questions (new topic)")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/admin/trivia/starter", {
      slugs: ["biology", "music-theory-beginner"],
    });
    expect(onLoaded).toHaveBeenCalledWith(loaded);
  });

  it("loads only the topics left ticked", async () => {
    renderWithQuery(<LoadStarterDialog open onOpenChange={vi.fn()} onLoaded={vi.fn()} />);

    await userEvent.click(await screen.findByRole("checkbox", { name: "Biology" }));
    await userEvent.click(screen.getByRole("button", { name: "Add 44 questions" }));

    await screen.findByText(/Added/);
    expect(api.post).toHaveBeenCalledWith("/admin/trivia/starter", { slugs: ["music-theory-beginner"] });
  });

  it("has nothing to send when no topic is ticked", async () => {
    renderWithQuery(<LoadStarterDialog open onOpenChange={vi.fn()} onLoaded={vi.fn()} />);

    await userEvent.click(await screen.findByRole("checkbox", { name: "Biology" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Music Theory: Beginner" }));

    expect(screen.getByRole("button", { name: "Add questions" })).toBeDisabled();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("stays on the list when the server refuses", async () => {
    api.post.mockRejectedValue(apiError(400, "INVALID_STARTER_TOPIC"));
    renderWithQuery(<LoadStarterDialog open onOpenChange={vi.fn()} onLoaded={vi.fn()} />);

    await screen.findByRole("checkbox", { name: "Biology" });
    await userEvent.click(screen.getByRole("button", { name: "Add 54 questions" }));

    expect(await screen.findByRole("button", { name: "Add 54 questions" })).toBeEnabled();
    expect(screen.queryByText(/Added/)).not.toBeInTheDocument();
  });
});
