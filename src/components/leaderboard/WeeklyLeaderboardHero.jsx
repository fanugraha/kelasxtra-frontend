import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Copy, Check, ChevronRight } from 'lucide-react';
import { weeklyLeaderboardService } from '../../services/weeklyLeaderboardService';
import { useAuth } from '../../context/AuthContext';

const medalRing = {
  1: 'ring-yellow-300',
  2: 'ring-slate-300',
  3: 'ring-orange-300',
};

const medalBg = {
  1: 'bg-yellow-300 text-yellow-900',
  2: 'bg-slate-200 text-slate-700',
  3: 'bg-orange-300 text-orange-900',
};

function initials(name = '') {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function computeWeekReset() {
  const now = new Date();
  const day = now.getDay() === 0 ? 7 : now.getDay(); // Senin=1 ... Minggu=7
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + (7 - day));
  endOfWeek.setHours(23, 59, 59, 999);
  const diff = Math.max(0, endOfWeek.getTime() - now.getTime());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
  };
}

// Countdown ke reset periode ISO week (Minggu 23:59:59). State awal dihitung
// lazy via useState(fn) -- bukan di-set di dalam effect -- supaya tidak kena
// rule react-hooks/set-state-in-effect sama sekali.
function useWeekResetCountdown() {
  const [remaining, setRemaining] = useState(computeWeekReset);

  useEffect(() => {
    const id = setInterval(() => setRemaining(computeWeekReset()), 60000);
    return () => clearInterval(id);
  }, []);

  return remaining;
}

function VoucherChip({ code, onCopy, copied }) {
  if (!code) return null;
  return (
    <button
      onClick={onCopy}
      className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-white/15 border border-dashed border-white/40 px-2.5 py-1 rounded-lg hover:bg-white/25 transition shrink-0"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Disalin!' : code}
    </button>
  );
}

