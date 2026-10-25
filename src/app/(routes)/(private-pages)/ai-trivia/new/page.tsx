"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Layers, Loader2, Sparkles } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/ui/page-error";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import { formatPrice } from "@/lib/utils";
import type { AiTriviaOptionsResponse, CreateAiTriviaResponse } from "@/types";

export default function NewAiTriviaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [topic, setTopic] = useState("");
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState<number | null>(null);

  const { data: options, isLoading, error, refetch } = useQuery({
    queryKey: ["ai-trivia-options"],
    queryFn: () =>
      api.get<AiTriviaOptionsResponse>(ENDPOINTS.AI_TRIVIA_OPTIONS).then((res) => res.data.options),
  });

  useEffect(() => {
    if (options && count === null) setCount(options.count.default);
  }, [options, count]);

  const create = useMutation({
    mutationFn: () => {
      const typed = topic.trim();
      // A typed name that is one of our topics is sent as that topic.
      const known = options?.topics.find((t) => t.name.toLowerCase() === typed.toLowerCase());
      return api
        .post<CreateAiTriviaResponse>(ENDPOINTS.AI_TRIVIAS, {
          ...(known ? { topicId: known.id } : { topicName: typed }),
          prompt: prompt.trim(),
          count,
        })
        .then((res) => res.data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["ai-trivias"] });
      queryClient.invalidateQueries({ queryKey: ["ai-trivia-options"] });
      if (data.trivia.cardCount < data.requested) {
        toast.info(
          `${data.trivia.cardCount} of ${data.requested} questions passed our accuracy check.`
        );
      } else {
        toast.success("Your trivia is ready.");
      }
      router.replace(routes.USER.AI_TRIVIA_PLAY(data.trivia.id));
    },
    onError: (err) => {
      const body = getApiError(err);
      if (body?.code === "UPGRADE_REQUIRED") {
        queryClient.invalidateQueries({ queryKey: ["ai-trivia-options"] });
      }
      toast.error(body?.message || "Couldn't write the trivia. Please try again.");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!topic.trim()) {
      toast.error("Choose a topic or type your own.");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Describe the questions you want.");
      return;
    }
    create.mutate();
  };

  const outOfTrivias = options ? options.remaining <= 0 : false;

  return (
    <MainLayout maxWidth="2xl">
      <div className="space-y-6">
        <Link
          href={routes.USER.AI_TRIVIA}
          className="text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          AI Generated Trivia
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white font-fredoka flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-secondary" />
            New AI trivia
          </h1>
          <p className="text-white/70 mt-1">
            Pick the topic and say what you want to be asked. AI writes the questions and checks
            each answer before your trivia is saved.
          </p>
        </div>

        {isLoading && <Skeleton className="h-80 rounded-2xl" />}
        {error && (
          <PageError
            title="Couldn't load this page"
            message="Please check your connection and try again."
            onRetry={() => refetch()}
            withLayout={false}
          />
        )}

        {options && !options.enabled && (
          <p className="text-white/70 text-center py-12 rounded-2xl border border-dashed border-white/10">
            Creating AI generated trivia is not available yet.
          </p>
        )}

        {options?.enabled && !options.isPro && (
          <div className="rounded-2xl border border-yellow-400/30 bg-yellow-500/10 p-6 space-y-4 text-center">
            <p className="text-white/80">
              AI generated trivia is a Pro feature
              {options.pro && (
                <>
                  : {formatPrice(options.pro.amount, options.pro.currency)} per{" "}
                  {options.pro.durationDays} days
                </>
              )}
              .
            </p>
            <Button
              asChild
              className="bg-gradient-to-r from-[#6C5CE7] to-[#FF6B9D] text-white font-fredoka"
            >
              <Link href={routes.USER.PRO}>See Pro</Link>
            </Button>
          </div>
        )}

        {options?.enabled && options.isPro && (
          <form method="post"
            onSubmit={handleSubmit}
            className="bg-card/50 border border-white/10 rounded-2xl p-6 space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="ai-topic" className="text-white/80">
                Topic
              </Label>
              <Input
                id="ai-topic"
                list="ai-topic-suggestions"
                value={topic}
                maxLength={options.topicMaxLength}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Choose one of ours or type your own, e.g. Roman emperors"
                disabled={create.isPending}
                className="bg-white/5 border-white/10 text-white"
              />
              <datalist id="ai-topic-suggestions">
                {options.topics.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-prompt" className="text-white/80">
                What should the questions be about?
              </Label>
              <Textarea
                id="ai-prompt"
                value={prompt}
                rows={4}
                maxLength={options.promptMaxLength}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="e.g. Hard questions about the emperors of the first century, focusing on how each reign ended"
                disabled={create.isPending}
                className="bg-white/5 border-white/10 text-white"
              />
              <p className="text-white/40 text-xs text-right">
                {prompt.length} / {options.promptMaxLength}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-white/80 text-sm font-medium">
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Number of questions
                </span>
                <span className="text-white font-fredoka text-xl">{count ?? options.count.default}</span>
              </div>
              <Slider
                aria-label="Number of questions"
                min={options.count.min}
                max={options.count.max}
                step={1}
                value={[count ?? options.count.default]}
                onValueChange={([v]) => setCount(v)}
                disabled={create.isPending}
              />
              <div className="flex justify-between text-xs text-white/40">
                <span>{options.count.min}</span>
                <span>{options.count.max}</span>
              </div>
            </div>

            <p className="text-white/50 text-sm">
              Your trivia is private to you. Our team may also add its questions to General Trivia
              for other players.
            </p>

            {outOfTrivias && (
              <p className="text-yellow-300 text-sm">
                You have created today&apos;s {options.dailyLimit} AI trivias. Come back tomorrow.
              </p>
            )}

            <div className="flex items-center gap-4 flex-wrap">
              <Button
                type="submit"
                disabled={create.isPending || create.isSuccess || outOfTrivias}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka"
              >
                {create.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {create.isPending ? "Writing your questions…" : "Create trivia"}
              </Button>
              <span className="text-white/50 text-sm">
                {create.isPending
                  ? "This can take a minute or two. Please keep this page open."
                  : `${options.remaining} of ${options.dailyLimit} left today`}
              </span>
            </div>
          </form>
        )}
      </div>
    </MainLayout>
  );
}
