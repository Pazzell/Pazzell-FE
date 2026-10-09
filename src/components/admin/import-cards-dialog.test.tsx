import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { apiError, renderWithQuery } from "@/test-utils";

const { api } = vi.hoisted(() => ({ api: { get: vi.fn(), post: vi.fn() } }));

vi.mock("@/lib/api", () => ({
  api,
  getApiError: (e: { response?: { data?: unknown } }) => e?.response?.data,
}));

import { ImportCardsDialog } from "./import-cards-dialog";

const result = (overrides: object = {}) => ({
  category: "animals",
  topic: { id: "t9", name: "Animals", slug: "animals" },
  requested: 20,
  created: 19,
  skipped: { unusableLicense: 1, imageFailed: 0, noWrongOption: 0 },
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({
    data: {
      categories: [
        { key: "animals", topicName: "Animals", topicSlug: "animals", supportsCountry: false },
        { key: "footballers", topicName: "Football", topicSlug: "football", supportsCountry: true },
      ],
      countries: ["mixed", "worldwide", "nigeria", "ghana"],
      maxCount: 50,
    },
  });
  api.post.mockResolvedValue({ data: { import: result() } });
});

describe("ImportCardsDialog", () => {
  it("imports a category into its own topic and reports what was added and skipped", async () => {
    const onImported = vi.fn();
    renderWithQuery(<ImportCardsDialog open onOpenChange={vi.fn()} onImported={onImported} />);

    await screen.findByRole("radio", { name: "Animals" });
    // Not a people category: no country choice.
    expect(screen.queryByLabelText("People from")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Import cards" }));

    expect(await screen.findByText(/Added 19 of 20 cards to/)).toBeInTheDocument();
    expect(screen.getByText("1 skipped: picture not under a free licence")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/admin/trivia/import", { category: "animals", count: 20 });
    expect(onImported).toHaveBeenCalledWith(result());
    expect(screen.getByRole("link", { name: "Open topic" })).toHaveAttribute("href", "/admin/topics/t9");
  });

  it("sends the topic and the chosen country for a people category", async () => {
    renderWithQuery(
      <ImportCardsDialog
        open
        onOpenChange={vi.fn()}
        topic={{ id: "t1", name: "Football" }}
        onImported={vi.fn()}
      />
    );

    await userEvent.click(await screen.findByRole("radio", { name: "Footballers" }));
    await userEvent.selectOptions(screen.getByLabelText("People from"), "ghana");
    const count = screen.getByLabelText(/How many cards/);
    await userEvent.clear(count);
    await userEvent.type(count, "5");
    await userEvent.click(screen.getByRole("button", { name: "Import cards" }));

    await screen.findByText(/Added 19 of 20 cards to/);
    expect(api.post).toHaveBeenCalledWith("/admin/trivia/import", {
      category: "footballers",
      count: 5,
      topicId: "t1",
      country: "ghana",
    });
    // Already on the topic's page: no link to it.
    expect(screen.queryByRole("link", { name: "Open topic" })).not.toBeInTheDocument();
  });

  it("rejects a count outside the allowed range without calling the server", async () => {
    renderWithQuery(<ImportCardsDialog open onOpenChange={vi.fn()} onImported={vi.fn()} />);

    const count = await screen.findByLabelText(/How many cards/);
    await userEvent.clear(count);
    await userEvent.type(count, "51");
    await userEvent.click(screen.getByRole("button", { name: "Import cards" }));

    expect(api.post).not.toHaveBeenCalled();
  });

  it("stays on the form when the picture source is unavailable", async () => {
    api.post.mockRejectedValue(apiError(502, "IMPORT_SOURCE_UNAVAILABLE"));
    renderWithQuery(<ImportCardsDialog open onOpenChange={vi.fn()} onImported={vi.fn()} />);

    await screen.findByRole("radio", { name: "Animals" });
    await userEvent.click(screen.getByRole("button", { name: "Import cards" }));

    expect(await screen.findByRole("button", { name: "Import cards" })).toBeEnabled();
    expect(screen.queryByText(/Added/)).not.toBeInTheDocument();
  });
});
