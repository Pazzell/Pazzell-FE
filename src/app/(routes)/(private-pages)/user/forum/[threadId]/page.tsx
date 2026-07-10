"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAtomValue } from "jotai";
import { userAtom } from "@/atom/user";
import { endpointUrl } from "@/app/_utils/helper";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import { ForumPostsResponse, ForumThreadsResponse } from "@/types";
import { MainLayout } from "@/components/layout/main-layout";
import { PageLoader } from "@/components/ui/page-loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Heart,
  Loader2,
  AlertCircle,
  Send,
  Flag,
} from "lucide-react";
import Link from "next/link";
import { routes } from "@/app/_utils/routes";
import { validatePostBody } from "../forum-utils";

export default function ForumThreadPage() {
  const user = useAtomValue(userAtom);
  const queryClient = useQueryClient();
  const params = useParams();
  const threadId = params.threadId as string;
  const authHeaders = { headers: { Authorization: `Bearer ${user?.accessToken}` } };

  // No dedicated "GET single thread" endpoint exists — reuse the thread
  // list to resolve this thread's title/category for the header.
  const { data: threads } = useQuery({
    queryKey: ["forum-threads"],
    queryFn: () =>
      axios
        .get<ForumThreadsResponse>(endpointUrl(ENDPOINTS.FORUM_THREADS))
        .then((res) => res.data.threads),
  });
  const thread = threads?.find((t) => t._id === threadId);

  const {
    data: posts,
    isLoading: loadingPosts,
    error: postsError,
  } = useQuery({
    queryKey: ["forum-thread-posts", threadId],
    queryFn: () =>
      axios
        .get<ForumPostsResponse>(endpointUrl(ENDPOINTS.FORUM_THREAD_POSTS(threadId)))
        .then((res) => res.data.posts),
    enabled: !!threadId,
  });

  const [newPostBody, setNewPostBody] = useState("");
  const [postError, setPostError] = useState("");
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");

  const createPostMutation = useMutation({
    mutationFn: () =>
      axios.post(
        endpointUrl(ENDPOINTS.FORUM_THREAD_POSTS(threadId)),
        { body: newPostBody },
        authHeaders
      ),
    onSuccess: () => {
      setNewPostBody("");
      setPostError("");
      queryClient.invalidateQueries({ queryKey: ["forum-thread-posts", threadId] });
    },
    onError: () => setPostError("Couldn't post. Please try again."),
  });

  const likeMutation = useMutation({
    mutationFn: ({ postId, liked }: { postId: string; liked: boolean }) =>
      liked
        ? axios.delete(endpointUrl(ENDPOINTS.FORUM_POST_LIKE(postId)), authHeaders)
        : axios.post(endpointUrl(ENDPOINTS.FORUM_POST_LIKE(postId)), {}, authHeaders),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forum-thread-posts", threadId] });
    },
  });

  const flagMutation = useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason: string }) =>
      axios.post(
        endpointUrl(ENDPOINTS.FORUM_POST_FLAG(postId)),
        { reason },
        authHeaders
      ),
    onSuccess: () => {
      setReportingPostId(null);
      setReportReason("");
    },
  });

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validatePostBody(newPostBody);
    if (!check.valid) {
      setPostError(check.message!);
      return;
    }
    setPostError("");
    createPostMutation.mutate();
  };

  if (loadingPosts) {
    return <PageLoader message="Loading thread..." />;
  }

  return (
    <MainLayout maxWidth="4xl">
      <div className="mb-6">
        <Link href={routes.USER.FORUM}>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forum
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white font-fredoka">
          {thread?.title ?? "Thread"}
        </h1>
        {thread?.category && <p className="text-white/60 text-sm">{thread.category}</p>}
      </div>

      {postsError && (
        <p className="text-red-400 text-sm flex items-center gap-2 mb-4">
          <AlertCircle className="h-4 w-4" />
          Couldn&apos;t load posts.
        </p>
      )}

      <div className="space-y-3 mb-6">
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <Card key={post._id} data-testid="post-row" className="bg-card/50 backdrop-blur-sm border-white/10">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-white font-medium text-sm">
                    {post.authorName ?? "Player"}
                  </span>
                  <span className="text-white/40 text-xs">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-white/80 text-sm whitespace-pre-wrap">{post.body}</p>
                <div className="flex items-center gap-4 mt-3">
                  <button
                    onClick={() =>
                      likeMutation.mutate({ postId: post._id, liked: !!post.likedByMe })
                    }
                    disabled={likeMutation.isPending}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      post.likedByMe ? "text-pink-400" : "text-white/50 hover:text-white/80"
                    }`}>
                    <Heart className={`h-4 w-4 ${post.likedByMe ? "fill-current" : ""}`} />
                    {post.likeCount}
                  </button>
                  <button
                    onClick={() =>
                      setReportingPostId(reportingPostId === post._id ? null : post._id)
                    }
                    className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white/80">
                    <Flag className="h-4 w-4" />
                    Report
                  </button>
                </div>
                {reportingPostId === post._id && (
                  <div className="mt-3 flex gap-2">
                    <input
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="Reason for reporting"
                      className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-white text-sm placeholder:text-white/40"
                    />
                    <Button
                      size="sm"
                      disabled={!reportReason.trim() || flagMutation.isPending}
                      onClick={() =>
                        flagMutation.mutate({ postId: post._id, reason: reportReason.trim() })
                      }
                      className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
                      Submit
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-white/50 text-sm">No posts yet — be the first to reply.</p>
        )}
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-white/10">
        <CardHeader>
          <CardTitle className="text-white font-fredoka text-lg">Reply</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePost} className="space-y-3">
            <Textarea
              placeholder="Write a reply..."
              value={newPostBody}
              onChange={(e) => setNewPostBody(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
            />
            <Button
              type="submit"
              disabled={createPostMutation.isPending}
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground">
              {createPostMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Post Reply
            </Button>
            {postError && (
              <p className="text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {postError}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
