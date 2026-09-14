"use client";

// ── Toplu göndəriş: canlı izləmə ──
//
// İKİ MƏNBƏ QƏSDƏNDİR. Socket hər mesajdan sonra hadisə göndərir (dərhal
// görünür), sorğu isə ehtiyatdır: səhifə göndəriş ORTASINDA açılsa və ya
// bağlantı qopsa, tam vəziyyət yenə də bərpa olunur. Socket işləyəndə
// sorğunun tezliyi azalır — şəbəkəni lüzumsuz yükləməsin.

// React
import { useEffect, useRef, useState } from "react";

// Store
import { useBulkStatusQuery, useSocket } from "@/store";

/** Toplu göndərişin birləşdirilmiş vəziyyəti (`queue`) və socket-in canlı olub-olmadığı (`live`). */
export function useBulkQueue() {
  const { socket, isConnected } = useSocket();
  const [liveQueue, setLiveQueue] = useState(null);
  const live = Boolean(socket && isConnected);

  const { data: bulkData } = useBulkStatusQuery(undefined, {
    pollingInterval: live ? 15000 : 3000,
    skipPollingIfUnfocused: true,
  });

  // Serverdən gələn tam vəziyyət əsasdır; socket yalnız aralıq yeniləmələri
  // gətirir, ona görə axın (feed) və həddlər sonuncu tam cavabdan saxlanılır.
  const base = bulkData?.data || {};
  const queue = liveQueue && liveQueue.startedAt === base.startedAt
    ? { ...base, ...liveQueue }
    : base;

  // Axın: hansı göndərişə aid olduğu ilə birlikdə saxlanılır.
  const feedRef = useRef({ startedAt: null, rows: [] });

  // Səhifə göndəriş ORTASINDA açılsa, socket yalnız BUNDAN SONRAKI hadisələri
  // gətirir — əvvəlki sətirlər serverin öz axınından götürülür. Olmasaydı,
  // 200 mesajlıq göndərişin ortasında açılan panel birdən bir sətirə düşərdi.
  const serverFeed = base.feed;
  useEffect(() => {
    if (!serverFeed?.length) return;
    const same = feedRef.current.startedAt === base.startedAt;
    if (!same || serverFeed.length > feedRef.current.rows.length) {
      feedRef.current = { startedAt: base.startedAt, rows: serverFeed };
    }
  }, [serverFeed, base.startedAt]);

  useEffect(() => {
    if (!socket) return;
    const push = (entry, startedAt) => {
      // Yeni göndəriş başlayıbsa köhnə sətirlər atılır.
      const rows = feedRef.current.startedAt === startedAt ? feedRef.current.rows : [];
      feedRef.current = { startedAt, rows: [entry, ...rows].slice(0, 300) };
      return feedRef.current.rows;
    };
    const onStart = (state) => {
      feedRef.current = { startedAt: state.startedAt, rows: [] };
      setLiveQueue({ ...state, feed: [] });
    };
    const onProgress = ({ entry, state }) => {
      setLiveQueue({ ...state, running: true, feed: push(entry, state.startedAt) });
    };
    const onDone = (state) => setLiveQueue({ ...state, feed: feedRef.current.rows });

    socket.on("bulk:start", onStart);
    socket.on("bulk:progress", onProgress);
    socket.on("bulk:done", onDone);
    return () => {
      socket.off("bulk:start", onStart);
      socket.off("bulk:progress", onProgress);
      socket.off("bulk:done", onDone);
    };
  }, [socket]);

  return { queue, live };
}
