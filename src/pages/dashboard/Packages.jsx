import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PackageSearch, GraduationCap, Copy, Check, Sparkles, Settings2, Gift } from 'lucide-react';
import { packageService } from '../../services/packageService';
import { promoService } from '../../services/promoService';
import CategoryModal from '../../components/public/CategoryModal';
import PackageCard from '../../components/packages/PackageCard';

const TABS = [
  { key: 'latihan_soal', label: 'Latihan Soal' },
  { key: 'kelas_online', label: 'Kelas Online' },
];

function matchesTab(pkg, tabKey) {
  if (tabKey === 'latihan_soal') return pkg.type === 'latihan_soal';
  if (tabKey === 'kelas_online') return pkg.type === 'privat' || pkg.type === 'group';
  return true;
}

// Badge type pada card sengaja hanya tampil kalau TIDAK cocok dengan tab
// yang sedang aktif (mis. suatu saat ada tab "Semua") — kalau pkg.type
// sudah jelas dari tab yang dipilih, menampilkannya lagi di tiap card
// cuma bikin ramai tanpa nambah informasi baru.
const TYPE_LABEL = {
  privat: 'Privat',
  group: 'Group',
  reguler: 'Reguler',
  latihan_soal: 'Latihan Soal',
};

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

// ── Promo banner ────────────────────────────────────────────────────────
// Disamakan gaya dengan promo card di Beranda (gradient warm orange-red)
// supaya "promo" punya bahasa visual yang konsisten di seluruh app. Dibuat
// lebih tenang (hanya gradient flow, tanpa blob/shimmer/pulse) karena di
// halaman ini promo bukan elemen hero utama — fokus utama tetap daftar
// paket di bawahnya.
function PromoBanner({ promos }) {
  const [copiedCode, setCopiedCode] = useState('');

  function handleCopy(code) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(''), 2000);
    });
  }

  const gradientStyle = {
    backgroundImage: 'linear-gradient(120deg, #f97316 0%, #ef4444 35%, #dc2626 65%, #f97316 100%)',
  };

  if (!promos || promos.length === 0) {
    // Fallback: banner statis, tetap informatif tanpa klaim promo palsu.
    return (
      <div
        className="relative overflow-hidden rounded-2xl px-6 py-8 mb-6 bg-[length:200%_200%] animate-[promoFlow_10s_ease_infinite]"
        style={gradientStyle}
      >
        <div className="relative z-10 flex items-center justify-between gap-6">
          <div className="max-w-lg">
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
              <Sparkles size={13} />
              Belajar Jadi Lebih Seru
            </span>
            <h2 className="text-white text-2xl font-extrabold leading-tight mb-2">
              Siap Taklukkan Try Out Berikutnya?
            </h2>
            <p className="text-white/85 text-sm">
              Pilih paket latihan soal atau kelas online yang sesuai targetmu di bawah ini.
            </p>
          </div>
          <Gift className="hidden sm:block text-white/20 shrink-0" size={72} strokeWidth={1.25} />
        </div>
        <style>{`
          @keyframes promoFlow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}</style>
      </div>
    );
  }

  const promo = promos[0];
  const discountLabel =
    promo.discount_type === 'percentage'
      ? `${Number(promo.discount_value)}%`
      : `Rp${Number(promo.discount_value).toLocaleString('id-ID')}`;

  return (
    <div
      className="relative overflow-hidden rounded-2xl px-6 py-7 mb-6 bg-[length:200%_200%] animate-[promoFlow_10s_ease_infinite]"
      style={gradientStyle}
    >
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="max-w-lg">
          <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <Sparkles size={13} />
            Promo Aktif
          </span>
          <h2 className="text-white text-2xl font-extrabold leading-tight mb-2">{promo.title}</h2>
          {promo.description && (
            <p className="text-white/85 text-sm mb-1">{promo.description}</p>
          )}
          <p className="text-white text-sm font-semibold">
            Diskon {discountLabel} · Berlaku sampai{' '}
            {new Date(promo.valid_until).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <button
          onClick={() => handleCopy(promo.code)}
          className="flex items-center justify-center gap-2 bg-white text-orange-600 font-bold px-5 py-3 rounded-lg hover:bg-orange-50 transition shrink-0 border-2 border-dashed border-orange-200"
        >
          {copiedCode === promo.code ? <Check size={16} /> : <Copy size={16} />}
          {copiedCode === promo.code ? 'Kode Disalin!' : `Salin Kode: ${promo.code}`}
        </button>
      </div>
      <style>{`
        @keyframes promoFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}

export default function Packages() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('latihan_soal');

  // Kategori tersimpan dari Beranda (localStorage key sama), supaya "Mulai
  // Belajar" otomatis konsisten dengan kategori yang dipilih user.
  const [preferredProgramId, setPreferredProgramId] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('preferred_program_id');
    if (stored) setPreferredProgramId(Number(stored));
  }, []);

  useEffect(() => {
    packageService.getPrograms().then(setPrograms).finally(() => setLoadingPrograms(false));
  }, []);

  const debouncedQuery = useDebouncedValue(query, 250);

  useEffect(() => {
    packageService
      .listPackages()
      .then(setPackages)
      .catch(() => setError('Gagal memuat daftar paket.'))
      .finally(() => setLoading(false));

    promoService
      .listActive()
      .then(setPromos)
      .catch(() => setPromos([])); // banner fallback statis kalau gagal/kosong
  }, []);

  function handleSelectCategory(program) {
    localStorage.setItem('preferred_program_id', program.id);
    setPreferredProgramId(program.id);
    setShowCategoryModal(false);
  }

  function handleShowAllCategories() {
    localStorage.removeItem('preferred_program_id');
    setPreferredProgramId(null);
    setShowCategoryModal(false);
  }

  const activeProgramName = useMemo(
    () => programs.find((p) => p.id === preferredProgramId)?.name,
    [programs, preferredProgramId]
  );

  const filtered = useMemo(() => {
    let result = packages.filter((pkg) => matchesTab(pkg, activeTab));

    if (preferredProgramId !== null) {
      result = result.filter((pkg) => pkg.program_id === preferredProgramId);
    }

    const q = debouncedQuery.trim().toLowerCase();
    if (q) {
      result = result.filter((pkg) => {
        const haystack = [pkg.name, pkg.program?.name, pkg.subject?.name, pkg.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    return result;
  }, [packages, debouncedQuery, activeTab, preferredProgramId]);

  const isSearching = query !== debouncedQuery;

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Mulai Belajar</h1>
        <div className="rounded-2xl bg-slate-200 animate-pulse h-40 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse h-56" />
          ))}
        </div>
      </div>
    );
  }

  const activeTabLabel = TABS.find((t) => t.key === activeTab)?.label || '';

  return (
    <div>
      {/* Header — judul + subtitle singkat + kategori aktif, disatukan
          dalam satu baris dengan tombol Ganti Kategori supaya terasa 1
          kesatuan, bukan 2 elemen terpisah. */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">Mulai Belajar</h1>
          <p className="text-sm text-slate-500">
            Pilih paket latihan soal atau kelas online sesuai targetmu.
            {activeProgramName && (
              <span className="text-brand-600 font-semibold"> Kategori: {activeProgramName}</span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowCategoryModal(true)}
          className="shrink-0 flex items-center gap-1.5 bg-white border border-slate-200 hover:border-brand-300 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg transition"
        >
          <Settings2 size={14} />
          Ganti Kategori
        </button>
      </div>

      <PromoBanner promos={promos} />

      {/* Tab filter + search — digabung 1 baris supaya user tidak perlu
          "lompat" secara vertikal sebelum sampai ke daftar paket. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === tab.key
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari paket, program, atau mata pelajaran..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
          />
        </div>
      </div>

      {debouncedQuery.trim() ? (
        <p className="text-xs text-slate-400 mb-4">
          {isSearching ? 'Mencari...' : `${filtered.length} hasil ditemukan untuk "${debouncedQuery}"`}
        </p>
      ) : (
        <div className="mb-6" />
      )}

      {error && <p className="text-sm text-danger-600 mb-4">{error}</p>}

      <h2 className="text-lg font-bold text-slate-800 mb-4">{activeTabLabel}</h2>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <PackageSearch className="mx-auto mb-3 text-slate-300" size={40} strokeWidth={1.5} />
          <p className="text-slate-500">
            {debouncedQuery.trim()
              ? 'Tidak ada paket yang cocok dengan pencarian.'
              : `Belum ada paket ${activeTabLabel.toLowerCase()} tersedia saat ini.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onOpen={() => navigate(`/app/packages/${pkg.id}`)}
              ctaLabel="Lihat Detail"
              typeBadgeLabel={!matchesTab(pkg, activeTab) ? (TYPE_LABEL[pkg.type] || pkg.type) : null}
            />
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
          subtitle="Pilih kategori baru untuk memfilter paket yang tampil."
          skipLabel="Tampilkan Semua Kategori →"
        />
      )}
    </div>
  );
}