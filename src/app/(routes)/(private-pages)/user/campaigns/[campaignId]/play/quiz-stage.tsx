"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, Video } from "lucide-react";
import { CampaignQuestion } from "@/types";
import { isAllAnswered } from "./session-utils";

interface QuizStageProps {
  questions: CampaignQuestion[];
  onSubmit: (answers: number[]) => void;
  submitting: boolean;
  lastResult: { allCorrect: boolean; wrongIndices: number[] } | null;
  onRewatchVideo: () => void;
  brandName?: string;
}

export function QuizStage({
  questions,
  onSubmit,
  submitting,
  lastResult,
  onRewatchVideo,
  brandName,
}: QuizStageProps) {
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    questions.map(() => null)
  );

  const handleSelect = (qIndex: number, choiceIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIndex] = choiceIndex;
      return next;
    });
  };

  const handleSubmit = () => {
    if (!isAllAnswered(answers)) return;
    onSubmit(answers);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white font-fredoka text-2xl">
            {brandName ? `Quiz: ${brandName}` : "Quiz"}
          </CardTitle>
          <p className="text-white/70 text-sm">
            Unlimited retries — answer all {questions.length} correctly to finish.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {lastResult && !lastResult.allCorrect && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm">
                {lastResult.wrongIndices.length} question
                {lastResult.wrongIndices.length !== 1 ? "s" : ""} wrong — check the
                highlighted question{lastResult.wrongIndices.length !== 1 ? "s" : ""}{" "}
                below and try again.
              </p>
            </div>
          )}

          {questions.map((q, qIndex) => {
            const isWrong =
              !!lastResult &&
              !lastResult.allCorrect &&
              lastResult.wrongIndices.includes(qIndex);
            return (
              <div
                key={q._id || qIndex}
                data-testid={`quiz-question-${qIndex}`}
                className={`p-4 rounded-lg border space-y-3 ${
                  isWrong
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-white/10 bg-white/5"
                }`}>
                <h4 className="text-white font-medium flex items-center gap-2">
                  {isWrong && <AlertCircle className="h-4 w-4 text-red-400" />}
                  {qIndex + 1}. {q.question}
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {q.choices.map((choice, cIndex) => (
                    <button
                      key={cIndex}
                      type="button"
                      onClick={() => handleSelect(qIndex, cIndex)}
                      className={`text-left px-4 py-2.5 rounded-lg border transition-all text-sm ${
                        answers[qIndex] === cIndex
                          ? "bg-secondary/20 border-secondary text-white"
                          : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                      }`}>
                      <span className="font-medium mr-2">
                        {String.fromCharCode(65 + cIndex)}.
                      </span>
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onRewatchVideo}
              disabled={submitting}
              className="border-white/20 text-white hover:bg-white/10">
              <Video className="h-4 w-4 mr-2" />
              Rewatch Video
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isAllAnswered(answers) || submitting}
              className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Answers
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
