"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { UpgradePrompt } from "@/components/pro/upgrade-prompt";
import { QuizDetailsForm, type QuizDetailsValues } from "@/components/quizzes/quiz-details-form";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type { CustomQuizResponse } from "@/types";

export default function NewQuizPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [upgradeMessage, setUpgradeMessage] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: ({ coverImageUrl, ...values }: QuizDetailsValues) =>
      api
        .post<CustomQuizResponse>(ENDPOINTS.CUSTOM_QUIZZES, {
          ...values,
          ...(coverImageUrl ? { coverImageUrl } : {}),
        })
        .then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["custom-quizzes"] });
      toast.success("Quiz created. Now add some cards.");
      router.replace(routes.USER.MY_QUIZ_EDIT(data.quiz.id));
    },
    onError: (error) => {
      const body = getApiError(error);
      if (body?.code === "UPGRADE_REQUIRED") {
        setUpgradeMessage(body.message);
        return;
      }
      toast.error(body?.message || "Couldn't create the quiz. Please try again.");
    },
  });

  return (
    <MainLayout maxWidth="2xl">
      <div className="space-y-6">
        <Link
          href={routes.USER.MY_QUIZZES}
          className="text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          My Quizzes
        </Link>
        <h1 className="text-3xl font-bold text-white font-fredoka">New Quiz</h1>
        <div className="bg-card/50 border border-white/10 rounded-2xl p-6">
          <QuizDetailsForm
            submitLabel="Create Quiz"
            pending={create.isPending || create.isSuccess}
            onSubmit={(values) => create.mutate(values)}
          />
        </div>
      </div>

      <UpgradePrompt
        open={upgradeMessage !== null}
        onOpenChange={(open) => !open && setUpgradeMessage(null)}
        message={upgradeMessage ?? undefined}
      />
    </MainLayout>
  );
}
