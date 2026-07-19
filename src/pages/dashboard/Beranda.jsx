import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy, Sparkles,
  BookOpen, GraduationCap, ChevronRight, Settings2,
  TrendingUp, Star, Flame, Bell, BellRing,
  MessageCircle, PenLine, LayoutGrid, PlayCircle,
  Compass, Copy, Check,
} from 'lucide-react';
import { packageService } from '../../services/packageService';
import { examBatchService } from '../../services/examBatchService';
import { examService } from '../../services/examService';
import { classService } from '../../services/classService';
import { promoService } from '../../services/promoService';
import { useAuth } from '../../context/AuthContext';
import { useOwnedPackageIds } from '../../hooks/useOwnedPackageIds';
import CategoryModal from '../../components/public/CategoryModal';
import PackageCard from '../../components/packages/PackageCard';
import WeeklyLeaderboardHero from '../../components/leaderboard/WeeklyLeaderboardHero';
import RankNotificationToast from '../../components/notifications/RankNotificationToast';
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

// Format nilai diskon dari Promo asli (discount_type: 'percentage' | lainnya
// dianggap nominal rupiah) — tidak ada lagi angka karangan, semua dari data
// promo yang benar-benar aktif.
function formatDiscount(promo) {
  if (!promo) return '';
  return promo.discount_type === 'percentage'
    ? `${Number(promo.discount_value)}%`
    : `Rp${Number(promo.discount_value).toLocaleString('id-ID')}`;
}

function formatPromoDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });
}

// `valid_until` di database cuma tanggal (tanpa jam), jadi deadline
// dianggap sampai akhir hari itu (23:59:59) — konsisten sama pengecekan
// backend (`now()->toDateString() > $promo->valid_until->toDateString()`).
function getPromoDeadline(validUntil) {
  if (!validUntil) return null;
  const d = new Date(validUntil);
  d.setHours(23, 59, 59, 0);
  return d;
}

// targetDate boleh null (belum ada promo aktif) — countdown diam di 0,
// dan komponen pemanggil yang memutuskan untuk tidak menampilkannya sama
// sekali kalau targetDate null, bukan nampilin 00:00:00:00 seolah ada promo.
function useCountdown(targetDate) {
  const [remaining, setRemaining] = useState(() => (targetDate ? Math.max(0, targetDate - new Date()) : 0));
  useEffect(() => {
    if (!targetDate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRemaining(0);
      return;
    }
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

// Full-page skeleton: dipakai selama SEMUA data utama Beranda masih
// di-fetch (lihat `pageLoading` di komponen Beranda). Sengaja tidak
// per-section lagi -- section-section kecil yang muncul gantian bikin
// loading kelihatan berantakan ("popcorn"). Bentuknya sengaja meniru
// proporsi tiap section di halaman asli supaya begitu data siap dan
// skeleton diganti konten asli, tidak ada lompatan tata letak yang
// terasa.
function BerandaSkeleton() {
  return (
    <div className="relative animate-pulse">
      {/* Hero */}
      <div className="rounded-2xl p-6 sm:p-8 pb-14 sm:pb-16 bg-slate-200">
        <div className="h-8 w-56 max-w-full bg-slate-300 rounded mb-3" />
        <div className="h-4 w-80 max-w-full bg-slate-300 rounded mb-2" />
        <div className="h-3 w-24 bg-slate-300 rounded mb-6" />
        <div className="h-20 bg-slate-300/70 rounded-2xl mb-3" />
        <div className="h-12 bg-slate-300/70 rounded-xl" />
      </div>

      {/* Quick access */}
      <div className="relative z-10 -mt-8 sm:-mt-9 mx-1 sm:mx-4 bg-white rounded-xl shadow-lg border border-slate-100 px-3 sm:px-5 py-3.5 mb-8 flex items-center gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 min-w-[92px] flex flex-col items-center gap-1.5 px-2 py-1.5">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="h-2.5 w-14 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Tabs + grid rekomendasi */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="h-9 w-48 bg-slate-200 rounded-lg" />
        <div className="h-4 w-16 bg-slate-200 rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 h-56">
            <div className="h-4 w-2/3 bg-slate-200 rounded mb-3" />
            <div className="h-3 w-1/2 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-1/3 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Kategori Cepat */}
      <div className="mb-10">
        <div className="h-5 w-32 bg-slate-200 rounded mb-4" />
        <div className="flex flex-wrap gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-28 bg-slate-200 rounded-full" />
          ))}
        </div>
      </div>

      {/* Leaderboard Try Out */}
      <div className="h-[52px] bg-white rounded-xl border border-slate-200 mb-10" />

      {/* Kelas Online */}
      <div className="h-5 w-36 bg-slate-200 rounded mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 h-28" />
        ))}
      </div>
    </div>
  );
}

