import { useState, useEffect } from 'react';
import { Trophy, Medal, Copy, Check, Gift } from 'lucide-react';
import { weeklyLeaderboardService } from '../../services/weeklyLeaderboardService';
import { useAuth } from '../../context/AuthContext';

const rankStyle = {
  1: 'bg-yellow-100 text-yellow-700',
  2: 'bg-slate-200 text-slate-700',
  3: 'bg-orange-100 text-orange-700',
};

const rewardLabel = {
  voucher_gold: 'Voucher Gold',
  voucher_silver: 'Voucher Silver',
  voucher_bronze: 'Voucher Bronze',
};

function VoucherBadge({ rewardType, code }) {
  const [copied, setCopied] = useState(false);
  if (!rewardType || !code) return null;

  function handleCopy(e) {
    e.stopPropagation();
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-[11px] font-bold text-brand-700 bg-white border border-dashed border-brand-300 px-2 py-1 rounded-lg hover:bg-brand-50 transition shrink-0"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Disalin!' : code}
    </button>
  );
}

// examId: exam yang leaderboard mingguannya ditampilkan. Saat ini diambil
// dari batch try out pertama yang sudah dimuat di Beranda — ganti sumbernya
// di sini kalau nanti mau logic pemilihan exam yang berbeda.
export default function WeeklyLeaderboardSection({ examId }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [periode, setPeriode] = useState('');
  const [myPosition, setMyPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!examId) return;
    setLoading(true);
    setError('');

    Promise.all([
      weeklyLeaderboardService.getLeaderboard(examId),
      weeklyLeaderboardService.getMyPosition(examId).catch(() => null),
    ])
      .then(([leaderboardRes, myPosRes]) => {
        setEntries(leaderboardRes.data || []);
        setPeriode(leaderboardRes.periode || '');
        // getMyPosition mengembalikan { message } kalau user belum ranking —
        // itu bukan error, jadi cek keberadaan 'ranking' dulu.
        setMyPosition(myPosRes && myPosRes.ranking ? myPosRes : null);
      })
      .catch(() => setError('Leaderboard minggu ini belum tersedia.'))
      .finally(() => setLoading(false));
  }, [examId]);

  if (!examId) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-10">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 px-6 py-5 flex items-center gap-2 text-white">
        <Trophy size={22} />
        <div>
          <h2 className="text-lg font-bold">Leaderboard Mingguan</h2>
          {periode && <p className="text-white/80 text-xs">Periode {periode} · Top 3 dapat voucher diskon</p>}
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-slate-500 text-center py-6">{error}</p>
        ) : entries.length === 0 ? (
          <p className="text-slate-500 text-center py-6">Belum ada peserta di leaderboard minggu ini.</p>
        ) : (
          <>
            <div className="space-y-2 mb-4">
              {entries.map((entry) => {
                const isMe = user && entry.user?.id === user.id;
                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg gap-3 ${
                      isMe ? 'bg-brand-50 border border-brand-200' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          rankStyle[entry.ranking] || 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {entry.ranking <= 3 ? <Medal size={15} /> : entry.ranking}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm truncate">
                          {entry.user?.name} {isMe && <span className="text-brand-600">(Kamu)</span>}
                        </p>
                        <p className="text-xs text-slate-400">Skor {entry.skor_terbaik}</p>
                      </div>
                    </div>

                    {entry.reward_type && (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:inline text-[11px] font-medium text-slate-400">
                          {rewardLabel[entry.reward_type]}
                        </span>
                        <VoucherBadge rewardType={entry.reward_type} code={entry.discount_code} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {user && !myPosition && (
              <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 text-sm">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Gift size={14} className="text-slate-400" />
                  Kamu belum masuk ranking minggu ini. Kerjakan latihan soal untuk ikut bersaing!
                </span>
              </div>
            )}

            {myPosition && (
              <div className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-lg px-4 py-3 text-sm">
                <span className="text-brand-700 font-medium">{myPosition.summary_text}</span>
                {myPosition.discount_code && (
                  <VoucherBadge rewardType={myPosition.reward_type} code={myPosition.discount_code} />
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
