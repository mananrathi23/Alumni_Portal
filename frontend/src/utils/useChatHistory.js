// useChatHistory.js — loads a chat's newest messages, then older pages on demand.
//
// The backend returns the latest page (oldest-first) plus `hasMore`; passing
// `before=<oldest message id>` returns the page before it. When older messages
// are prepended, the scroll position is kept on what the user was reading.
//
// Usage:
//   const chat = useChatHistory(`${API}/conversations/${otherUserId}/messages`, { onError });
//   <div ref={chat.containerRef}> … chat.messages … </div>
//   In the auto-scroll effect: if (chat.consumePrepend()) return;
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import axios from "axios";

const PAGE_SIZE = 50;

export function useChatHistory(url, { onError } = {}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const containerRef = useRef(null);
  const prevScrollHeight = useRef(null); // set just before older messages are prepended
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMessages([]);
    setHasMore(false);
    axios.get(url, { params: { limit: PAGE_SIZE }, withCredentials: true })
      .then((res) => {
        if (cancelled) return;
        setMessages(res.data.messages || []);
        setHasMore(!!res.data.hasMore);
      })
      .catch(() => { if (!cancelled) onErrorRef.current?.("Failed to load messages."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url]);

  const loadOlder = useCallback(async () => {
    const oldest = messages.find((m) => !m.optimistic);
    if (!oldest || loadingOlder) return;
    setLoadingOlder(true);
    try {
      const res = await axios.get(url, {
        params: { before: oldest._id, limit: PAGE_SIZE },
        withCredentials: true,
      });
      prevScrollHeight.current = containerRef.current?.scrollHeight ?? null;
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m._id));
        return [...(res.data.messages || []).filter((m) => !ids.has(m._id)), ...prev];
      });
      setHasMore(!!res.data.hasMore);
    } catch {
      onErrorRef.current?.("Failed to load earlier messages.");
    } finally {
      setLoadingOlder(false);
    }
  }, [url, messages, loadingOlder]);

  // Runs before paint: shift the scroll by the height the new messages added
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (prevScrollHeight.current == null || !el) return;
    el.scrollTop += el.scrollHeight - prevScrollHeight.current;
  }, [messages]);

  // The auto-scroll-to-bottom effect calls this; true means older messages were
  // just prepended, so it should leave the scroll position alone.
  const consumePrepend = useCallback(() => {
    const prepended = prevScrollHeight.current != null;
    prevScrollHeight.current = null;
    return prepended;
  }, []);

  return { messages, setMessages, loading, loadingOlder, hasMore, loadOlder, containerRef, consumePrepend };
}
