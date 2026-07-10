import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createStore, Provider } from "jotai";
import { userAtom } from "@/atom/user";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/user/wallet",
}));

let bankAccounts: { _id: string; accountName: string; bankName: string; accountNumber: string }[] = [
  { _id: "b1", accountName: "Jane Doe", bankName: "GTBank", accountNumber: "0123456789" },
];
let withdrawalPostCalls: { body: any }[] = [];
let failNextWithdrawal = false;

vi.mock("axios", () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url.includes("/wallet/balance")) {
        return Promise.resolve({ data: { balance: 1000, currency: "NGN" } });
      }
      if (url.includes("/wallet/transactions")) {
        return Promise.resolve({ data: { success: true, transactions: [] } });
      }
      if (url.includes("/wallet/bank-accounts")) {
        return Promise.resolve({ data: { success: true, bankAccounts } });
      }
      if (url.includes("/wallet/withdrawals")) {
        return Promise.resolve({ data: { success: true, withdrawals: [] } });
      }
      return Promise.reject(new Error(`Unhandled GET ${url}`));
    }),
    post: vi.fn((url: string, body: any) => {
      if (url.includes("/wallet/bank-accounts")) {
        const newAccount = {
          _id: "b2",
          accountName: "Resolved Name",
          bankName: body.bankName,
          accountNumber: body.accountNumber,
        };
        bankAccounts = [...bankAccounts, newAccount];
        return Promise.resolve({ data: { bankAccount: newAccount } });
      }
      if (url.includes("/wallet/withdrawals")) {
        withdrawalPostCalls.push({ body });
        if (failNextWithdrawal) {
          failNextWithdrawal = false;
          return Promise.reject({ response: { data: { message: "Provider error" } } });
        }
        return Promise.resolve({ data: { success: true } });
      }
      return Promise.reject(new Error(`Unhandled POST ${url}`));
    }),
    delete: vi.fn(() => Promise.resolve({ data: { success: true } })),
  },
}));

import WalletPage from "./page";

function renderPage() {
  const store = createStore();
  store.set(userAtom, {
    id: "user1",
    fullName: "Test User",
    email: "user@test.com",
    userType: "gamer" as const,
    isVerified: true,
    createdAt: "2026-01-01",
    accessToken: "test-token",
    refreshToken: "test-refresh",
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <WalletPage />
      </QueryClientProvider>
    </Provider>
  );
}

describe("WalletPage", () => {
  beforeEach(() => {
    bankAccounts = [
      { _id: "b1", accountName: "Jane Doe", bankName: "GTBank", accountNumber: "0123456789" },
    ];
    withdrawalPostCalls = [];
    failNextWithdrawal = false;
  });

  it("shows the wallet balance", async () => {
    renderPage();
    expect(await screen.findByTestId("wallet-balance")).toHaveTextContent("₦1,000");
  });

  it("shows the resolved account name after adding a bank account", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByTestId("wallet-balance");

    await user.type(screen.getByPlaceholderText("Account number"), "9988776655");
    await user.type(screen.getByPlaceholderText("Bank name"), "Zenith Bank");
    await user.type(screen.getByPlaceholderText("Bank code"), "057");
    await user.click(screen.getByRole("button", { name: /add bank account/i }));

    expect(
      await screen.findByText(/resolved account name: resolved name/i)
    ).toBeInTheDocument();
  });

  it("blocks a withdrawal request that exceeds the available balance", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByTestId("wallet-balance");

    await user.type(screen.getByPlaceholderText("Amount"), "5000");
    await user.click(screen.getByRole("button", { name: /request withdrawal/i }));

    expect(await screen.findByText(/exceeds your available balance/i)).toBeInTheDocument();
    expect(withdrawalPostCalls).toHaveLength(0);
  });

  it("reuses the same idempotency key when retrying a failed withdrawal", async () => {
    failNextWithdrawal = true;
    const user = userEvent.setup();
    renderPage();
    await screen.findByTestId("wallet-balance");

    await user.type(screen.getByPlaceholderText("Amount"), "500");
    fireEvent.click(screen.getByRole("combobox"));
    const listbox = await screen.findByRole("listbox");
    fireEvent.click(within(listbox).getByText(/gtbank/i));

    await user.click(screen.getByRole("button", { name: /request withdrawal/i }));
    await waitFor(() => expect(withdrawalPostCalls).toHaveLength(1));
    expect(await screen.findByText(/provider error/i)).toBeInTheDocument();

    const retryButton = await screen.findByRole("button", { name: /retry withdrawal/i });
    await user.click(retryButton);
    await waitFor(() => expect(withdrawalPostCalls).toHaveLength(2));

    const firstKey = withdrawalPostCalls[0].body.idempotencyKey;
    const secondKey = withdrawalPostCalls[1].body.idempotencyKey;
    expect(firstKey).toBeTruthy();
    expect(secondKey).toBe(firstKey);
  });
});
