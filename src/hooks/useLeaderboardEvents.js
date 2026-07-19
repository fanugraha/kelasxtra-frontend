import { useState, useEffect, useRef, useCallback } from 'react';
import { leaderboardEventService } from '../services/leaderboardEventService';

// Polling feed publik tiap 20 detik -- konsisten dengan keputusan desain
// (bukan WebSocket, ditunda sampai memang perlu). /me cukup dipanggil
// sekali saat mount, karena event personal user sendiri jarang numpuk.
const FEED_POLL_INTERVAL_MS = 20000;

export function useLeaderboardEvents() {
  const [personalEvents, setPersonalEvents] = useState([]);
  const [feedEvents, setFeedEvents] = useState([]);

  // since awal: 2 menit ke belakang -- cukup buat nangkep event yang
  // mungkin sudah terjadi sesaat sebelum halaman ini dibuka.
  const lastFeedSinceRef = useRef(new Date(Date.now() - 2 * 60 * 1000).toISOString());
  const seenIdsRef = useRef(new Set());

  const fetchMe = useCallback(async () => {
    try {
      const events = await leaderboardEventService.me();
      const fresh = events.filter((e) => !seenIdsRef.current.has(`me-${e.id}`));
      fresh.forEach((e) => seenIdsRef.current.add(`me-${e.id}`));
      if (fresh.length > 0) setPersonalEvents((prev) => [...prev, ...fresh]);
    } catch {
      // Notifikasi bukan fitur kritikal -- gagal diam-diam, jangan
      // ganggu pengalaman utama Beranda.
    }
  }, []);

  const fetchFeed = useCallback(async () => {
    try {
      const events = await leaderboardEventService.feed(lastFeedSinceRef.current);
      lastFeedSinceRef.current = new Date().toISOString();

      if (events.length > 0) {
        const fresh = events.filter((e) => !seenIdsRef.current.has(`feed-${e.id}`));
        fresh.forEach((e) => seenIdsRef.current.add(`feed-${e.id}`));
        if (fresh.length > 0) setFeedEvents((prev) => [...prev, ...fresh]);
      }
    } catch {
      // sama seperti fetchMe -- gagal diam-diam
    }
  }, []);

  useEffect(() => {
    fetchMe();

    let intervalId = null;

    function startPolling() {
      if (intervalId) return;
      fetchFeed();
      intervalId = setInterval(fetchFeed, FEED_POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    // Pause polling & animasi saat tab di background -- hemat resource,
    // dan feed publik memang tidak perlu update kalau user tidak lihat.
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        startPolling();
      } else {
        stopPolling();
      }
    }

    if (document.visibilityState === 'visible') startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchMe, fetchFeed]);

  const dismissPersonal = useCallback((id) => {
    setPersonalEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const dismissFeed = useCallback((id) => {
    setFeedEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { personalEvents, feedEvents, dismissPersonal, dismissFeed };
}
