// Keeps a list page (jobs, events, forum, incubation) fresh without hammering the API.
//
// - Refetches when the backend broadcasts `feed:updated` for this feed (after a
//   small random delay, so hundreds of open tabs don't all hit the API at once).
// - Refetches when the tab becomes visible again.
// - Falls back to a slow poll, only while the tab is visible, in case a socket
//   event was missed.
import { useEffect, useRef } from "react";
import { useSocket } from "../SocketContext";

const FALLBACK_POLL_MS = 60_000;
const MAX_JITTER_MS = 2_000;

export const useFeedRefresh = (feed, refetch, { paused = false } = {}) => {
  const { socketRef, isSocketReady } = useSocket();

  // Always call the latest refetch / paused without re-subscribing every render
  const refetchRef = useRef(refetch);
  const pausedRef = useRef(paused);
  useEffect(() => {
    refetchRef.current = refetch;
    pausedRef.current = paused;
  });

  useEffect(() => {
    let jitterTimer = null;
    const run = () => {
      if (!pausedRef.current && document.visibilityState === "visible") refetchRef.current();
    };

    const onFeedUpdated = (data) => {
      if (data?.feed !== feed) return;
      clearTimeout(jitterTimer);
      jitterTimer = setTimeout(run, Math.random() * MAX_JITTER_MS);
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") run();
    };

    const socket = socketRef.current;
    if (isSocketReady && socket) socket.on("feed:updated", onFeedUpdated);
    document.addEventListener("visibilitychange", onVisibility);
    const interval = setInterval(run, FALLBACK_POLL_MS);

    return () => {
      if (socket) socket.off("feed:updated", onFeedUpdated);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
      clearTimeout(jitterTimer);
    };
  }, [feed, isSocketReady, socketRef]);
};
