import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Tag, Clock, ShoppingBag, Trophy, Medal, Sparkles,
  BookOpen, GraduationCap, ChevronRight, Settings2,
  Users, TrendingUp, Star, Flame, Bell, BellRing,
  MessageCircle, PenLine, LayoutGrid, PlayCircle,
  Copy, Check, Share2, Compass,
} from 'lucide-react';
import { packageService } from '../../services/packageService';
import { examBatchService } from '../../services/examBatchService';
import { examService } from '../../services/examService';
import { classService } from '../../services/classService';
import { useAuth } from '../../context/AuthContext';
import CategoryModal from '../../components/public/CategoryModal';
import PackageCard from '../../components/packages/PackageCard';
// ─────────────────────────────────────────────────────────────────────────
// KONTEN STATIS
// Semua konstanta di bawah ini murni tampilan/marketing (bukan hasil CRUD),
// jadi cukup diedit manual di sini. Yang butuh data backend (belum ada
// endpoint-nya) ditandai jelas "TODO(API)" supaya gampang dicari nanti.
//
// CATATAN REDESIGN: Stats strip dan Testimoni Alumni sengaja DIHAPUS dari
// Beranda karena sudah ada di Landing page — di sini user sudah login/
// percaya, jadi Beranda fokus mengarahkan ke aksi (lanjut belajar / beli
// paket), bukan meyakinkan lagi lewat social proof.
// ─────────────────────────────────────────────────────────────────────────

const rankStyle = {
  1: 'bg-yellow-100 text-yellow-700',
  2: 'bg-slate-200 text-slate-700',
  3: 'bg-orange-100 text-orange-700',
};

// Shortcut navigasi utama — tujuannya biar user 1 tap sampai ke fitur inti.
const QUICK_ACCESS = [
  { icon: PenLine, label: 'Latihan Soal', to: '/app/packages', color: 'bg-brand-50 text-brand-600' },
  { icon: GraduationCap, label: 'Kelas Online', to: '/app/classes', color: 'bg-orange-50 text-orange-600' },
  { icon: LayoutGrid, label: 'Paket Saya', to: '/app/my-packages', color: 'bg-emerald-50 text-emerald-600' },
  { icon: Trophy, label: 'Leaderboard', to: '/app/leaderboard', color: 'bg-yellow-50 text-yellow-600' },
];

// TODO(API): idealnya nomor WA & jadwal CS diambil dari settings/admin panel.
const WHATSAPP_NUMBER = '6281234567890';
const WHATSAPP_MESSAGE = 'Halo Xtracademy, saya mau tanya soal paket belajar.';

// TODO(API): ganti dengan tanggal akhir promo asli dari backend (mis. field
// `promo_ends_at` di endpoint settings/promo). Untuk sekarang: akhir minggu ini.
function getPromoDeadline() {
  const d = new Date();
  const daysUntilSunday = (7 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSunday);
  d.setHours(23, 59, 59, 0);
  return d;
}

