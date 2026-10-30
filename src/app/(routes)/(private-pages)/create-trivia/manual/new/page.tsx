"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { QuizDetailsForm, type QuizDetailsValues } from "@/components/quizzes/quiz-details-form";
import { api, getApiError } from "@/lib/api";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { routes } from "@/app/_utils/routes";
import type { CustomQuizResponse } from "@/types";

export default function NewPersonalTriviaPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const create = useMutation({
    // Personal trivia is free and private: it is a custom quiz the owner plays alone.
    mutationFn: ({ coverImageUrl, ...values }: QuizDetailsValues) =>
      api
        .post<CustomQuizResponse>(ENDPOINTS.CUSTOM_QUIZZES, {
          ...values,
          origin: "personal",
          ...(coverImageUrl ? { coverImageUrl } : {}),
        })
        .then((res) => res.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["personal-trivias"] });
      toast.success("Trivia created. Now add your questions.");
      router.replace(routes.USER.MY_TRIVIA_EDIT(data.quiz.id));
    },
    onError: (error) => {
      toast.error(getApiError(error)?.message || "Couldn't create the trivia. Please try again.");
    },
  });

  return (
    <MainLayout maxWidth="2xl">
      <div className="space-y-6">
        <Link
          href={routes.USER.MY_TRIVIA}
          className="text-white/60 hover:text-white text-sm inline-flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          My Trivia
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white font-fredoka">New Trivia</h1>
          <p className="text-white/70 mt-1">
            Give it a name, then add your questions. Only you can play it.
          </p>
        </div>
        <div className="bg-card/50 border border-white/10 rounded-2xl p-6">
          <QuizDetailsForm
            personal
            submitLabel="Create Trivia"
            pending={create.isPending || create.isSuccess}
            onSubmit={(values) => create.mutate(values)}
          />
        </div>
      </div>
    </MainLayout>
  );
}
