import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  Trophy,
  Copy,
  Check,
  Calendar,
  ChevronDown,
  Sparkles,
  Info,
} from 'lucide-react';
import { promoService } from '../../services/promoService';

const TABS = [
  { key: 'all', label: 'Semua Promo' },
  { key: 'leaderboard_reward', label: 'Reward Leaderboard' },
  { key: 'other', label: 'Promo Lainnya' },
];

function formatDiscount(promo) {
  return promo.discount_type === 'percentage'
    ? `${Number(promo.discount_value)}%`
    : `Rp${Number(promo.discount_value).toLocaleString('id-ID')}`;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Header card diberi gradient warna sebagai pengganti gambar banner —
// database Promo tidak punya field gambar, jadi warna + ikon jadi
// pembeda visual antar sumber promo (reward otomatis vs promo admin).
function cardTheme(promo) {
  if (promo.source === 'leaderboard_reward') {
    return {
      gradient: 'from-amber-400 via-orange-500 to-orange-600',
      icon: Trophy,
      badgeLabel: 'Reward Leaderboard',
      badgeClass: 'bg-amber-100 text-amber-700',
    };
  }
  return {
    gradient: 'from-brand-500 via-brand-600 to-brand-700',
    icon: Ticket,
    badgeLabel: 'Promo',
    badgeClass: 'bg-brand-100 text-brand-700',
  };
}

// Skeleton kartu promo -- meniru bentuk kartu asli (header gradient +
// body dengan beberapa baris teks & tombol) supaya pergantian ke kartu
// sungguhan tidak terasa sebagai lompatan bentuk, cuma "pudar" dari
// abu-abu ke konten. Dipakai di dalam PromoListSkeleton di bawah.
function PromoCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col animate-pulse">
      <div className="bg-slate-200 h-28" />
      <div className="p-5 flex-1 flex flex-col gap-3">
        <div className="h-3 w-full bg-slate-200 rounded" />
        <div className="h-3 w-2/3 bg-slate-200 rounded" />
        <div className="flex-1" />
        <div className="h-10 bg-slate-200 rounded-lg" />
        <div className="h-10 bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}

// Full-page skeleton -- meniru SELURUH struktur halaman (tombol kembali,
// judul, subtitle, tab, grid kartu), bukan cuma area grid. Sebelumnya
// bagian atas (tombol kembali/judul/subtitle/tab) itu statis dan langsung
// dirender duluan walau `promos` belum selesai di-fetch -- efeknya bagian
// hardcode itu "muncul duluan" lalu badge angka di tab & grid kartu baru
// menyusul belakangan. Sekarang SEMUANYA (termasuk yang statis) ditunggu
// bareng lewat gerbang `loading` tunggal di komponen utama, supaya
// loading terasa sebagai satu proses yang mulus.
function PromoListSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
      <div className="h-7 w-64 max-w-full bg-slate-200 rounded mb-2" />
      <div className="h-4 w-72 max-w-full bg-slate-200 rounded mb-6" />

      <div className="flex items-center gap-2 mb-6">
        <div className="h-9 w-32 bg-slate-200 rounded-md" />
        <div className="h-9 w-44 bg-slate-200 rounded-md" />
        <div className="h-9 w-36 bg-slate-200 rounded-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <PromoCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function PromoList() {
  const navigate = useNavigate();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('all');
  const [copiedCode, setCopiedCode] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    promoService
      .listActive()
      .then((data) => setPromos(Array.isArray(data) ? data : []))
      .catch(() => setError('Gagal memuat daftar promo.'))
      .finally(() => setLoading(false));
  }, []);

  function handleCopy(code) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 1500);
    });
  }

  function handleUsePromo(promo) {
    const target = promo.applicable_package_id
      ? `/app/packages/${promo.applicable_package_id}`
      : '/app/packages';
    navigate(target);
  }

  const filteredPromos = promos.filter((promo) => {
    if (tab === 'all') return true;
    if (tab === 'leaderboard_reward') return promo.source === 'leaderboard_reward';
    return promo.source !== 'leaderboard_reward';
  });

  const counts = {
    all: promos.length,
    leaderboard_reward: promos.filter((p) => p.source === 'leaderboard_reward').length,
    other: promos.filter((p) => p.source !== 'leaderboard_reward').length,
  };

  // Full-page skeleton: tunggu `promos` selesai di-fetch sebelum
  // merender APA PUN, termasuk bagian yang sebelumnya statis/hardcode
  // (tombol kembali, judul, subtitle, tab) -- supaya tidak ada bagian
  // yang "muncul duluan" sementara bagian lain masih menyusul.
  if (loading) {
    return <PromoListSkeleton />;
  }

  return (
    <div>
      <button
        onClick={() => navigate('/app/dashboard')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 mb-4 transition"
      >
        ← Kembali ke Beranda
      </button>

      <h1 className="text-2xl font-bold text-slate-800 mb-1.5">Promo Sedang Berlangsung</h1>
      <p className="text-slate-500 text-sm mb-6">Semua kode promo yang bisa kamu pakai sekarang.</p>

      <div className="inline-flex items-center gap-1 bg-slate-100 rounded-lg p-1 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-md transition ${
              tab === t.key ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
            }`}
          >
            {t.label}
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                tab === t.key ? 'bg-brand-100 text-brand-600' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {error ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-slate-500">{error}</p>
        </div>
      ) : filteredPromos.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
          <Ticket className="mx-auto mb-3 text-slate-300" size={40} strokeWidth={1.5} />
          <p className="text-slate-500">Belum ada promo di kategori ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPromos.map((promo) => {
            const theme = cardTheme(promo);
            const Icon = theme.icon;
            const isExpanded = expandedId === promo.id;
            const validUntilText = formatDate(promo.valid_until);

            return (
              <div
                key={promo.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition"
              >
                {/* Header gradient — pengganti banner gambar */}
                <div className={`relative bg-gradient-to-br ${theme.gradient} px-5 py-5`}>
                  <div className="pointer-events-none absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
                  <div className="relative flex items-start justify-between gap-3">
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${theme.badgeClass}`}>
                      <Icon size={11} />
                      {theme.badgeLabel}
                    </span>
                    <Icon size={22} className="text-white/70 shrink-0" />
                  </div>
                  <p className="relative text-white font-bold text-lg leading-snug mt-3 line-clamp-2">
                    {promo.title}
                  </p>
                  <p className="relative text-white/90 text-sm font-semibold mt-1">
                    Diskon {formatDiscount(promo)}
                    {promo.max_discount_amount != null && (
                      <span className="text-white/70 font-normal">
                        {' '}(maks Rp{Number(promo.max_discount_amount).toLocaleString('id-ID')})
                      </span>
                    )}
                  </p>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col gap-3">
                  {promo.description && (
                    <p className="text-sm text-slate-500 line-clamp-2">{promo.description}</p>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {promo.usage_limit_per_user != null && (
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        Maks {promo.usage_limit_per_user}x per akun
                      </span>
                    )}
                    {promo.new_user_only && (
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        Khusus siswa baru
                      </span>
                    )}
                    {promo.applicable_package_id && (
                      <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        Paket tertentu
                      </span>
                    )}
                  </div>

                  {promo.terms && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : promo.id)}
                      className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline w-fit"
                    >
                      <Info size={12} />
                      Syarat & Ketentuan
                      <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                  {isExpanded && promo.terms && (
                    <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3 -mt-1">{promo.terms}</p>
                  )}

                  <div className="flex-1" />

                  <button
                    onClick={() => handleCopy(promo.code)}
                    className="w-full flex items-center justify-between gap-2 rounded-lg border border-dashed border-slate-300 px-3.5 py-2.5 hover:border-brand-300 transition"
                  >
                    <span className="font-mono font-bold text-sm text-slate-700 tracking-wide">{promo.code}</span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-brand-600">
                      {copiedCode === promo.code ? <Check size={13} /> : <Copy size={13} />}
                      {copiedCode === promo.code ? 'Disalin!' : 'Salin'}
                    </span>
                  </button>

                  {validUntilText && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Calendar size={12} />
                      Berlaku sampai {validUntilText}
                    </p>
                  )}

                  <button
                    onClick={() => handleUsePromo(promo)}
                    className="w-full flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                  >
                    <Sparkles size={14} />
                    Pakai Promo Ini
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}