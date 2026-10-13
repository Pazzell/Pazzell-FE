import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithQuery } from "@/test-utils";

const { api } = vi.hoisted(() => ({ api: { post: vi.fn(), patch: vi.fn() } }));

vi.mock("@/lib/api", () => ({
  api,
  getApiError: (e: { response?: { data?: unknown } }) => e?.response?.data,
}));

import { TopicFormDialog } from "./topic-form-dialog";

const topic = (imagePercent: number | null) => ({
  id: "t1",
  name: "Tech",
  slug: "tech",
  description: "Languages and tools",
  coverImageUrl: null,
  cardCount: 30,
  cardCountBounds: { available: 30, min: 5, max: 30 },
  isActive: true,
  imagePercent,
});

beforeEach(() => {
  vi.clearAllMocks();
  api.post.mockResolvedValue({ data: { topic: { id: "t9" } } });
  api.patch.mockResolvedValue({ data: { topic: { id: "t1" } } });
});

describe("TopicFormDialog", () => {
  it("follows the default picture share until the admin sets one with the slider", async () => {
    renderWithQuery(<TopicFormDialog open onOpenChange={vi.fn()} topic={null} onSaved={vi.fn()} />);
    expect(screen.getByRole("checkbox", { name: "Use the default" })).toBeChecked();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText("Name"), "Coding");
    await userEvent.click(screen.getByRole("checkbox", { name: "Use the default" }));
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "100");
    expect(screen.getByText("50% pictures")).toBeInTheDocument();

    slider.focus();
    await userEvent.keyboard("{Home}");
    expect(screen.getByText("0% pictures")).toBeInTheDocument();
    expect(screen.getByText("100% short definitions")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Create topic" }));
    await waitFor(() => expect(api.post).toHaveBeenCalled());
    expect(api.post.mock.calls[0][1]).toMatchObject({ name: "Coding", imagePercent: 0 });
  });

  it("shows a topic's saved share and can hand it back to the default", async () => {
    renderWithQuery(<TopicFormDialog open onOpenChange={vi.fn()} topic={topic(30)} onSaved={vi.fn()} />);
    expect(screen.getByText("30% pictures")).toBeInTheDocument();
    expect(screen.getByText("70% short definitions")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox", { name: "Use the default" }));
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save topic" }));
    await waitFor(() => expect(api.patch).toHaveBeenCalled());
    expect(api.patch.mock.calls[0][1]).toMatchObject({ imagePercent: "" });
  });
});