function useCountdown(targetDate) {
  const [remaining, setRemaining] = useState(() => Math.max(0, targetDate - new Date()));
  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(Math.max(0, targetDate - new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, expired: remaining <= 0 };
}

export default function Beranda() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [preferredProgramId, setPreferredProgramId] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('preferred_program_id');
    if (stored && stored !== 'all') setPreferredProgramId(Number(stored));
  }, []);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  useEffect(() => {
    packageService.getPrograms().then(setPrograms).finally(() => setLoadingPrograms(false));
  }, []);

  useEffect(() => {
    if (loadingPrograms) return;
    const stored = localStorage.getItem('preferred_program_id');
    if (stored === null && programs.length > 0) {
      handleSelectCategory(programs[0]);
    }
  }, [loadingPrograms, programs]);

  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [packagesError, setPackagesError] = useState('');

  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState('');

  useEffect(() => {
    classService
      .listClasses()
      .then((data) => setClasses(data.filter((c) => c.is_accessible)))
      .catch(() => { })
      .finally(() => setLoadingClasses(false));
  }, []);

  // ── Lanjutkan Belajar ────────────────────────────────────────────────
  // TODO(API): backend belum punya endpoint ringkas seperti
  // `GET /me/continue-learning` yang langsung balikin attempt yang sedang
  // berjalan. Untuk sekarang kita cek satu-satu lewat `getExamSummary` per
  // exam (dibatasi 6 exam pertama biar tidak berat), ambil yang pertama
  // ketemu `in_progress_attempt_id`. Ganti ke 1 endpoint kalau sudah ada.
  const [continueItem, setContinueItem] = useState(null);
  const [loadingContinue, setLoadingContinue] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingContinue(true);

    examService
      .listMyExams()
      .then((exams) => {
        const candidates = (exams || []).slice(0, 6);
        return Promise.allSettled(
          candidates.map((exam) =>
            examService.getExamSummary(exam.id).then((summary) => ({ exam, summary }))
          )
        );
      })
      .then((results) => {
        if (!active) return;
        const found = results
          .filter((r) => r.status === 'fulfilled')
          .map((r) => r.value)
          .find((r) => r.summary?.in_progress_attempt_id);
        setContinueItem(found || null);
      })
      .catch(() => {
        if (active) setContinueItem(null);
      })
      .finally(() => {
        if (active) setLoadingContinue(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    examBatchService
      .listRanked()
      .then((data) => setBatches(data))
      .catch(() => setLeaderboardError('Gagal memuat daftar try out.'))
      .finally(() => setLoadingLeaderboard(false));
  }, []);

  const visibleClasses = preferredProgramId === null
    ? classes
    : classes.filter((cls) => cls.program_id === preferredProgramId);

  const visibleBatches = preferredProgramId === null
    ? batches
    : batches.filter((batch) => batch.program_id === preferredProgramId);

  useEffect(() => {
    if (visibleBatches.length === 0) {
      setSelectedBatchId('');
      return;
    }
    if (!visibleBatches.some((batch) => String(batch.id) === String(selectedBatchId))) {
      setSelectedBatchId(visibleBatches[0].id);
    }
  }, [visibleBatches, selectedBatchId]);

  useEffect(() => {
    if (!selectedBatchId) return;
    setLoadingLeaderboard(true);
    setLeaderboardError('');
    examBatchService
      .getLeaderboard(selectedBatchId)
      .then((data) => setLeaderboard(data.slice(0, 5)))
      .catch(() => setLeaderboardError('Leaderboard belum tersedia untuk try out ini.'))
      .finally(() => setLoadingLeaderboard(false));
  }, [selectedBatchId]);

  const packagesRequestId = useRef(0);

  const loadPackages = useCallback((programId) => {
    const requestId = ++packagesRequestId.current;
    setLoadingPackages(true);
    setPackagesError('');
    const request = programId
      ? packageService.listPackages(programId)
      : packageService.getRecommendedPackages().then((res) => res.packages);

    request
      .then((data) => {
        if (requestId === packagesRequestId.current) setPackages(data);
      })
      .catch(() => {
        if (requestId === packagesRequestId.current) {
          setPackagesError('Gagal memuat rekomendasi paket.');
        }
      })
      .finally(() => {
        if (requestId === packagesRequestId.current) setLoadingPackages(false);
      });
  }, []);

  useEffect(() => {
    loadPackages(preferredProgramId);
  }, [preferredProgramId, loadPackages]);

  function handleSelectCategory(program) {
    localStorage.setItem('preferred_program_id', program.id);
    setPreferredProgramId(program.id);
    setShowCategoryModal(false);
  }

  function handleShowAllCategories() {
    localStorage.setItem('preferred_program_id', 'all');
    setPreferredProgramId(null);
    setShowCategoryModal(false);
  }

  // ── Promo / flash sale countdown ────────────────────────────────────
  const promoDeadline = useMemo(() => getPromoDeadline(), []);
  const countdown = useCountdown(promoDeadline);
  const pad = (n) => String(n).padStart(2, '0');

  // ── Waitlist "Ingatkan Saya" untuk Kelas Online ─────────────────────
  // TODO(API): saat ini disimpan di localStorage saja. Ganti ke endpoint
  // waitlist (mis. POST /classes/waitlist) begitu tersedia, supaya minat
  // user benar-benar tercatat di backend, bukan cuma di browser dia.
  const [waitlisted, setWaitlisted] = useState(false);
  useEffect(() => {
    setWaitlisted(localStorage.getItem('waitlist_kelas_online') === '1');
  }, []);
  function handleJoinWaitlist() {
    localStorage.setItem('waitlist_kelas_online', '1');
    setWaitlisted(true);
  }

  // ── Tab "Rekomendasi Untukmu" / "Trending Minggu Ini" ───────────────
  // Digabung jadi 1 section dengan toggle supaya tidak ada 2 "dinding
  // produk" numpuk vertikal — konten dua-duanya tetap ada, tinggal pilih.
  const [packagesTab, setPackagesTab] = useState('rekomendasi');

  // ── Rank user sendiri di leaderboard yang sedang tampil ─────────────
  const myEntry = user ? leaderboard.find((entry) => entry.user?.id === user.id) : null;

  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

  // ── Kode Referral ────────────────────────────────────────────────────
  // TODO(API): kode & jumlah diskon idealnya dibuat & dilacak di backend
  // (mis. GET /me/referral-code) supaya konsisten antar device dan bisa
  // dihitung otomatis saat teman yang diajak benar-benar checkout. Untuk
  // sekarang kode dibangkitkan deterministik dari nama/id user di sisi
  // frontend, jadi tetap sama tiap kali dibuka tapi belum tercatat server.
  const referralCode = useMemo(() => {
    const namePart = (user?.name || 'TEMAN').replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase() || 'TEMAN';
    const idPart = String(user?.id ?? '00').padStart(2, '0').slice(-3);
    return `KX-${namePart}${idPart}`;
  }, [user]);

  const [referralCopied, setReferralCopied] = useState(false);

  function handleCopyReferral() {
    const text = referralCode;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => { });
    }
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  }

  const referralShareHref = `https://wa.me/?text=${encodeURIComponent(
    `Yuk belajar bareng di Xtracademy! Pakai kode referral aku "${referralCode}" buat dapat diskon 15% di paket pertamamu 🎉`
  )}`;

  // ── Trending Minggu Ini ─────────────────────────────────────────────
  // TODO(API): jumlah pembeli di bawah ini masih dummy. Idealnya dari
  // endpoint yang menghitung transaksi terbaru per paket (mis. field
  // `recent_purchase_count` di response packages), lalu diurutkan
  // menurun. Sementara diambil dari 4 paket teratas yang sudah termuat.
  const trendingPackages = useMemo(() => {
    const mockCounts = [312, 248, 195, 167];
    return packages.slice(0, 4).map((pkg, i) => ({ pkg, count: mockCounts[i] ?? 120 }));
  }, [packages]);

  return (
    <div className="relative">
      {/* ── Greeting + Promo (digabung jadi 1 card) ───────────────────
          Menggantikan hero maroon terpisah + promo banner terpisah.
          Semua animasi (gradient flow, floating blob, shimmer badge,
          pulsing CTA, wave emoji) dipertahankan persis seperti versi
          promo banner sebelumnya — tidak disederhanakan. */}
      <div
        className="relative rounded-xl p-5 sm:p-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 overflow-hidden bg-[length:200%_200%] animate-[flowGradient_8s_ease_infinite]"
        style={{
          backgroundImage:
            'linear-gradient(120deg, #f97316 0%, #ef4444 25%, #dc2626 50%, #ef4444 75%, #f97316 100%)',
        }}
      >
        {/* Blob dekoratif melayang */}
        <div className="pointer-events-none absolute -top-10 -right-6 w-44 h-44 rounded-full bg-white/15 blur-3xl animate-[floatBlob1_6s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute -bottom-16 left-10 w-56 h-56 rounded-full bg-yellow-300/20 blur-3xl animate-[floatBlob2_7s_ease-in-out_infinite]" />

        <div className="relative text-white min-w-0">
          <span className="relative inline-flex items-center gap-1.5 overflow-hidden bg-white/20 text-xs font-bold px-2.5 py-1 rounded-full mb-2">
            <Flame size={12} />
            PROMO MINGGU INI
            <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2 flex-wrap">
            {user?.name ? (
              <>
                Halo, {user.name.split(' ')[0]}
                <span className="inline-block origin-[70%_70%] animate-[wave_2.2s_ease-in-out_infinite]">👋</span>
                <span className="font-normal text-white/85 text-sm sm:text-base">
                  — ada promo diskon try out nih!
                </span>
              </>
            ) : (
              'Diskon Spesial Paket Try Out — buruan sebelum harga naik lagi'
            )}
          </h1>
        </div>

        <div className="relative flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-white">
            {[
              ['Hari', countdown.days],
              ['Jam', countdown.hours],
              ['Menit', countdown.minutes],
              ['Detik', countdown.seconds],
            ].map(([label, value]) => (
              <div key={label} className="bg-white/15 rounded-lg px-2.5 py-1.5 text-center min-w-[52px]">
                <p className="text-lg font-bold leading-none">{pad(value)}</p>
                <p className="text-[10px] text-white/70 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/app/packages')}
            className="bg-white text-orange-600 font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-orange-50 transition whitespace-nowrap animate-[pulseCta_2s_ease-in-out_infinite]"
          >
            Klaim Promo
          </button>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-3 py-2 rounded-lg transition backdrop-blur-sm"
          >
            <Settings2 size={13} />
            Ganti Kategori
          </button>
        </div>

        <style>{`
          @keyframes flowGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes floatBlob1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-10px, 12px) scale(1.08); }
          }
          @keyframes floatBlob2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(14px, -10px) scale(1.05); }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes pulseCta {
            0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.5); }
            50% { box-shadow: 0 0 0 8px rgba(255,255,255,0); }
          }
          @keyframes wave {
            0%, 100% { transform: rotate(0deg); }
            15% { transform: rotate(18deg); }
            30% { transform: rotate(-8deg); }
            45% { transform: rotate(18deg); }
            60% { transform: rotate(-4deg); }
            75% { transform: rotate(10deg); }
          }
        `}</style>
      </div>

      {/* Kode Referral — ditaruh tepat di bawah banner promo, strip ramping
          biar tidak bersaing bobot visual, tapi tetap kelihatan awal
          sebelum user scroll lebih jauh. */}
      <div className="mb-8 flex items-center justify-between gap-3 bg-brand-50/60 border border-brand-100 rounded-lg px-4 py-2.5 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <Users size={15} className="text-brand-500 shrink-0" />
          <span className="text-slate-600 truncate">
            <span className="font-semibold text-slate-700">Ajak teman, dapat diskon 15%</span>
            <span className="hidden sm:inline"> — bagikan kode kamu.</span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyReferral}
            className="flex items-center gap-1.5 font-mono font-bold text-xs text-slate-700 bg-white border border-dashed border-slate-300 rounded-md px-2.5 py-1.5 hover:border-brand-300 transition"
            title="Salin kode"
          >
            {referralCode}
            {referralCopied ? <Check size={12} className="text-success-600" /> : <Copy size={12} className="text-slate-400" />}
          </button>
          <a
            href={referralShareHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-brand-600 font-semibold text-xs hover:underline whitespace-nowrap"
          >
            <Share2 size={12} />
            Bagikan
          </a>
        </div>
      </div>

      {/* Lanjutkan Belajar — hanya tampil kalau ketemu attempt yang sedang
          berjalan. Progress bar dibuat "indeterminate" (bukan angka %)
          karena API belum expose jumlah soal terjawab — lihat TODO(API)
          di atas kalau field itu sudah tersedia. */}
      {loadingContinue ? (
        <div className="mb-8 h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
      ) : continueItem ? (
        <div className="mb-8 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5">
          <span className="shrink-0 w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <PlayCircle size={26} strokeWidth={1.75} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-brand-600 uppercase mb-0.5">Lanjutkan Belajar</p>
            <p className="font-bold text-slate-800 mb-2 truncate">{continueItem.exam.title}</p>
            {/* Progress indeterminate: bar animasi bergerak, bukan persentase asli */}
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-brand-500 animate-[indeterminate_1.4s_ease-in-out_infinite]" />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Pengerjaan sedang berjalan, lanjutkan sekarang.</p>
          </div>
          <button
            onClick={() => navigate(`/app/exam/${continueItem.summary.in_progress_attempt_id}`)}
            className="shrink-0 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition"
          >
            Lanjutkan
            <ChevronRight size={15} />
          </button>
          <style>{`
            @keyframes indeterminate {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
          `}</style>
        </div>
      ) : null}

      {/* Quick Access */}
      <div className="mb-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACCESS.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.to)}
              className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center gap-2 hover:border-brand-300 hover:shadow-sm transition"
            >
              <span className={`w-11 h-11 rounded-full flex items-center justify-center ${item.color}`}>
                <item.icon size={20} />
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-700 text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rekomendasi / Trending — FOKUS UTAMA Beranda, diletakkan di atas
          (langsung setelah Quick Access) karena inilah yang paling
          mempermudah user untuk membeli paket. Digabung 1 section pakai
          tab, bukan 2 "dinding produk" numpuk vertikal. */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setPackagesTab('rekomendasi')}
            className={`text-sm font-semibold px-3.5 py-1.5 rounded-md transition ${packagesTab === 'rekomendasi' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
              }`}
          >
            {preferredProgramId === null ? 'Rekomendasi Untukmu' : 'Paket Belajar'}
          </button>
          <button
            onClick={() => setPackagesTab('trending')}
            className={`flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-md transition ${packagesTab === 'trending' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'
              }`}
          >
            <Flame size={13} />
            Trending
          </button>
        </div>
        <button
          onClick={() => navigate('/app/packages')}
          className="shrink-0 text-sm font-semibold text-brand-600 hover:underline flex items-center gap-1"
        >
          Lainnya <ChevronRight size={14} />
        </button>
      </div>

      {packagesError && <p className="text-sm text-danger-600 mb-4">{packagesError}</p>}

      {packagesTab === 'rekomendasi' ? (
        <>
          {loadingPackages ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse h-56" />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center mb-10">
              <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 mb-4">
                <Compass size={26} strokeWidth={1.75} />
              </span>
              <p className="font-semibold text-slate-700 mb-1.5">Belum ada paket untuk kategori ini</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                Tenang, kategori lain punya banyak paket menarik yang bisa kamu coba sekarang.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <button
                  onClick={handleShowAllCategories}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                >
                  Lihat Semua Kategori
                </button>
                <button
                  onClick={() => navigate('/app/packages')}
                  className="bg-white border border-slate-200 hover:border-brand-300 text-slate-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                >
                  Jelajahi Semua Paket
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              {packages.map((pkg, idx) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  onOpen={() => navigate(`/app/packages/${pkg.id}`)}
                  ctaLabel="Lihat Detail"
                  cornerBadge={
                    idx === 0
                      ? { label: 'TERLARIS', icon: Star, className: 'bg-yellow-400 text-yellow-900' }
                      : null
                  }
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="mb-10">
          {trendingPackages.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-sm text-slate-500">Belum ada data trending untuk kategori ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trendingPackages.map(({ pkg, count }, i) => (
                <button
                  key={pkg.id}
                  onClick={() => navigate(`/app/packages/${pkg.id}`)}
                  className="group bg-white rounded-xl border border-slate-200 p-4 text-left flex items-start gap-3 transition duration-200 hover:border-orange-200 hover:shadow-md hover:-translate-y-0.5"
                >
                  <span className="shrink-0 w-8 h-8 rounded-full bg-orange-50 text-orange-600 font-bold text-sm flex items-center justify-center">
                    #{i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm line-clamp-2 mb-1">{pkg.name}</p>
                    <p className="text-xs text-slate-400 mb-2">
                      Rp{Number(pkg.discount_price || pkg.price).toLocaleString('id-ID')}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                      <TrendingUp size={10} />
                      {count} orang membeli minggu ini
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Kategori Cepat */}
      {!loadingPrograms && programs.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Kategori Cepat</h2>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleShowAllCategories}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-semibold transition ${preferredProgramId === null
                ? 'bg-brand-600 border-brand-600 text-white'
                : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                }`}
            >
              <Sparkles size={14} />
              Semua
            </button>
            {programs.map((program) => (
              <button
                key={program.id}
                onClick={() => handleSelectCategory(program)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-sm font-semibold transition ${preferredProgramId === program.id
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
              >
                <BookOpen size={14} />
                {program.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-10">
        <div className="bg-gradient-to-r from-orange-500 to-brand-600 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-white">
            <Trophy size={22} />
            <h2 className="text-lg font-bold">Leaderboard Try Out</h2>
          </div>
          {visibleBatches.length > 0 && (
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 bg-white border-none focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              {visibleBatches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.exam?.title ? `${batch.exam.title} — ${batch.name}` : batch.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="p-6">
          {visibleBatches.length === 0 && !loadingLeaderboard ? (
            <p className="text-slate-500 text-center py-6">Belum ada try out yang sudah selesai dinilai.</p>
          ) : loadingLeaderboard ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : leaderboardError ? (
            <p className="text-slate-500 text-center py-6">{leaderboardError}</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-slate-500 text-center py-6">Belum ada peserta di try out ini.</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {leaderboard.map((entry) => {
                  const isMe = user && entry.user?.id === user.id;
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg ${isMe ? 'bg-brand-50 border border-brand-200' : 'hover:bg-slate-50'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${rankStyle[entry.rank] || 'bg-slate-100 text-slate-500'
                            }`}
                        >
                          {entry.rank <= 3 ? <Medal size={15} /> : entry.rank}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {entry.user?.name} {isMe && <span className="text-brand-600">(Kamu)</span>}
                          </p>
                          <p className="text-xs text-slate-400">{entry.correct_count} soal benar</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-brand-500" />
                        <span className="font-bold text-slate-800">{entry.score}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {user && !myEntry && (
                <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 mb-4 text-sm">
                  <span className="text-slate-500">Kamu belum ikut try out ini.</span>
                  <button
                    onClick={() => navigate('/app/packages')}
                    className="font-semibold text-brand-600 hover:underline flex items-center gap-1"
                  >
                    Ikut Sekarang <ChevronRight size={13} />
                  </button>
                </div>
              )}

              <button
                onClick={() => navigate('/app/leaderboard')}
                className="w-full text-center text-sm font-semibold text-brand-600 hover:underline py-2"
              >
                Lihat Leaderboard Lengkap →
              </button>
            </>
          )}
        </div>
      </div>

      {/* Kelas Online */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Kelas Online</h2>
      </div>

      {loadingClasses ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse h-28" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        <div className="relative rounded-xl p-10 text-center mb-10 overflow-hidden bg-[linear-gradient(135deg,theme(colors.brand.700)_0%,theme(colors.brand.600)_45%,theme(colors.orange.600)_130%)]">
          {/* Aksen blur dekoratif, bukan konten — murni biar gradient tidak flat */}
          <div className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 w-64 h-64 rounded-full bg-orange-400/20 blur-3xl" />

          <div className="relative">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 mb-4">
              <GraduationCap className="text-white" size={26} strokeWidth={1.75} />
            </span>
            <p className="text-white font-bold text-lg mb-1.5">Kelas Online Segera Hadir</p>
            <p className="text-white/75 text-sm max-w-md mx-auto mb-6">
              Kami sedang menyiapkan kelas live bersama tutor berpengalaman. Nantikan update selanjutnya!
            </p>
            <button
              onClick={handleJoinWaitlist}
              disabled={waitlisted}
              className={`inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg transition ${waitlisted
                ? 'bg-white/20 text-white cursor-default'
                : 'bg-white text-brand-700 hover:bg-brand-50 shadow-sm'
                }`}
            >
              {waitlisted ? <BellRing size={15} /> : <Bell size={15} />}
              {waitlisted ? 'Kami akan mengingatkanmu' : 'Ingatkan Saya'}
            </button>
          </div>
        </div>
      ) : visibleClasses.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center mb-10">
          <GraduationCap className="mx-auto mb-3 text-slate-300" size={36} strokeWidth={1.5} />
          <p className="text-slate-500">Belum ada kelas online untuk kategori ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {visibleClasses.map((cls) => (
            <button
              key={cls.id}
              onClick={() => navigate(`/app/classes/${cls.id}`)}
              className="text-left bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:border-brand-200 hover:shadow-md transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                  <GraduationCap size={18} className="text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{cls.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{cls.status}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showCategoryModal && (
        <CategoryModal
          programs={programs}
          loading={loadingPrograms}
          onSelect={handleSelectCategory}
          onSkip={handleShowAllCategories}
          onClose={() => setShowCategoryModal(false)}
          title="Ganti Kategori"
          subtitle="Pilih kategori baru untuk memfilter Beranda kamu."
          skipLabel="Tampilkan Semua Kategori →"
        />
      )}

      {/* Floating CTA WhatsApp */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm px-4 py-3 rounded-full shadow-lg transition"
      >
        <MessageCircle size={18} />
        <span className="hidden sm:inline">Tanya CS</span>
      </a>
    </div>
  );
}