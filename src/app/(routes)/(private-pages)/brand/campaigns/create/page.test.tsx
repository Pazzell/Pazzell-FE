import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { atom } from "jotai";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/atom/user", () => ({
  userAtom: atom({
    id: "brand1",
    fullName: "Test Brand",
    email: "brand@test.com",
    userType: "brand",
    isVerified: true,
    createdAt: "2026-01-01",
    accessToken: "test-token",
    refreshToken: "test-refresh",
  }),
}));

const hoisted = vi.hoisted(() => ({
  capturedFormData: null as FormData | null,
}));

vi.mock("axios", () => {
  const get = vi.fn((url: string) => {
    if (url.includes("/packages")) {
      return Promise.resolve({
        data: {
          packages: [
            { _id: "pkg_basic", name: "basic", amount: 7000, priority: 1, description: "" },
          ],
        },
      });
    }
    if (url.includes("/payments/calculate-weekly-price")) {
      return Promise.resolve({
        data: {
          pricing: {
            packageType: "basic",
            weeklyPrice: 7000,
            durationWeeks: 1,
            totalAmount: 7000,
            timeLimitHours: 168,
          },
        },
      });
    }
    if (url.includes("/admin/config")) {
      return Promise.reject({ response: { status: 403 } });
    }
    return Promise.reject(new Error(`Unhandled GET ${url}`));
  });

  const post = vi.fn((url: string, body: unknown) => {
    if (url.includes("/brands/campaigns")) {
      hoisted.capturedFormData = body as FormData;
      return Promise.resolve({
        data: { success: true, campaign: { _id: "camp1", packageName: "basic" } },
      });
    }
    return Promise.reject(new Error(`Unhandled POST ${url}`));
  });

  return { default: { get, post } };
});

vi.mock("./wizard-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./wizard-utils")>();
  return {
    ...actual,
    getVideoDuration: vi.fn().mockResolvedValue(90),
  };
});

import CreateCampaignWizardPage from "./page";

function renderWizard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CreateCampaignWizardPage />
    </QueryClientProvider>
  );
}

const makeFile = (name: string, type: string) => new File(["x".repeat(20)], name, { type });

async function fillWordHuntStep(user: ReturnType<typeof userEvent.setup>) {
  const words = ["apple", "banana", "cherry", "date", "eagle", "flute", "grape"];
  for (let i = 0; i < words.length; i++) {
    const input = screen.getByLabelText(`Word ${i + 1}`);
    await user.clear(input);
    await user.type(input, words[i]);
  }
}

// correctIndex defaults to 0 ("Option A") for every question, which is
// already a valid selection, so this only needs to fill text fields.
async function fillQuizStep(user: ReturnType<typeof userEvent.setup>) {
  const questionInputs = screen.getAllByLabelText("Question");
  const choiceLabels = ["Choice A", "Choice B", "Choice C", "Choice D"];
  for (let q = 0; q < 3; q++) {
    await user.type(questionInputs[q], `Sample question number ${q + 1}?`);
    const group = questionInputs[q].closest("div.space-y-4") as HTMLElement;
    for (const label of choiceLabels) {
      const choiceInput = within(group).getByLabelText(label);
      await user.type(choiceInput, `${label} text`);
    }
  }
}

describe("CreateCampaignWizardPage", () => {
  beforeEach(() => {
    pushMock.mockClear();
    hoisted.capturedFormData = null;
  });

  it("blocks advancing past step 0 until required fields are valid", async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.click(screen.getByRole("button", { name: /next/i }));

    // Still on step 0 — the Image step's heading should not be present.
    expect(screen.queryByRole("heading", { name: /campaign image/i })).not.toBeInTheDocument();
    expect(await screen.findAllByText(/at least 3 characters|at least 10 characters/i)).not.toHaveLength(0);
  });

  it("advances through the wizard and submits a draft with the expected FormData shape", async () => {
    const user = userEvent.setup();
    renderWizard();

    // Step 0: Details
    await user.type(screen.getByLabelText("Campaign Title"), "Summer Splash");
    await user.type(
      screen.getByLabelText("Description"),
      "A fun summer campaign for our brand fans"
    );
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Step 1: Image
    await screen.findByRole("heading", { name: /campaign image/i });
    const imageInput = screen.getByTestId("image-input");
    await user.upload(imageInput, makeFile("image.png", "image/png"));
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Step 2: Video (getVideoDuration mocked to resolve 90s, under the 130s default limit)
    await screen.findByRole("heading", { name: /brand video/i });
    const videoInput = screen.getByTestId("video-input");
    await user.upload(videoInput, makeFile("video.mp4", "video/mp4"));
    await screen.findByText(/looks good/i);
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Step 3: Word Hunt
    await screen.findByRole("heading", { name: /word hunt words/i });
    await fillWordHuntStep(user);
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Step 4: Prize
    await screen.findByRole("heading", { name: /^prize$/i });
    await user.type(
      screen.getByLabelText(/what players stand to win/i),
      "A brand-new pair of headphones"
    );
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Step 5: Quiz
    await screen.findByRole("heading", { name: /quiz questions/i });
    await fillQuizStep(user);
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Step 6: Package & Duration
    await screen.findByRole("heading", { name: /package & duration/i });
    await user.click(await screen.findByText("basic"));
    const priceSummary = await screen.findByTestId("price-summary");
    await waitFor(() => expect(within(priceSummary).getAllByText(/₦7,000/).length).toBeGreaterThan(0));
    await user.click(screen.getByRole("button", { name: /next/i }));

    // Step 7: Review + submit
    await screen.findByRole("heading", { name: /^review$/i });
    await user.click(screen.getByRole("button", { name: /submit campaign/i }));

    await user.click(await screen.findByRole("button", { name: /save as draft/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/brand/campaigns"));

    const fd = hoisted.capturedFormData;
    expect(fd).not.toBeNull();
    expect(fd!.get("title")).toBe("Summer Splash");
    expect(fd!.get("prizeDescription")).toBe("A brand-new pair of headphones");
    expect(fd!.get("packageId")).toBe("pkg_basic");
    expect(fd!.get("durationWeeks")).toBe("1");
    expect(JSON.parse(fd!.get("questions") as string)).toHaveLength(3);
    expect(JSON.parse(fd!.get("words") as string).length).toBeGreaterThanOrEqual(7);
  }, 30000);
});
