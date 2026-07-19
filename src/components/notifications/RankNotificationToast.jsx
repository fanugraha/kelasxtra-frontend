import { useState, useEffect, useRef } from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';
import { useLeaderboardEvents } from '../../hooks/useLeaderboardEvents';

const PERSONAL_DURATION_MS = 5000;
const FEED_DURATION_MS = 3000;
const MAX_VISIBLE = 2;

// Overlay fixed, non-blocking (pointer-events: none di container, auto
// di kartu toast). Personal (amber/oranye) vs feed publik (abu-abu),
// durasi beda (5 detik vs 3 detik) sesuai keputusan desain.
export default function RankNotificationToast() {
  const { personalEvents, feedEvents, dismissPersonal, dismissFeed } = useLeaderboardEvents();
  const [queue, setQueue] = useState([]);
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    if (personalEvents.length === 0) return;
    setQueue((prev) => [
      ...prev,
      ...personalEvents.map((e) => ({ ...e, kind: 'personal', queueId: `p-${e.id}` })),
    ]);
    personalEvents.forEach((e) => dismissPersonal(e.id));
  }, [personalEvents, dismissPersonal]);

  useEffect(() => {
    if (feedEvents.length === 0) return;
    setQueue((prev) => [
      ...prev,
      ...feedEvents.map((e) => ({ ...e, kind: 'feed', queueId: `f-${e.id}` })),
    ]);
    feedEvents.forEach((e) => dismissFeed(e.id));
  }, [feedEvents, dismissFeed]);

  // Pindahkan dari antrean ke tampil, maksimal MAX_VISIBLE bersamaan --
  // sisanya antre menunggu slot kosong.
  useEffect(() => {
    if (queue.length === 0 || visible.length >= MAX_VISIBLE) return;
    const next = queue[0];
    setQueue((prev) => prev.slice(1));
    setVisible((prev) => [...prev, next]);
  }, [queue, visible]);

  function handleExpire(queueId) {
    setVisible((prev) => prev.filter((t) => t.queueId !== queueId));
  }

  if (visible.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-80"
      style={{ pointerEvents: 'none' }}
    >
      {visible.map((toast) => (
        <ToastCard key={toast.queueId} toast={toast} onExpire={() => handleExpire(toast.queueId)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onExpire }) {
  const timerRef = useRef(null);

  useEffect(() => {
    const duration = toast.kind === 'personal' ? PERSONAL_DURATION_MS : FEED_DURATION_MS;
    timerRef.current = setTimeout(onExpire, duration);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPersonal = toast.kind === 'personal';

  return (
    <div
      className={`rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 animate-[rankToastIn_0.3s_ease-out] ${
        isPersonal
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
          : 'bg-slate-800/95 text-slate-100'
      }`}
      style={{ pointerEvents: 'auto' }}
    >
      <div
        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
          isPersonal ? 'bg-white/20' : 'bg-white/10'
        }`}
      >
        {isPersonal ? <Sparkles size={16} /> : <TrendingUp size={16} />}
      </div>

      <div className="min-w-0">
        {isPersonal ? (
          <p className="text-sm font-semibold">
            Kamu {toast.is_milestone ? 'masuk' : 'naik ke'} rank #{toast.new_rank}
            {toast.exam_title && (
              <span className="block text-xs font-normal text-white/80 truncate">{toast.exam_title}</span>
            )}
          </p>
        ) : (
          <p className="text-sm">
            <span className="font-semibold">{toast.display_name}</span> baru saja{' '}
            {toast.is_milestone ? `masuk rank #${toast.new_rank}` : `naik ke rank #${toast.new_rank}`}
          </p>
        )}
      </div>

      <style>{`
        @keyframes rankToastIn {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
