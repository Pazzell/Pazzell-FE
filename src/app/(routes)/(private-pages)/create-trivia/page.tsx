"use client";

import Link from "next/link";
import { ArrowRight, PencilLine, Sparkles } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { TriviaKindTabs } from "@/components/trivia/trivia-kind-tabs";
import { routes } from "@/app/_utils/routes";

const WAYS = [
  {
    title: "AI generated",
    description:
      "Name any topic and describe the questions you want. AI writes the trivia, and every question is checked a second time.",
    href: routes.USER.AI_TRIVIA,
    icon: Sparkles,
    tag: "Pro",
  },
  {
    title: "Manually created",
    description:
      "Write your own questions with pictures or short definitions and four options each, then play them whenever you like.",
    href: routes.USER.MY_TRIVIA,
    icon: PencilLine,
    tag: "Free",
  },
] as const;

/** Create Trivia: choose between having AI write a trivia and writing one by hand. */
export default function CreateTriviaPage() {
  return (
    <MainLayout maxWidth="5xl">
      <div className="space-y-8">
        <TriviaKindTabs active="create" />

        <div>
          <h1 className="text-3xl font-bold text-white mb-2 font-fredoka">Create Trivia</h1>
          <p className="text-white/70">
            Make a trivia just for you. Pick how you want the questions written.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {WAYS.map(({ title, description, href, icon: Icon, tag }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col items-start rounded-2xl border border-white/10 bg-white/5 p-6 text-left transition-colors hover:border-secondary hover:bg-secondary/10"
            >
              <span className="flex w-full items-center justify-between gap-3">
                <span className="flex items-center gap-2 font-fredoka text-xl text-white">
                  <Icon className="h-6 w-6 text-secondary" />
                  {title}
                </span>
                <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-semibold text-white/70">
                  {tag}
                </span>
              </span>
              <span className="mt-2 block text-sm text-white/60">{description}</span>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-secondary">
                Open
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
