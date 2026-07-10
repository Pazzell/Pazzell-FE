"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import {
  ForumThreadsResponse,
  WinnerSubmissionsResponse,
  MyRaffleTicketsResponse,
} from "@/types";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Plus,
  Loader2,
  AlertCircle,
  Trophy,
  Share2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { routes } from "@/app/_utils/routes";
import {
  validateThreadTitle,
  validatePostBody,
  validateWinnerSubmission,
  WINNER_SUBMISSION_STATUS_STYLES,
} from "./forum-utils";

export default function ForumPage() {
  const user = useAtomValue(userAtom);
  const queryClient = useQueryClient();
  const authHeaders = { headers: { Authorization: `Bearer ${user?.accessToken}` } };

  // Threads
  const { data: threads, isLoading: loadingThreads } = useQuery({
    queryKey: ["forum-threads"],
    queryFn: () =>
      axios
        .get<ForumThreadsResponse>(endpointUrl(ENDPOINTS.FORUM_THREADS))
        .then((res) => res.data.threads),
  });

  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadBody, setNewThreadBody] = useState("");
  const [newThreadCategory, setNewThreadCategory] = useState("");
  const [threadError, setThreadError] = useState("");

  const createThreadMutation = useMutation({
    mutationFn: async () => {
      const threadRes = await axios.post(
        endpointUrl(ENDPOINTS.FORUM_THREADS),
        { title: newThreadTitle, category: newThreadCategory || undefined },
        authHeaders
      );
      const threadId = threadRes.data.thread?._id ?? threadRes.data._id;
      await axios.post(
        endpointUrl(ENDPOINTS.FORUM_THREAD_POSTS(threadId)),
        { body: newThreadBody },
        authHeaders
      );
      return threadId;
    },
    onSuccess: () => {
      setNewThreadTitle("");
      setNewThreadBody("");
      setNewThreadCategory("");
      setThreadError("");
      queryClient.invalidateQueries({ queryKey: ["forum-threads"] });
    },
    onError: () => setThreadError("Couldn't create the thread. Please try again."),
  });

  const handleCreateThread = (e: React.FormEvent) => {
    e.preventDefault();
    const titleCheck = validateThreadTitle(newThreadTitle);
    if (!titleCheck.valid) {
      setThreadError(titleCheck.message!);
      return;
    }
    const bodyCheck = validatePostBody(newThreadBody);
    if (!bodyCheck.valid) {
      setThreadError(bodyCheck.message!);
      return;
    }
    setThreadError("");
    createThreadMutation.mutate();
  };

  // Winner share submission — campaign choices come from the player's own
  // raffle tickets, since there's no dedicated "campaigns I won" endpoint.
  const { data: myTickets } = useQuery({
    queryKey: ["raffle-my-tickets"],
    queryFn: () =>
      axios
        .get<MyRaffleTicketsResponse>(endpointUrl(ENDPOINTS.RAFFLE_MY_TICKETS), authHeaders)
        .then((res) => res.data),
    enabled: !!user?.accessToken,
  });

  const { data: mySubmissions } = useQuery({
    queryKey: ["forum-winner-submissions-mine"],
    queryFn: () =>
      axios
        .get<WinnerSubmissionsResponse>(
          endpointUrl(ENDPOINTS.FORUM_WINNER_SUBMISSIONS_MINE),
          authHeaders
        )
        .then((res) => res.data.submissions),
    enabled: !!user?.accessToken,
  });

  const [submitCampaignId, setSubmitCampaignId] = useState("");
  const [submitPostUrl, setSubmitPostUrl] = useState("");
  const [submitLikeCount, setSubmitLikeCount] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const submitWinMutation = useMutation({
    mutationFn: () =>
      axios.post(
        endpointUrl(ENDPOINTS.FORUM_WINNER_SUBMISSIONS),
        {
          campaignId: submitCampaignId,
          postUrl: submitPostUrl,
          claimedLikeCount: Number(submitLikeCount),
        },
        authHeaders
      ),
    onSuccess: () => {
      setSubmitCampaignId("");
      setSubmitPostUrl("");
      setSubmitLikeCount("");
      setSubmitSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["forum-winner-submissions-mine"] });
    },
    onError: (error: any) =>
      setSubmitError(error?.response?.data?.message ?? "Couldn't submit. Please try again."),
  });

  const handleSubmitWin = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(false);
    if (!submitCampaignId) {
      setSubmitError("Select which campaign you won.");
      return;
    }
    const validation = validateWinnerSubmission(
      submitPostUrl,
      submitLikeCount ? Number(submitLikeCount) : undefined
    );
    if (!validation.valid) {
      setSubmitError(validation.message!);
      return;
    }
    setSubmitError("");
    submitWinMutation.mutate();
  };

  return (
    <MainLayout maxWidth="5xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 font-fredoka flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-secondary" />
            Forum
          </h1>
          <p className="text-white/70">
            Talk with other players, and share your wins for bonus points.
          </p>
        </div>

        {/* Winner share submission */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-fredoka flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Share Your Win
            </CardTitle>
            <p className="text-white/60 text-sm">
              Won a raffle? Post it on social media (20+ likes), then submit the link
              here for +5 bonus points once verified.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {mySubmissions && mySubmissions.length > 0 && (
              <div className="space-y-2" data-testid="my-submissions">
                {mySubmissions.map((sub) => (
                  <div
                    key={sub._id}
                    data-testid="submission-row"
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="min-w-0 flex-1">
                      <p className="text-white text-sm truncate">{sub.postUrl}</p>
                      {sub.status === "verified" && (
                        <p className="text-green-400 text-xs flex items-center gap-1 mt-1">
                          <CheckCircle2 className="h-3 w-3" />
                          +5 bonus points credited toward your next reward period
                        </p>
                      )}
                      {sub.status === "rejected" && sub.adminNotes && (
                        <p className="text-red-400/80 text-xs mt-1">{sub.adminNotes}</p>
                      )}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border capitalize flex-shrink-0 ml-3 ${WINNER_SUBMISSION_STATUS_STYLES[sub.status]}`}>
                      {sub.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSubmitWin} className="space-y-3 pt-2 border-t border-white/10">
              <Select value={submitCampaignId} onValueChange={setSubmitCampaignId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Which campaign did you win?" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  {(myTickets?.tickets || []).map((t) => (
                    <SelectItem
                      key={t.campaignId}
                      value={t.campaignId}
                      className="text-white hover:bg-white/10">
                      {t.campaignTitle ?? t.campaignId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Link to your post"
                value={submitPostUrl}
                onChange={(e) => setSubmitPostUrl(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
              <Input
                type="number"
                min={0}
                placeholder="Current like count"
                value={submitLikeCount}
                onChange={(e) => setSubmitLikeCount(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
              <Button
                type="submit"
                disabled={submitWinMutation.isPending}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                {submitWinMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4 mr-2" />
                )}
                Submit for Verification
              </Button>
              {submitError && (
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {submitError}
                </p>
              )}
              {submitSuccess && (
                <p className="text-green-400 text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Submitted — we&apos;ll verify it and credit your points.
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Threads */}
        <Card className="bg-card/50 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-fredoka">Discussion Threads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingThreads ? (
              <Loader2 className="h-5 w-5 animate-spin text-secondary" />
            ) : threads && threads.length > 0 ? (
              <div className="space-y-1">
                {threads.map((thread) => (
                  <Link
                    key={thread._id}
                    href={routes.USER.FORUM_THREAD(thread._id)}
                    data-testid="thread-row"
                    className="block p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors">
                    <p className="text-white font-medium">{thread.title}</p>
                    <p className="text-white/50 text-xs">
                      {thread.category ? `${thread.category} · ` : ""}
                      {thread.postCount ?? 0} repl{thread.postCount === 1 ? "y" : "ies"}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-white/50 text-sm">No threads yet — start the conversation!</p>
            )}

            <form
              onSubmit={handleCreateThread}
              className="space-y-3 pt-4 border-t border-white/10">
              <Input
                placeholder="Thread title"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
              <Input
                placeholder="Category (optional)"
                value={newThreadCategory}
                onChange={(e) => setNewThreadCategory(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
              <Textarea
                placeholder="What's on your mind?"
                value={newThreadBody}
                onChange={(e) => setNewThreadBody(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
              <Button
                type="submit"
                disabled={createThreadMutation.isPending}
                className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                {createThreadMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Start Thread
              </Button>
              {threadError && (
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {threadError}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
