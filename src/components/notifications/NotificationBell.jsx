import { useState, useEffect, useRef } from 'react';
import { Bell, Gift, Copy, Check } from 'lucide-react';
import { notificationService } from '../../services/notificationService';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

function NotificationItem({ notif, onRead }) {
  const [copied, setCopied] = useState(false);
  const data = notif.data || {};
  const isReward = data.type === 'practice_leaderboard_reward';
  const isUnread = !notif.read_at;

  const rewardStyle = {
    voucher_gold: 'bg-yellow-100 text-yellow-700',
    voucher_silver: 'bg-slate-200 text-slate-700',
    voucher_bronze: 'bg-orange-100 text-orange-700',
  };

  function handleCopy(e) {
    e.stopPropagation();
    navigator.clipboard.writeText(data.discount_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      onClick={() => isUnread && onRead(notif.id)}
      className={`px-4 py-3 border-b border-slate-100 cursor-pointer transition ${
        isUnread ? 'bg-brand-50/50 hover:bg-brand-50' : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start gap-2.5">
        {isReward && (
          <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${rewardStyle[data.reward_type] || 'bg-slate-100 text-slate-500'}`}>
            <Gift size={15} />
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${isUnread ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}>
            {data.title || 'Notifikasi'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{data.message}</p>

          {isReward && data.discount_code && (
            <button
              onClick={handleCopy}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 bg-white border border-dashed border-brand-300 px-2.5 py-1 rounded-lg hover:bg-brand-50 transition"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Disalin!' : data.discount_code}
            </button>
          )}

          <p className="text-[11px] text-slate-400 mt-1.5">{timeAgo(notif.created_at)}</p>
        </div>
        {isUnread && <span className="shrink-0 w-2 h-2 rounded-full bg-brand-600 mt-1.5" />}
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    notificationService.unreadCount().then((d) => setUnreadCount(d.count)).catch(() => {});
    const interval = setInterval(() => {
      notificationService.unreadCount().then((d) => setUnreadCount(d.count)).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleOpen() {
    setOpen((prev) => !prev);
    if (!open) {
      setLoading(true);
      notificationService.list().then(setNotifications).finally(() => setLoading(false));
    }
  }

  function handleRead(id) {
    notificationService.markAsRead(id).then(() => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    });
  }

  function handleReadAll() {
    notificationService.markAllAsRead().then(() => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
      setUnreadCount(0);
    });
  }

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={handleOpen} className="relative p-2 rounded-full hover:bg-white/10 transition">
        <Bell size={20} className="text-white/85" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center text-[10px] font-bold text-white bg-danger-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">Notifikasi</h3>
            {unreadCount > 0 && (
              <button onClick={handleReadAll} className="text-xs font-semibold text-brand-600 hover:underline">
                Tandai semua dibaca
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />)}
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Belum ada notifikasi.</p>
            ) : (
              notifications.map((n) => <NotificationItem key={n.id} notif={n} onRead={handleRead} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
