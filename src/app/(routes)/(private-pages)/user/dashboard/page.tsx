"use client";

import { MainLayout } from "@/components/layout/main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, Wallet, FolderKanban, ArrowRight } from "lucide-react";
import Link from "next/link";
import { routes } from "@/app/_utils/routes";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { usePlan } from "@/hooks/use-plan";

export default function UserDashboardPage() {
  const user = useAtomValue(userAtom);
  const { isPro, daysLeft } = usePlan();

  return (
    <MainLayout maxWidth="6xl">
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 font-fredoka">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <p className="text-white/70">
            Pick a topic and play: pictures and short definitions, two options, one tap.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Link href={routes.USER.TRIVIA}>
            <Card className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-secondary/40 transition-colors h-full">
              <CardHeader>
                <div className="p-3 bg-blue-500/20 rounded-lg w-fit mb-2">
                  <Brain className="h-6 w-6 text-blue-400" />
                </div>
                <CardTitle className="text-white font-fredoka text-xl">Trivia</CardTitle>
                <CardDescription className="text-white/70">
                  Footballers, musicians, animals, food and more. Turn on Practice to learn the answers as you go.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <span className="text-secondary inline-flex items-center gap-1 text-sm font-medium">
                  Play Trivia <ArrowRight className="h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href={routes.USER.MY_QUIZZES}>
            <Card className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-secondary/40 transition-colors">
              <CardContent className="pt-6 flex items-center gap-3">
                <FolderKanban className="h-5 w-5 text-secondary" />
                <span className="text-white font-medium">My Quizzes</span>
              </CardContent>
            </Card>
          </Link>
          <Link href={routes.USER.WALLET}>
            <Card className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-secondary/40 transition-colors">
              <CardContent className="pt-6 flex items-center gap-3">
                <Wallet className="h-5 w-5 text-secondary" />
                <span className="text-white font-medium">Wallet</span>
              </CardContent>
            </Card>
          </Link>
          <Link href={routes.USER.PRO}>
            <Card className="bg-card/50 backdrop-blur-sm border-white/10 hover:border-secondary/40 transition-colors">
              <CardContent className="pt-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-yellow-400" />
                  <span className="text-white font-medium">{isPro ? "Pro" : "Go Pro"}</span>
                </div>
                {isPro ? (
                  <span className="text-white/70 text-sm">
                    {daysLeft} {daysLeft === 1 ? "day" : "days"} left
                  </span>
                ) : (
                  <Button size="sm" variant="outline" className="border-white/20 text-white/70">
                    Upgrade
                  </Button>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
