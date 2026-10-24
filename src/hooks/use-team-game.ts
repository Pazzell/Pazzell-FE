"use client";

import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getApiError, readStoredUser } from "@/lib/api";
import { DEFAULT_SERVER } from "@/app/_utils/constants";
import { ENDPOINTS } from "@/app/_utils/endpoints";
import type {
  TeamGameMessage,
  TeamGameMessagesResponse,
  TeamGameResponse,
  TeamGameState,
} from "@/types";

// While the socket is down the game is polled instead, so play never stalls.
const POLL_MS = 4000;
const RECONNECT_MS = 3000;

const queryKey = (code: string) => ["team-game", code];

/**
 * A team game kept live. Changes go through the REST endpoints; the socket pushes every
 * new state (and the player's team chat) to all watchers. Whichever copy of the state
 * is newest by server time wins, so a late push never undoes a fresher response.
 */
export function useTeamGame(code: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<TeamGameMessage[]>([]);
  const userId = enabled ? readStoredUser()?.id ?? null : null;

  const applyState = useCallback(
    (state: TeamGameState) => {
      queryClient.setQueryData<TeamGameState>(queryKey(code), (prev) =>
        !prev || new Date(state.serverTime) >= new Date(prev.serverTime) ? state : prev
      );
    },
    [code, queryClient]
  );

  const game = useQuery({
    queryKey: queryKey(code),
    queryFn: () =>
      api.get<TeamGameResponse>(ENDPOINTS.TEAM_GAME(code)).then((res) => res.data.game),
    enabled,
    retry: false,
    refetchInterval: (query) =>
      connected || ["finished", "cancelled"].includes(query.state.data?.status ?? "")
        ? false
        : POLL_MS,
  });

  useEffect(() => {
    if (!enabled || !DEFAULT_SERVER) return;
    const socket = io(DEFAULT_SERVER, {
      // Read on every (re)connect, so a refreshed access token is picked up.
      auth: (cb) => cb({ token: readStoredUser()?.accessToken }),
    });
    let retry: ReturnType<typeof setTimeout> | null = null;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("team-game:watch", { code }, (reply: { ok: boolean; state?: TeamGameState }) => {
        if (reply?.ok && reply.state) applyState(reply.state);
      });
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => {
      setConnected(false);
      // A refused handshake is not retried by socket.io. The token may just have expired:
      // a REST call refreshes it, then the socket tries again.
      if (socket.active) return;
      api
        .get<TeamGameResponse>(ENDPOINTS.TEAM_GAME(code))
        .then((res) => applyState(res.data.game))
        .catch(() => {})
        .finally(() => {
          retry = setTimeout(() => socket.connect(), RECONNECT_MS);
        });
    });
    socket.on("team-game:state", applyState);
    socket.on("team-game:message", (message: TeamGameMessage) =>
      setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))
    );

    return () => {
      if (retry) clearTimeout(retry);
      socket.emit("team-game:unwatch");
      socket.close();
    };
  }, [code, enabled, applyState]);

  const state = game.data;
  const myTeamId =
    state?.teams.find((t) => t.members.some((m) => m.userId === userId))?.id ?? null;

  // The chat history of whichever team the player is on now.
  useEffect(() => {
    setMessages([]);
    if (!myTeamId) return;
    let cancelled = false;
    api
      .get<TeamGameMessagesResponse>(ENDPOINTS.TEAM_GAME_MESSAGES(code))
      .then((res) => {
        if (cancelled) return;
        setMessages((live) => {
          const seen = new Set(res.data.messages.map((m) => m.id));
          return [...res.data.messages, ...live.filter((m) => !seen.has(m.id))];
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [code, myTeamId]);

  /** Runs an action; the response's state is applied, and a refusal is shown as a toast. */
  const act = useCallback(
    async (path: string, body?: unknown, method: "post" | "patch" = "post") => {
      try {
        const res = await api[method]<TeamGameResponse>(path, body ?? {});
        applyState(res.data.game);
        return true;
      } catch (error) {
        toast.error(getApiError(error)?.message || "Something went wrong. Please try again.");
        // The refusal may mean our copy is stale (the clock ran out, the turn moved on).
        game.refetch();
        return false;
      }
    },
    [applyState, game]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      try {
        const res = await api.post<{ message: TeamGameMessage }>(
          ENDPOINTS.TEAM_GAME_MESSAGES(code),
          { text }
        );
        const message = res.data.message;
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]));
        return true;
      } catch (error) {
        toast.error(getApiError(error)?.message || "Couldn't send your message.");
        return false;
      }
    },
    [code]
  );

  return { game, state, userId, myTeamId, connected, messages, act, sendMessage };
}