// examId: exam Latihan Soal yang leaderboard-nya jadi sorotan utama hero
// Beranda. Kalau null (belum ada exam yang bisa diakses sama sekali),
// panel ini tidak dirender -- konsisten dengan pola WeeklyLeaderboardSection.
export default function WeeklyLeaderboardHero({ examId, resolvingExamId = false, onReady }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [periode, setPeriode] = useState('');
  const [myPosition, setMyPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const resetCountdown = useWeekResetCountdown();

  // Simpan onReady di ref supaya identitas fungsi baru dari parent tiap
  // render tidak memicu effect ini berjalan ulang -- effect cuma boleh
  // re-run kalau examId/resolvingExamId yang berubah.
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (!examId) {
      // Tidak ada exam untuk difetch. Begitu parent sudah pasti (bukan
      // lagi resolving) dan memang tidak ada exam sama sekali, beri tahu
      // parent kalau hero ini "selesai" -- tidak ada apa pun yang perlu
      // ditunggu -- supaya full-page skeleton di Beranda tidak nunggu
      // selamanya menanti hero yang tidak akan pernah fetch apa-apa.
      if (!resolvingExamId) onReadyRef.current?.();
      return;
    }
    setLoading(true);

    Promise.all([
      weeklyLeaderboardService.getLeaderboard(examId),
      weeklyLeaderboardService.getMyPosition(examId).catch(() => null),
    ])
      .then(([leaderboardRes, myPosRes]) => {
        setEntries(leaderboardRes.data || []);
        setPeriode(leaderboardRes.periode || '');
        setMyPosition(myPosRes && myPosRes.ranking ? myPosRes : null);
      })
      .catch(() => {
        setEntries([]);
        setMyPosition(null);
      })
      .finally(() => {
        setLoading(false);
        onReadyRef.current?.();
      });
  }, [examId, resolvingExamId]);

  // Selama examId masih di-resolve oleh parent (belum tau ada exam
  // yang pernah dikerjakan atau tidak), tetap render kartu ini dalam
  // kondisi skeleton -- supaya loading dari hero maroon dan leaderboard
  // tampil BARENG sejak awal, bukan leaderboard baru muncul belakangan
  // setelah kotak skeleton kosong duluan. `loading` di bawah default-nya
  // true dan baru false setelah fetch berdasarkan examId selesai, jadi
  // begitu resolvingExamId selesai dan examId ternyata null/tidak ada,
  // baru komponen ini disembunyikan total.
  if (!examId && !resolvingExamId) return null;

  function handleCopyVoucher() {
    const code = myPosition?.discount_code;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  const top3 = entries.slice(0, 3);
  const myRank = myPosition?.ranking;
  const isEmpty = entries.length === 0 && !myPosition;

  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 py-3.5 sm:px-5 sm:py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-white min-w-0">
          <Trophy size={15} className="text-yellow-300 shrink-0" />
          <p className="text-xs font-bold truncate">
            Leaderboard Mingguan
            {periode && <span className="text-white/50 font-normal"> · {periode}</span>}
          </p>
        </div>
        {loading ? (
          <div className="h-3 w-16 bg-white/10 rounded animate-pulse shrink-0" />
        ) : (
          (resetCountdown.days > 0 || resetCountdown.hours > 0) && (
            <p className="text-white/50 text-[10px] shrink-0">
              Reset {resetCountdown.days}h {resetCountdown.hours}j
            </p>
          )
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-between gap-3 flex-wrap animate-pulse">
          {/* Kiri: skeleton avatar rank + teks, meniru bentuk state myRank */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="shrink-0 w-9 h-9 rounded-full bg-white/15" />
            <div className="min-w-0 space-y-1.5">
              <div className="h-4 w-20 bg-white/15 rounded" />
              <div className="h-3 w-14 bg-white/10 rounded" />
            </div>
          </div>

          {/* Kanan: skeleton mini avatar top3 + link "Lengkap" */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center -space-x-1.5">
              <div className="w-7 h-7 rounded-full bg-white/15 ring-2 ring-white/10" />
              <div className="w-7 h-7 rounded-full bg-white/15 ring-2 ring-white/10" />
              <div className="w-7 h-7 rounded-full bg-white/15 ring-2 ring-white/10" />
            </div>
            <div className="h-3 w-14 bg-white/10 rounded" />
          </div>
        </div>
      ) : isEmpty ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-white/80 text-sm">Belum ada peserta minggu ini — jadi yang pertama!</p>
          <button
            onClick={() => navigate('/app/packages')}
            className="bg-white text-orange-600 font-bold text-xs px-4 py-2 rounded-full hover:bg-orange-50 transition shrink-0"
          >
            Kerjakan Latihan Soal
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Kiri: posisi rank kamu (fokus utama) */}
          <div className="flex items-center gap-4 min-w-0 flex-wrap">
            {myRank ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm ${
                    medalBg[myRank] || 'bg-white/20 text-white'
                  }`}
                >
                  {myRank <= 3 ? <Medal size={16} /> : `#${myRank}`}
                </span>
                <div className="min-w-0">
                  <p className="text-white font-bold text-base leading-tight">Rank #{myRank}</p>
                  <p className="text-white/60 text-[11px]">Skor {myPosition.skor_terbaik}</p>
                </div>
              </div>
            ) : (
              <p className="text-white/80 text-xs">
                Belum masuk ranking.{' '}
                <button onClick={() => navigate('/app/packages')} className="underline font-semibold text-white">
                  Kerjakan soal
                </button>
              </p>
            )}
            {myPosition?.discount_code && (
              <VoucherChip code={myPosition.discount_code} onCopy={handleCopyVoucher} copied={copied} />
            )}
          </div>

          {/* Kanan: mini avatar top 3 (tanpa bar podium) + link lengkap */}
          <div className="flex items-center gap-3 shrink-0">
            {top3.length > 0 && (
              <div className="flex items-center -space-x-1.5">
                {top3.map((entry) => {
                  const isMe = user && entry.user?.id === user.id;
                  return (
                    <button
                      key={entry.ranking}
                      onClick={() => navigate('/app/leaderboard')}
                      title={`#${entry.ranking} ${entry.user?.name} · ${entry.skor_terbaik}`}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold ring-2 ${
                        medalBg[entry.ranking] || 'bg-white/20 text-white'
                      } ${isMe ? 'ring-white' : medalRing[entry.ranking] || 'ring-white/20'}`}
                    >
                      {initials(entry.user?.name)}
                    </button>
                  );
                })}
              </div>
            )}
            <button
              onClick={() => navigate('/app/leaderboard')}
              className="text-white/70 hover:text-white text-[11px] font-semibold flex items-center gap-0.5 whitespace-nowrap"
            >
              Lengkap <ChevronRight size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}