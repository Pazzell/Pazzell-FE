"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAtomValue } from "jotai/react";
import { LogIn, Users } from "lucide-react";
import { MainLayout } from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/ui/page-loader";
import { TeamGame } from "@/components/team-game/team-game";
import { userAtom } from "@/atom/user";
import { routes } from "@/app/_utils/routes";
import { clearReturnPath, setReturnPath } from "@/lib/return-path";

/** A team game's join link: `joinUrl` points here. Players log in, pick a team and play. */
export default function TeamGamePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const user = useAtomValue(userAtom);

  // The stored user is only known in the browser; wait for it to avoid a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const loggedIn = mounted && Boolean(user);

  // Back from login or sign-up: the return trip is done.
  useEffect(() => {
    if (loggedIn) clearReturnPath();
  }, [loggedIn]);

  if (!mounted) return <PageLoader message="Opening the game..." />;
  if (loggedIn) return <TeamGame code={code} />;

  const goTo = (path: string) => {
    setReturnPath(routes.TEAM_GAME(code));
    router.push(path);
  };

  return (
    <MainLayout maxWidth="2xl">
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <Users className="h-14 w-14 text-secondary" />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white font-fredoka">You&apos;re invited to a team quiz</h1>
          <p className="text-white/70 max-w-md">
            Join a team, talk each question over in your team chat, and help your leader claim a
            line on the board.
          </p>
        </div>
        <div className="w-full max-w-sm space-y-3">
          <Button
            onClick={() => goTo(routes.LOGIN)}
            className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground font-fredoka text-lg py-6"
          >
            <LogIn className="h-5 w-5 mr-2" />
            Log in to join
          </Button>
          <Button
            variant="outline"
            onClick={() => goTo(routes.REGISTER)}
            className="w-full border-white/20 text-white/80 hover:bg-white/10"
          >
            Create a free account
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