export default function Beranda() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [preferredProgramId, setPreferredProgramId] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('preferred_program_id');
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Paket yang sudah dimiliki disembunyikan dari Beranda juga — konsisten
  // dengan Packages.jsx, supaya tidak muncul di mana pun kecuali "Paket
  // Belajar Saya".
  const { ownedPackageIds, loadingOwned } = useOwnedPackageIds();
  const availablePackages = useMemo(
    () => packages.filter((pkg) => !ownedPackageIds.has(pkg.id)),
    [packages, ownedPackageIds]
  );

  // ── Latihan Fokus — paket yang jual 1 topik spesifik (mis. cuma TWK) ──
  const [focusPackages, setFocusPackages] = useState([]);
  const [loadingFocusPackages, setLoadingFocusPackages] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingFocusPackages(true);
    packageService
      .getFocusTopicPackages(preferredProgramId)
      .then((data) => {
        if (active) setFocusPackages(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setFocusPackages([]);
      })
      .finally(() => {
        if (active) setLoadingFocusPackages(false);
      });
    return () => { active = false; };
  }, [preferredProgramId]);

  const availableFocusPackages = useMemo(
    () => focusPackages.filter((pkg) => !ownedPackageIds.has(pkg.id)),
    [focusPackages, ownedPackageIds]
  );

  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [weeklyLeaderboardExamId, setWeeklyLeaderboardExamId] = useState(null);
  const [resolvingWeeklyLeaderboardExamId, setResolvingWeeklyLeaderboardExamId] = useState(true);
  const [heroReady, setHeroReady] = useState(false);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResolvingWeeklyLeaderboardExamId(true);
    examService
      .getLatestAttemptedExamId()
      .then((examId) => setWeeklyLeaderboardExamId(examId))
      .catch(() => setWeeklyLeaderboardExamId(null))
      .finally(() => setResolvingWeeklyLeaderboardExamId(false));
  }, []);

  const visibleBatches = preferredProgramId === null
    ? batches
    : batches.filter((batch) => batch.program_id === preferredProgramId);

  useEffect(() => {
    if (visibleBatches.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedBatchId('');
      return;
    }
    if (!visibleBatches.some((batch) => String(batch.id) === String(selectedBatchId))) {
      setSelectedBatchId(visibleBatches[0].id);
    }
  }, [visibleBatches, selectedBatchId]);

  useEffect(() => {
    if (!selectedBatchId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // ── Promo aktif dari backend (GET /promos/active) ───────────────────
  // Endpoint sudah ada dan cuma ngembaliin promo yang benar-benar belum
  // kedaluwarsa, diurutkan dari yang paling cepat berakhir. Hero cuma
  // nampilin SATU promo (yang paling cepat berakhir = paling mendesak
  // buat diklaim), tapi kalau ada lebih dari satu, sisanya ditunjukkan
  // lewat indikator "+N promo lainnya" — bukan dipaksa muat semua di
  // satu banner. Kalau kosong, berarti memang tidak ada promo jalan,
  // dan banner TIDAK menampilkan diskon/countdown apa pun (jangan bikin
  // urgency palsu).
  const [activePromos, setActivePromos] = useState([]);
  const [loadingPromo, setLoadingPromo] = useState(true);

  useEffect(() => {
    let active = true;
    promoService
      .listActive()
      .then((promos) => {
        if (active) setActivePromos(Array.isArray(promos) ? promos : []);
      })
      .catch(() => {
        if (active) setActivePromos([]);
      })
      .finally(() => {
        if (active) setLoadingPromo(false);
      });
    return () => { active = false; };
  }, []);

  const activePromo = activePromos[0] || null;
  const otherPromoCount = Math.max(activePromos.length - 1, 0);

  const promoDeadline = useMemo(() => getPromoDeadline(activePromo?.valid_until), [activePromo]);
  const countdown = useCountdown(promoDeadline);
  const pad = (n) => String(n).padStart(2, '0');

  // Copy kode promo dari hero — supaya user yang buru-buru klik "Klaim
  // Promo" langsung punya kodenya di clipboard, tidak perlu ke halaman
  // lain dulu buat tau kodenya.
  const [promoCodeCopied, setPromoCodeCopied] = useState(false);
  // Sengaja TIDAK digerbangi nomor HP: kodenya sudah tampil polos di
  // hero, jadi menggerbangi cara menyalinnya tidak menghalangi apa pun
  // (orang tetap bisa baca lalu ketik manual) — cuma bikin gesekan buat
  // user jujur yang sekadar mau klik salin. Gerbang nomor HP ditaruh di
  // "Klaim Promo" saja, tempat niat beli beneran terjadi.
  function handleCopyPromoCode() {
    if (!activePromo?.code) return;
    navigator.clipboard.writeText(activePromo.code).then(() => {
      setPromoCodeCopied(true);
      setTimeout(() => setPromoCodeCopied(false), 1500);
    });
  }

  // ── Waitlist "Ingatkan Saya" untuk Kelas Online ─────────────────────
  // TODO(API): saat ini disimpan di localStorage saja. Ganti ke endpoint
  // waitlist (mis. POST /classes/waitlist) begitu tersedia, supaya minat
  // user benar-benar tercatat di backend, bukan cuma di browser dia.
  const [waitlisted, setWaitlisted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // Kalau promo cuma berlaku buat 1 paket tertentu (applicable_package_id
  // terisi), arahkan langsung ke paket itu — jangan lempar ke daftar
  // umum dan biarkan user mencari sendiri paket mana yang dapat promo.
  const promoClaimTarget = activePromo?.applicable_package_id
    ? `/app/packages/${activePromo.applicable_package_id}`
    : '/app/packages';

  function handleClaimPromo() {
    navigate(promoClaimTarget);
  }

  // ── Trending Minggu Ini ─────────────────────────────────────────────
  // TODO(API): jumlah pembeli di bawah ini masih dummy. Idealnya dari
  // endpoint yang menghitung transaksi terbaru per paket (mis. field
  // `recent_purchase_count` di response packages), lalu diurutkan
  // menurun. Sementara diambil dari 4 paket teratas yang sudah termuat.
  const trendingPackages = useMemo(() => {
    const mockCounts = [312, 248, 195, 167];
    return availablePackages.slice(0, 4).map((pkg, i) => ({ pkg, count: mockCounts[i] ?? 120 }));
  }, [availablePackages]);

  // Full-page skeleton: tunggu SEMUA data utama siap sebelum merender
  // apa pun, supaya loading terasa sebagai satu proses yang mulus --
  // bukan section-section kecil yang muncul gantian tidak sinkron.
  // `heroReady` mewakili leaderboard mingguan di dalam hero (dia fetch
  // datanya sendiri setelah examId diketahui, jadi tidak cukup hanya
  // menunggu `resolvingWeeklyLeaderboardExamId`).
  const pageLoading =
    loadingPrograms ||
    loadingPackages ||
    loadingFocusPackages ||
    loadingOwned ||
    loadingClasses ||
    loadingContinue ||
    loadingLeaderboard ||
    loadingPromo ||
    resolvingWeeklyLeaderboardExamId ||
    !heroReady;

  // PENTING: konten asli TETAP di-mount (bukan diganti total lewat early
  // return) walau pageLoading masih true. Kalau di-unmount, komponen anak
  // seperti WeeklyLeaderboardHero tidak akan pernah sempat menjalankan
  // fetch-nya (efeknya tidak jalan sama sekali kalau tidak pernah
  // dirender), sehingga `onReady` tidak pernah terpanggil dan
  // `pageLoading` macet selamanya menunggu sesuatu yang tidak akan
  // pernah terjadi. Solusinya: konten asli tetap dirender & tetap fetch
  // data di background, cuma disembunyikan pakai `hidden` sampai semua
  // siap -- skeleton ditumpuk di atasnya sebagai apa yang benar-benar
  // terlihat pengguna.
  return (
    <div className="relative">
      <RankNotificationToast />
      {pageLoading && <BerandaSkeleton />}
      <div className={pageLoading ? 'hidden' : ''}>
    <div className="relative">
      {/* ── Greeting + Promo (digabung jadi 1 card) ───────────────────
          Menggantikan hero maroon terpisah + promo banner terpisah.
          Semua animasi (gradient flow, floating blob, shimmer badge,
          pulsing CTA, wave emoji) dipertahankan persis seperti versi
          promo banner sebelumnya — tidak disederhanakan. */}
      <div
        className="relative rounded-2xl p-6 sm:p-8 pb-14 sm:pb-16 overflow-hidden bg-[length:200%_200%] animate-[flowGradient_8s_ease_infinite]"
        style={{
          backgroundImage:
            'linear-gradient(120deg, #f97316 0%, #ef4444 25%, #dc2626 50%, #ef4444 75%, #f97316 100%)',
        }}
      >
        {/* Blob dekoratif melayang */}
        <div className="pointer-events-none absolute -top-10 -right-6 w-44 h-44 rounded-full bg-white/15 blur-3xl animate-[floatBlob1_6s_ease-in-out_infinite]" />
        <div className="pointer-events-none absolute -bottom-16 left-10 w-56 h-56 rounded-full bg-yellow-300/20 blur-3xl animate-[floatBlob2_7s_ease-in-out_infinite]" />

        {/* Baris 1: Sapaan + Ganti Kategori */}
        <div className="relative text-white mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight flex flex-wrap items-center gap-2 mb-2">
            {user?.name ? (
              <>
                Halo, {user.name.split(' ')[0]}
                <span className="inline-block origin-[70%_70%] animate-[wave_2.2s_ease-in-out_infinite]">👋</span>
              </>
            ) : (
              'Persiapan Try Out Terbesar & Terlengkap'
            )}
          </h1>
          <p className="text-white/85 text-sm sm:text-base max-w-md mb-1">
            Kumpulkan skor terbaik minggu ini dan naik ke puncak leaderboard.
          </p>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-1 text-white/65 hover:text-white text-xs font-medium transition"
          >
            <Settings2 size={12} />
            Ganti Kategori
          </button>
        </div>

        {/* Baris 2: Leaderboard Mingguan — SOROTAN UTAMA hero, menggantikan
            promo sebagai fokus visual pertama yang dilihat siswa. */}
        <div className="relative">
          <WeeklyLeaderboardHero
            examId={weeklyLeaderboardExamId}
            resolvingExamId={resolvingWeeklyLeaderboardExamId}
            onReady={() => setHeroReady(true)}
          />
        </div>

        {/* Baris 3: Promo — diturunkan jadi strip sekunder di bawah
            leaderboard. Semua perilaku asli (copy kode, countdown, klaim,
            shimmer badge) dipertahankan persis, cuma diperkecil ukurannya. */}
        {activePromo ? (
          <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 bg-white/10 rounded-xl px-4 py-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="relative inline-flex items-center gap-1.5 overflow-hidden bg-white/20 text-xs font-bold px-2.5 py-1 rounded-full">
                  <Flame size={12} />
                  {activePromo.title}
                  <span className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                </span>
                <button
                  onClick={handleCopyPromoCode}
                  className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold font-mono px-2.5 py-1 rounded-full transition"
                >
                  {promoCodeCopied ? <Check size={12} /> : <Copy size={12} />}
                  {activePromo.code}
                </button>
              </div>
              <p className="text-white/75 text-xs">
                Diskon <span className="font-bold text-white">{formatDiscount(activePromo)}</span>
                {' '}· Berlaku sampai {formatPromoDate(activePromo.valid_until)}
                {otherPromoCount > 0 && (
                  <button
                    onClick={() => navigate('/app/promos')}
                    className="ml-1.5 underline underline-offset-2 font-semibold text-white hover:text-white/80 transition"
                  >
                    +{otherPromoCount} promo lainnya
                  </button>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 text-white/90">
                {[
                  ['H', countdown.days],
                  ['J', countdown.hours],
                  ['M', countdown.minutes],
                  ['D', countdown.seconds],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white/10 rounded-md px-1.5 py-1 text-center min-w-[28px]">
                    <p className="text-xs font-bold leading-none">{pad(value)}</p>
                    <p className="text-[8px] text-white/60 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={handleClaimPromo}
                className="bg-white text-orange-600 font-bold text-xs px-4 py-2 rounded-full hover:bg-orange-50 transition whitespace-nowrap animate-[pulseCta_2s_ease-in-out_infinite] shadow-lg"
              >
                Klaim
                <ChevronRight size={13} className="inline ml-0.5" />
              </button>
            </div>
          </div>
        ) : null}

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

      {/* Quick Access — "mengambang" di tepi bawah hero, terinspirasi
          strip kategori putih di Ruangguru yang overlap ke hero biru. */}
      <div className="relative z-10 -mt-8 sm:-mt-9 mx-1 sm:mx-4 bg-white rounded-xl shadow-lg border border-slate-100 px-3 sm:px-5 py-3.5 mb-8 flex items-center gap-1 overflow-x-auto">
        {QUICK_ACCESS.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.to)}
            className="flex-1 min-w-[92px] flex flex-col items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition"
          >
            <span className={`w-10 h-10 rounded-full flex items-center justify-center ${item.color}`}>
              <item.icon size={18} />
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-700 text-center leading-tight">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Lanjutkan Belajar — hanya tampil kalau ketemu attempt yang sedang
          berjalan. Progress bar dibuat "indeterminate" (bukan angka %)
          karena API belum expose jumlah soal terjawab — lihat TODO(API)
          di atas kalau field itu sudah tersedia. */}
      {continueItem ? (
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

      {/* Latihan Fokus — paket yang jual 1 topik spesifik (mis. cuma TWK),
          ditampilkan di atas Rekomendasi/Trending karena ini aksi cepat
          untuk siswa yang sudah tahu kelemahannya (mis. lemah TWK).
          Disembunyikan total kalau tidak ada paket fokus untuk kategori
          ini -- bukan nampilin section kosong. */}
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
          {availablePackages.length === 0 ? (
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
              {availablePackages.map((pkg, idx) => (
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

      {availableFocusPackages.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h2 className="text-lg font-bold text-slate-800">Fokus Satu Topik</h2>
            <button
              onClick={() => navigate('/app/packages')}
              className="shrink-0 text-sm font-semibold text-brand-600 hover:underline flex items-center gap-1"
            >
              Lainnya <ChevronRight size={14} />
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
            {availableFocusPackages.map((pkg) => (
              <div key={pkg.id} className="shrink-0 snap-start">
                <PackageCard
                  pkg={pkg}
                  onOpen={() => navigate(`/app/packages/${pkg.id}`)}
                  ctaLabel="Mulai Latihan"
                  typeBadgeLabel={pkg.category ? `Fokus ${pkg.category.code || pkg.category.name}` : 'Fokus 1 Topik'}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kategori Cepat */}
      {programs.length > 0 && (
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

      {/* Leaderboard Try Out — diringkas jadi 1 baris (sebelumnya card
          besar yang seringkali kosong karena berbasis jadwal batch, bukan
          selalu aktif seperti Latihan Soal). Detail lengkap tetap ada di
          halaman /app/leaderboard. Render WeeklyLeaderboardSection lama
          juga dihapus di sini — sudah pindah ke hero (WeeklyLeaderboardHero). */}
      <button
        onClick={() => navigate('/app/leaderboard')}
        className="w-full flex items-center justify-between gap-3 bg-white rounded-xl border border-slate-200 px-5 py-3.5 mb-10 hover:border-brand-300 transition text-left"
      >
        <span className="flex items-center gap-2 text-sm text-slate-600 min-w-0">
          <Trophy size={16} className="text-brand-500 shrink-0" />
          <span className="truncate">
            {visibleBatches.length === 0
              ? 'Belum ada try out yang sudah selesai dinilai.'
              : leaderboardError
              ? leaderboardError
              : leaderboard.length === 0
              ? 'Belum ada peserta di try out ini.'
              : myEntry
              ? `Kamu Rank #${myEntry.rank} di Leaderboard Try Out`
              : 'Leaderboard Try Out sudah tersedia — lihat rankingnya'}
          </span>
        </span>
        <span className="text-xs font-semibold text-brand-600 flex items-center gap-1 shrink-0">
          Lihat <ChevronRight size={13} />
        </span>
      </button>

      {/* Kelas Online */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Kelas Online</h2>
      </div>

      {classes.length === 0 ? (
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
      </div>
    </div>
  );
}