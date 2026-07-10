"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import {
  WalletBalanceResponse,
  WalletTransactionsResponse,
  BankAccountsResponse,
  BankAccount,
  WithdrawalsResponse,
} from "@/types";
import { MainLayout } from "@/components/layout/main-layout";
import { PageLoader } from "@/components/ui/page-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wallet as WalletIcon,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowDownToLine,
  Landmark,
  Receipt,
} from "lucide-react";
import {
  generateIdempotencyKey,
  formatCurrency,
  validateWithdrawalAmount,
  WITHDRAWAL_STATUS_STYLES,
} from "./wallet-utils";

export default function WalletPage() {
  const user = useAtomValue(userAtom);
  const queryClient = useQueryClient();
  const authHeaders = { headers: { Authorization: `Bearer ${user?.accessToken}` } };

  const [bankForm, setBankForm] = useState({ accountNumber: "", bankCode: "", bankName: "" });
  const [addBankMessage, setAddBankMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedBankAccountId, setSelectedBankAccountId] = useState("");
  const [withdrawalIdempotencyKey, setWithdrawalIdempotencyKey] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState("");

  const { data: balance, isLoading: loadingBalance } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: () =>
      axios
        .get<WalletBalanceResponse>(endpointUrl(ENDPOINTS.WALLET_BALANCE), authHeaders)
        .then((res) => res.data),
    enabled: !!user?.accessToken,
  });

  const { data: transactionsData, isLoading: loadingTransactions } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: () =>
      axios
        .get<WalletTransactionsResponse>(
          endpointUrl(ENDPOINTS.WALLET_TRANSACTIONS(50)),
          authHeaders
        )
        .then((res) => res.data.transactions),
    enabled: !!user?.accessToken,
  });

  const { data: bankAccounts, isLoading: loadingBankAccounts } = useQuery({
    queryKey: ["wallet-bank-accounts"],
    queryFn: () =>
      axios
        .get<BankAccountsResponse>(endpointUrl(ENDPOINTS.WALLET_BANK_ACCOUNTS), authHeaders)
        .then((res) => res.data.bankAccounts),
    enabled: !!user?.accessToken,
  });

  const { data: withdrawals, isLoading: loadingWithdrawals } = useQuery({
    queryKey: ["wallet-withdrawals"],
    queryFn: () =>
      axios
        .get<WithdrawalsResponse>(endpointUrl(ENDPOINTS.WALLET_WITHDRAWALS), authHeaders)
        .then((res) => res.data.withdrawals),
    enabled: !!user?.accessToken,
  });

  // POST /wallet/bank-accounts resolves the account name via Paystack and
  // saves in the same call — there's no separate "preview" endpoint, so the
  // resolved name is shown right after saving rather than before.
  const addBankAccountMutation = useMutation({
    mutationFn: () =>
      axios
        .post<{ bankAccount: BankAccount }>(
          endpointUrl(ENDPOINTS.WALLET_BANK_ACCOUNTS),
          bankForm,
          authHeaders
        )
        .then((res) => res.data.bankAccount),
    onSuccess: (bankAccount) => {
      setAddBankMessage({
        type: "success",
        text: `Added — resolved account name: ${bankAccount.accountName}. If this isn't you, remove it below and try again.`,
      });
      setBankForm({ accountNumber: "", bankCode: "", bankName: "" });
      queryClient.invalidateQueries({ queryKey: ["wallet-bank-accounts"] });
    },
    onError: (error: any) => {
      setAddBankMessage({
        type: "error",
        text: error?.response?.data?.message ?? "Couldn't add this bank account. Please check the details and try again.",
      });
    },
  });

  const deleteBankAccountMutation = useMutation({
    mutationFn: (id: string) =>
      axios.delete(endpointUrl(ENDPOINTS.WALLET_BANK_ACCOUNT_DELETE(id)), authHeaders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-bank-accounts"] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (payload: { bankAccountId: string; amount: number; idempotencyKey: string }) =>
      axios.post(endpointUrl(ENDPOINTS.WALLET_WITHDRAWALS), payload, authHeaders),
    onSuccess: () => {
      setWithdrawAmount("");
      setSelectedBankAccountId("");
      setWithdrawalIdempotencyKey(null);
      setWithdrawError("");
      queryClient.invalidateQueries({ queryKey: ["wallet-withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
    },
    onError: (error: any) => {
      // Deliberately keep withdrawalIdempotencyKey unchanged so a retry
      // reuses the same key and can't create a duplicate withdrawal.
      setWithdrawError(
        error?.response?.data?.message ?? "Withdrawal failed. You can safely retry."
      );
    },
  });

  const handleAddBankAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setAddBankMessage(null);
    addBankAccountMutation.mutate();
  };

  const handleWithdraw = () => {
    setWithdrawError("");
    const amount = Number(withdrawAmount);
    const validation = validateWithdrawalAmount(amount, balance?.balance ?? 0);
    if (!validation.valid) {
      setWithdrawError(validation.message ?? "Invalid amount.");
      return;
    }
    if (!selectedBankAccountId) {
      setWithdrawError("Select a bank account.");
      return;
    }
    const key = withdrawalIdempotencyKey ?? generateIdempotencyKey();
    setWithdrawalIdempotencyKey(key);
    withdrawMutation.mutate({
      bankAccountId: selectedBankAccountId,
      amount,
      idempotencyKey: key,
    });
  };

  if (loadingBalance) {
    return <PageLoader message="Loading your wallet..." />;
  }

  return (
    <MainLayout maxWidth="4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 font-fredoka flex items-center gap-3">
            <WalletIcon className="h-8 w-8 text-secondary" />
            Wallet
          </h1>
          <p className="text-white/70">
            Your weekly cash winnings, and withdrawals to your bank account.
          </p>
        </div>

        {/* Balance */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardContent className="pt-6">
            <p className="text-white/60 text-xs uppercase tracking-wider mb-1">
              Available Balance
            </p>
            <p className="text-4xl font-bold text-white font-fredoka" data-testid="wallet-balance">
              {formatCurrency(balance?.balance ?? 0, balance?.currency ?? "NGN")}
            </p>
          </CardContent>
        </Card>

        {/* Bank Accounts */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-fredoka flex items-center gap-2">
              <Landmark className="h-5 w-5 text-secondary" />
              Bank Accounts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingBankAccounts ? (
              <Loader2 className="h-5 w-5 animate-spin text-secondary" />
            ) : bankAccounts && bankAccounts.length > 0 ? (
              <div className="space-y-2">
                {bankAccounts.map((acc) => (
                  <div
                    key={acc._id}
                    data-testid="bank-account-row"
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div>
                      <p className="text-white font-medium text-sm">{acc.accountName}</p>
                      <p className="text-white/50 text-xs">
                        {acc.bankName} &bull; ****{acc.accountNumber.slice(-4)}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={deleteBankAccountMutation.isPending}
                      onClick={() => deleteBankAccountMutation.mutate(acc._id)}
                      className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white/50 text-sm">No bank accounts added yet.</p>
            )}

            <form onSubmit={handleAddBankAccount} className="space-y-3 pt-2 border-t border-white/10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  placeholder="Account number"
                  value={bankForm.accountNumber}
                  onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  required
                />
                <Input
                  placeholder="Bank name"
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  required
                />
                <Input
                  placeholder="Bank code"
                  value={bankForm.bankCode}
                  onChange={(e) => setBankForm({ ...bankForm, bankCode: e.target.value })}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={addBankAccountMutation.isPending}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10">
                {addBankAccountMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Add Bank Account
              </Button>
              {addBankMessage && (
                <p
                  className={`text-sm flex items-start gap-2 ${
                    addBankMessage.type === "success" ? "text-green-400" : "text-red-400"
                  }`}>
                  {addBankMessage.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  {addBankMessage.text}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Withdraw */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-fredoka flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5 text-secondary" />
              Withdraw
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!bankAccounts || bankAccounts.length === 0 ? (
              <p className="text-white/60 text-sm">
                Add a bank account above before requesting a withdrawal.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                  />
                  <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select bank account" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10">
                      {bankAccounts.map((acc) => (
                        <SelectItem key={acc._id} value={acc._id} className="text-white hover:bg-white/10">
                          {acc.bankName} &bull; ****{acc.accountNumber.slice(-4)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleWithdraw}
                  disabled={withdrawMutation.isPending}
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                  {withdrawMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : withdrawError ? (
                    "Retry Withdrawal"
                  ) : (
                    "Request Withdrawal"
                  )}
                </Button>
                {withdrawError && (
                  <p className="text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {withdrawError}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Withdrawal history */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-fredoka">Withdrawal History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingWithdrawals ? (
              <div className="p-6">
                <Loader2 className="h-5 w-5 animate-spin text-secondary" />
              </div>
            ) : withdrawals && withdrawals.length > 0 ? (
              <div className="space-y-1">
                {withdrawals.map((w) => (
                  <div
                    key={w._id}
                    data-testid="withdrawal-row"
                    className="flex items-center justify-between p-4 border-b border-white/5 last:border-b-0">
                    <div>
                      <p className="text-white font-medium">{formatCurrency(w.amount)}</p>
                      <p className="text-white/50 text-xs">
                        {new Date(w.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize ${WITHDRAWAL_STATUS_STYLES[w.status]}`}>
                      {w.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-white/50 text-sm">No withdrawals yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Transaction history */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-fredoka flex items-center gap-2">
              <Receipt className="h-5 w-5 text-secondary" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingTransactions ? (
              <div className="p-6">
                <Loader2 className="h-5 w-5 animate-spin text-secondary" />
              </div>
            ) : transactionsData && transactionsData.length > 0 ? (
              <div className="space-y-1">
                {transactionsData.map((tx) => (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between p-4 border-b border-white/5 last:border-b-0">
                    <div>
                      <p className="text-white text-sm">{tx.description ?? tx.type}</p>
                      <p className="text-white/50 text-xs">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`font-mono font-semibold ${
                        tx.amount >= 0 ? "text-green-400" : "text-red-400"
                      }`}>
                      {tx.amount >= 0 ? "+" : ""}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-6 text-white/50 text-sm">No transactions yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
