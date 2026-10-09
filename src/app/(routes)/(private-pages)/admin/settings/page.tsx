"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLoader } from "@/components/ui/page-loader";
import { PageError } from "@/components/ui/page-error";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import type { AdminConfigResponse } from "@/types";

interface SettingDef {
  key: string;
  label: string;
  hint?: string;
  type: "integer" | "number" | "currency";
  min?: number;
  max?: number;
  /** Exclusive lower bound (prices must be above zero). */
  moreThan?: number;
  readOnly?: boolean;
}

// The settings table from the integration doc (section 9), grouped for the page.
const GROUPS: { title: string; settings: SettingDef[] }[] = [
  {
    title: "Timer",
    settings: [
      { key: "game.timerMinSeconds", label: "Minimum seconds per question", type: "integer", readOnly: true },
      { key: "game.timerMaxSeconds", label: "Maximum seconds per question", type: "integer", readOnly: true },
      { key: "match.defaultTimerSeconds", label: "Match default timer (seconds)", type: "integer", min: 1, max: 7 },
      { key: "game.submitGraceMs", label: "Late-answer grace (milliseconds)", hint: "Allowance for network delay after the deadline.", type: "integer", min: 0, max: 5000 },
    ],
  },
  {
    title: "Trivia",
    settings: [
      { key: "trivia.minCards", label: "Minimum cards per session", type: "integer", min: 1 },
      { key: "trivia.maxCards", label: "Maximum cards per session", type: "integer", min: 1 },
      { key: "trivia.imagePercent", label: "Image cards per session (%)", hint: "The rest are text cards. If a topic is short of one kind, the other fills the gap.", type: "integer", min: 0, max: 100 },
    ],
  },
  {
    title: "Custom trivia",
    settings: [
      { key: "customQuiz.freeLimit", label: "Free quizzes per player", type: "integer", min: 1 },
      { key: "customQuiz.minCardsToPublish", label: "Cards needed to publish", type: "integer", min: 1 },
    ],
  },
  {
    title: "Campaigns",
    settings: [
      { key: "campaign.priceAmount", label: "Campaign price", type: "number", moreThan: 0 },
      { key: "campaign.durationDays", label: "Campaign length (days)", type: "integer", min: 1 },
      { key: "campaign.minCardsToPublish", label: "Cards needed to go live", type: "integer", min: 1 },
      { key: "campaign.interruptionThreshold", label: "Trivias between sponsored ones", hint: "A freemium player sees a campaign after completing this many.", type: "integer", min: 1 },
    ],
  },
  {
    title: "Pro and payments",
    settings: [
      { key: "pro.priceAmount", label: "Pro price", type: "number", moreThan: 0 },
      { key: "pro.durationDays", label: "Pro length (days)", type: "integer", min: 1 },
      { key: "payments.currency", label: "Currency", hint: "A 3-letter code such as USD.", type: "currency" },
    ],
  },
];

/** The config map holds either the bare value or `{ value, description }` per key. */
function readValue(entry: unknown): string {
  const value =
    entry !== null && typeof entry === "object" && "value" in entry
      ? (entry as { value: unknown }).value
      : entry;
  return value === undefined || value === null ? "" : String(value);
}

/** Returns the value to send, or an error message. */
function parseValue(def: SettingDef, raw: string): { value: number | string } | { error: string } {
  const text = raw.trim();
  if (def.type === "currency") {
    return /^[A-Za-z]{3}$/.test(text)
      ? { value: text.toUpperCase() }
      : { error: "Use a 3-letter currency code." };
  }
  const value = Number(text);
  if (text === "" || !Number.isFinite(value)) return { error: "Enter a number." };
  if (def.type === "integer" && !Number.isInteger(value)) return { error: "Enter a whole number." };
  if (def.min !== undefined && value < def.min) return { error: `Must be at least ${def.min}.` };
  if (def.moreThan !== undefined && value <= def.moreThan) {
    return { error: `Must be more than ${def.moreThan}.` };
  }
  if (def.max !== undefined && value > def.max) return { error: `Must be at most ${def.max}.` };
  return { value };
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const { data: config, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-config"],
    queryFn: () =>
      api.get<AdminConfigResponse>(ENDPOINTS.ADMIN_CONFIG).then((res) => res.data.config),
  });

  useEffect(() => {
    if (!config) return;
    setDrafts(
      Object.fromEntries(
        GROUPS.flatMap((group) => group.settings).map((def) => [def.key, readValue(config[def.key])])
      )
    );
  }, [config]);

  const save = useMutation({
    mutationFn: ({ key, value }: { key: string; value: number | string }) =>
      api.put(ENDPOINTS.ADMIN_CONFIG_KEY(key), { value }),
    onSuccess: () => {
      toast.success("Setting saved.");
      queryClient.invalidateQueries({ queryKey: ["admin-config"] });
      // Players' setup screens read these through the public settings endpoint.
      queryClient.invalidateQueries({ queryKey: ["game-settings"] });
    },
    onError: (err) => {
      toast.error(getApiError(err)?.message || "Couldn't save the setting. Please try again.");
    },
  });

  const handleSave = (def: SettingDef) => {
    const parsed = parseValue(def, drafts[def.key] ?? "");
    if ("error" in parsed) {
      toast.error(`${def.label}: ${parsed.error}`);
      return;
    }
    save.mutate({ key: def.key, value: parsed.value });
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-white font-fredoka">Settings</h1>
        <p className="text-white/70">
          Global game, pricing and campaign settings. A price or length change only applies to
          checkouts started afterwards.
        </p>
      </div>

      {isLoading && <PageLoader message="Loading settings..." withLayout={false} />}

      {error && (
        <PageError
          title="Couldn't load settings"
          message="Please check your connection and try again."
          onRetry={() => refetch()}
          withLayout={false}
        />
      )}

      {config &&
        GROUPS.map((group) => (
          <section key={group.title} className="space-y-3">
            <h2 className="text-xl font-bold text-white font-fredoka">{group.title}</h2>
            <div className="rounded-2xl border border-white/10 bg-card/50 divide-y divide-white/10">
              {group.settings.map((def) => {
                const draft = drafts[def.key] ?? "";
                const changed = draft.trim() !== readValue(config[def.key]);
                const saving = save.isPending && save.variables?.key === def.key;
                return (
                  <div key={def.key} className="p-4 flex items-center gap-4 flex-wrap">
                    <label htmlFor={def.key} className="flex-1 min-w-[12rem]">
                      <span className="text-white font-medium block">{def.label}</span>
                      {def.hint && <span className="text-white/50 text-sm block">{def.hint}</span>}
                      <code className="text-white/30 text-xs">{def.key}</code>
                    </label>
                    {def.readOnly ? (
                      <span className="text-white/70 inline-flex items-center gap-2 text-sm">
                        <Lock className="h-4 w-4" aria-hidden />
                        {draft || "—"} (fixed)
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          id={def.key}
                          value={draft}
                          inputMode={def.type === "currency" ? "text" : "decimal"}
                          maxLength={def.type === "currency" ? 3 : undefined}
                          onChange={(event) =>
                            setDrafts((current) => ({ ...current, [def.key]: event.target.value }))
                          }
                          className="bg-white/5 border-white/10 text-white w-28"
                        />
                        <Button
                          onClick={() => handleSave(def)}
                          disabled={!changed || save.isPending}
                          className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
    </div>
  );
}
