import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, PackageSearch, Copy, Check, Sparkles, Settings2, Gift } from 'lucide-react';
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
// Card promo ringkas — dipakai saat promo aktif ada 2 atau lebih, supaya
// semua promo kelihatan (bukan cuma promos[0] seperti banner tunggal).
// Sengaja lebih ringkas dari banner besar: judul, diskon, kode+salin,
// tanggal berakhir saja — tanpa deskripsi panjang, karena beberapa card
// ini akan berdampingan sekaligus di layar yang sama.
function PromoCard({ promo }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(promo.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const discountLabel =
    promo.discount_type === 'percentage'
      ? `${Number(promo.discount_value)}%`
      : `Rp${Number(promo.discount_value).toLocaleString('id-ID')}`;

  return (
    <div
      className="relative overflow-hidden rounded-xl px-4 py-4 shrink-0 w-64 sm:w-72 bg-[length:200%_200%] animate-[promoFlow_10s_ease_infinite]"
      style={{
        backgroundImage: 'linear-gradient(120deg, #f97316 0%, #ef4444 35%, #dc2626 65%, #f97316 100%)',
      }}
    >
      <span className="inline-flex items-center gap-1 bg-white/20 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full mb-2">
        <Sparkles size={11} />
        Promo Aktif
      </span>
      <h3 className="text-white text-sm font-bold leading-snug line-clamp-2 mb-1.5" title={promo.title}>
        {promo.title}
      </h3>
      <p className="text-white/90 text-xs font-semibold mb-3">
        Diskon {discountLabel} · s.d.{' '}
        {new Date(promo.valid_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
      </p>
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-1.5 bg-white text-orange-600 font-bold text-xs px-3 py-2 rounded-lg hover:bg-orange-50 transition border-2 border-dashed border-orange-200"
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? 'Disalin!' : promo.code}
      </button>
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

  // 2+ promo aktif: strip horizontal berisi semua promo, bukan cuma
  // promos[0] — supaya tidak ada promo yang "hilang" dari pandangan user.
  if (promos && promos.length >= 2) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} className="text-orange-500" />
          <h2 className="text-sm font-bold text-slate-700">{promos.length} Promo Sedang Berlangsung</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {promos.map((promo) => (
            <PromoCard key={promo.id} promo={promo} />
          ))}
        </div>
      </div>
    );
  }

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

// Full-page skeleton -- meniru struktur SELURUH halaman (header + tombol
// Ganti Kategori, promo banner, baris tab+search, judul section, grid
// card) supaya semua bagian tampil bareng dalam satu proses loading.
// PENTING: skeleton ini sudah mencakup header-nya sendiri -- jangan
// render judul "Mulai Belajar" yang hardcode di LUAR komponen ini saat
// loading, karena itu bikin judul asli nongol duluan sementara sisanya
// masih skeleton (persis masalah yang diperbaiki di PromoList).
function PackagesSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="h-7 w-40 bg-slate-200 rounded mb-2" />
          <div className="h-4 w-72 max-w-full bg-slate-200 rounded" />
        </div>
        <div className="h-9 w-36 bg-slate-200 rounded-lg shrink-0" />
      </div>

      {/* Promo banner */}
      <div className="rounded-2xl bg-slate-200 h-40 mb-6" />

      {/* Tab filter + search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          <div className="h-9 w-32 bg-slate-200 rounded-full" />
          <div className="h-9 w-32 bg-slate-200 rounded-full" />
        </div>
        <div className="h-10 w-full sm:w-96 bg-slate-200 rounded-lg" />
      </div>

      {/* Judul section */}
      <div className="h-5 w-32 bg-slate-200 rounded mb-4" />

      {/* Grid paket */}
      <div className="flex flex-wrap gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-4 w-full sm:w-72 shrink-0"
          >
            <div className="h-32 w-full bg-slate-200 rounded-lg mb-4" />
            <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
            <div className="h-4 w-1/2 bg-slate-200 rounded mb-4" />
            <div className="h-3 w-full bg-slate-200 rounded mb-1.5" />
            <div className="h-3 w-2/3 bg-slate-200 rounded mb-4" />
            <div className="h-9 w-full bg-slate-200 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Packages() {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [ownedPackageIds, setOwnedPackageIds] = useState(new Set());
  const [loadingOwned, setLoadingOwned] = useState(true);
  const [promos, setPromos] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(true);
  const [focusPackages, setFocusPackages] = useState([]);
  const [loadingFocusPackages, setLoadingFocusPackages] = useState(true);
  const [selectedFocusCategoryId, setSelectedFocusCategoryId] = useState(null);
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setPreferredProgramId(Number(stored));
  }, []);

  useEffect(() => {
    packageService.getPrograms().then(setPrograms).finally(() => setLoadingPrograms(false));
  }, []);

  // Kalau kategori tersimpan di localStorage ternyata sudah tidak ada
  // lagi di daftar program (dihapus admin, data testing berubah, dll),
  // reset otomatis ke "tampilkan semua" daripada diam-diam menyaring
  // semua paket jadi kosong tanpa penjelasan.
  useEffect(() => {
    if (loadingPrograms || preferredProgramId === null) return;
    const stillExists = programs.some((p) => p.id === preferredProgramId);
    if (!stillExists) {
      localStorage.removeItem('preferred_program_id');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreferredProgramId(null);
    }
  }, [loadingPrograms, programs, preferredProgramId]);

  // Reset filter topik fokus tiap kali kategori Program diganti -- chip
  // yang dipilih (mis. "TWK") mungkin tidak relevan lagi di Program baru.
  useEffect(() => {
    setSelectedFocusCategoryId(null);
  }, [preferredProgramId]);

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
      .catch(() => setPromos([])) // banner fallback statis kalau gagal/kosong
      .finally(() => setLoadingPromos(false));

    // Paket "Fokus 1 Topik" (mis. cuma TWK) -- ditampilkan sebagai section
    // terpisah di atas daftar utama, bukan digabung ke tab latihan_soal
    // biasa, supaya siswa yang tahu kelemahannya bisa langsung 1 tap.
    packageService
      .getFocusTopicPackages()
      .then((data) => setFocusPackages(Array.isArray(data) ? data : []))
      .catch(() => setFocusPackages([]))
      .finally(() => setLoadingFocusPackages(false));

    // Paket yang sudah dimiliki (transaksi sukses) disembunyikan dari
    // katalog "Mulai Belajar" — siswa akses paket itu lewat "Paket Saya".
    packageService
      .listMyPackages()
      .then((owned) => setOwnedPackageIds(new Set(owned.map((o) => o.package.id))))
      .catch(() => setOwnedPackageIds(new Set())) // gagal diam-diam, jangan blokir katalog
      .finally(() => setLoadingOwned(false));
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

  const availablePackages = useMemo(
    () => packages.filter((pkg) => !ownedPackageIds.has(pkg.id)),
    [packages, ownedPackageIds]
  );

  const packagesInCategory = useMemo(() => {
    if (preferredProgramId === null) return availablePackages;
    return availablePackages.filter((pkg) => pkg.program_id === preferredProgramId);
  }, [availablePackages, preferredProgramId]);

  const availableFocusPackages = useMemo(
    () => focusPackages.filter((pkg) => !ownedPackageIds.has(pkg.id)),
    [focusPackages, ownedPackageIds]
  );

  const focusPackagesInCategory = useMemo(() => {
    if (preferredProgramId === null) return availableFocusPackages;
    return availableFocusPackages.filter((pkg) => pkg.program_id === preferredProgramId);
  }, [availableFocusPackages, preferredProgramId]);

  // Kategori unik dari paket fokus yang sedang tampil -- dipakai buat
  // render chip filter. Kalau cuma ada 1 topik, chip-nya tidak perlu
  // ditampilkan (lihat kondisi focusCategories.length > 1 di JSX).
  const focusCategories = useMemo(() => {
    const map = new Map();
    focusPackagesInCategory.forEach((pkg) => {
      if (pkg.category) map.set(pkg.category.id, pkg.category);
    });
    return Array.from(map.values());
  }, [focusPackagesInCategory]);

  const visibleFocusPackages = useMemo(() => {
    if (selectedFocusCategoryId === null) return focusPackagesInCategory;
    return focusPackagesInCategory.filter((pkg) => pkg.category?.id === selectedFocusCategoryId);
  }, [focusPackagesInCategory, selectedFocusCategoryId]);

  const filtered = useMemo(() => {
    let result = packagesInCategory.filter((pkg) => matchesTab(pkg, activeTab));

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
  }, [packagesInCategory, debouncedQuery, activeTab]);

  const isSearching = query !== debouncedQuery;

  // Full-page skeleton: tunggu SEMUA data utama halaman ini siap
  // (paket, kepemilikan paket, promo, dan daftar kategori/program)
  // sebelum merender apa pun -- konsisten dengan pola yang sama di
  // Beranda, supaya loading terasa sebagai satu proses yang mulus,
  // bukan section-section yang muncul gantian tidak sinkron. Tidak ada
  // komponen anak di halaman ini yang fetch datanya sendiri (semua
  // fetch ada langsung di useEffect komponen ini), jadi early return
  // biasa aman dipakai -- tidak ada risiko deadlock seperti pada
  // WeeklyLeaderboardHero di Beranda.
  const pageLoading = loading || loadingOwned || loadingPromos || loadingFocusPackages || loadingPrograms;

  if (pageLoading) {
    return <PackagesSkeleton />;
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

      {/* Latihan Fokus -- paket yang jual 1 topik spesifik (mis. cuma
          TWK/TIU/TKP), ditaruh sebagai jalan pintas di atas katalog utama.
          Disembunyikan total kalau tidak ada paket fokus untuk kategori
          yang sedang dipilih -- bukan nampilin section kosong. */}
      {/* Tab filter + search — digabung 1 baris supaya user tidak perlu
          "lompat" secara vertikal sebelum sampai ke daftar paket. */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const count = packagesInCategory.filter((pkg) => matchesTab(pkg, tab.key)).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition ${activeTab === tab.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300'
                  }`}
              >
                {tab.label}
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key
                    ? 'bg-white/25 text-white'
                    : 'bg-slate-100 text-slate-500'
                    }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative sm:w-96 shrink-0">
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
          <p className="text-slate-500 mb-3">
            {debouncedQuery.trim()
              ? 'Tidak ada paket yang cocok dengan pencarian.'
              : preferredProgramId !== null
                ? `Belum ada paket ${activeTabLabel.toLowerCase()} untuk kategori "${activeProgramName}".`
                : `Belum ada paket ${activeTabLabel.toLowerCase()} tersedia saat ini.`}
          </p>
          {!debouncedQuery.trim() && preferredProgramId !== null && (
            <button
              onClick={handleShowAllCategories}
              className="text-sm font-semibold text-brand-600 hover:underline"
            >
              Tampilkan Semua Kategori →
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap gap-5">
          {filtered.map((pkg) => {
            const promoForPkg = promos.find((p) => p.applicable_package_id === pkg.id);
            return (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                onOpen={() => navigate(`/app/packages/${pkg.id}`)}
                ctaLabel="Lihat Detail"
                typeBadgeLabel={!matchesTab(pkg, activeTab) ? (TYPE_LABEL[pkg.type] || pkg.type) : null}
                cornerBadge={
                  promoForPkg
                    ? { label: `Promo ${promoForPkg.code}`, icon: Gift, className: 'bg-orange-500 text-white' }
                    : null
                }
              />
            );
          })}
        </div>
      )}

      {focusPackagesInCategory.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Fokus Satu Topik</h2>
          {focusCategories.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setSelectedFocusCategoryId(null)}
                className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold transition ${selectedFocusCategoryId === null
                  ? 'bg-brand-600 border-brand-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                  }`}
              >
                Semua
              </button>
              {focusCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedFocusCategoryId(category.id)}
                  className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold transition ${selectedFocusCategoryId === category.id
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                    }`}
                >
                  {category.code || category.name}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
            {visibleFocusPackages.map((pkg) => (
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