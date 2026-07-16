import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PackageSearch, FileText, Video, Search } from 'lucide-react';
import { packageService } from '../../services/packageService';
import MyPackageCard from '../../components/packages/MyPackageCard';
import CrossSellCard from '../../components/packages/CrossSellCard';

// ✅ TERVERIFIKASI 16 Juli 2026 — dicek langsung dari migration backend:
// database/migrations/2025_01_01_000003_create_packages_table.php
//   $table->enum('type', ['privat', 'group', 'latihan_soal', 'reguler']);
// Kolom `type` di DB HANYA punya 4 value ini, persis dipakai semuanya di bawah — tidak ada
// value lain (termasuk 'video', yang sudah dihapus karena tidak ada di enum sama sekali).
const ONLINE_CLASS_TYPES = ['privat', 'group', 'reguler'];
const EXAM_TYPES = ['latihan_soal'];

const TABS = [
  { key: 'tryout', label: 'Tryout', types: EXAM_TYPES },
  { key: 'kelas_online', label: 'Kelas Online', types: ONLINE_CLASS_TYPES },
];

const KNOWN_TYPES = new Set(TABS.flatMap((tab) => tab.types));

export default function MyPackages() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [recommended, setRecommended] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);

  const [activeTab, setActiveTab] = useState(TABS[0].key);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    packageService.listMyPackages().then(setItems).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    packageService
      .getRecommendedPackages()
      .then((res) => setRecommended(res.packages || res || []))
      .catch(() => setRecommended([]))
      .finally(() => setLoadingRecommended(false));
  }, []);

  // 🔎 DEV HELPER — safety net. TABS di atas sudah dikunci persis sesuai enum kolom
  // `type` di migration backend (packages.type), jadi seharusnya tidak akan pernah
  // ada item yang tidak dikenali. Kalau warning ini tetap muncul, berarti enum di DB
  // sudah berubah (migration baru) dan TABS di file ini perlu diupdate mengikuti.
  useEffect(() => {
    if (!items.length) return;
    const unknown = items.filter((item) => item.package?.type && !KNOWN_TYPES.has(item.package.type));
    if (unknown.length > 0) {
      console.warn(
        '[MyPackages] Ditemukan package.type di luar enum yang diketahui (privat/group/latihan_soal/reguler). ' +
          'Kemungkinan enum di database berubah — cek migration terbaru & update TABS di MyPackages.jsx:',
        unknown.map((item) => ({
          my_package_id: item.id,
          package_id: item.package?.id,
          name: item.package?.name,
          type: item.package?.type,
        }))
      );
    }
  }, [items]);

  const ownedPackageIds = useMemo(
    () => new Set(items.map((item) => item.package?.id)),
    [items]
  );

  const crossSellPackages = useMemo(
    () => recommended.filter((pkg) => !ownedPackageIds.has(pkg.id)).slice(0, 3),
    [recommended, ownedPackageIds]
  );

  // Hitung jumlah item per tab, dipakai untuk badge angka di sebelah label tab
  const tabCounts = useMemo(() => {
    const counts = {};
    for (const tab of TABS) {
      counts[tab.key] = items.filter((item) => tab.types.includes(item.package?.type)).length;
    }
    return counts;
  }, [items]);

  function sortByRelevance(list) {
    return [...list].sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      const aEnd = a.end_date ? new Date(a.end_date).getTime() : Infinity;
      const bEnd = b.end_date ? new Date(b.end_date).getTime() : Infinity;
      return aEnd - bEnd;
    });
  }

  const activeTabConfig = TABS.find((tab) => tab.key === activeTab) ?? TABS[0];

  const filteredItems = useMemo(() => {
    const byTab = items.filter((item) => activeTabConfig.types.includes(item.package?.type));
    if (!search.trim()) return byTab;
    const q = search.trim().toLowerCase();
    return byTab.filter((item) => item.package?.name?.toLowerCase().includes(q));
  }, [items, activeTabConfig, search]);

  const sortedFilteredItems = sortByRelevance(filteredItems);

  function handleClick(item) {
    if (ONLINE_CLASS_TYPES.includes(item.package?.type)) {
      const classId = item.package?.classes?.[0]?.id;
      if (classId) navigate(`/app/classes/${classId}`);
      return;
    }
    navigate(`/app/packages/${item.package?.id}/exams`);
  }

  function handleBuyAgain(item) {
    navigate(`/app/packages/${item.package?.id}`);
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    setSearch(searchInput);
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Paket Belajar Saya</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Paket Belajar Saya</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <PackageSearch className="mx-auto mb-3 text-slate-300" size={40} strokeWidth={1.5} />
          <p className="text-slate-500 mb-1">Kamu belum memiliki paket belajar aktif.</p>
          <p className="text-sm text-slate-400 mb-5">
            Yuk mulai belajar dengan memilih paket yang sesuai kebutuhanmu.
          </p>
          <button
            onClick={() => navigate('/app/packages')}
            className="bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-700 transition"
          >
            Lihat Paket Belajar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Paket Belajar Saya</h1>

      {/* Tab filter + search */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-6 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative pb-3 -mb-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActive ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {tab.label}
                {tabCounts[tab.key] > 0 && (
                  <span className={`ml-1.5 ${isActive ? 'text-brand-500' : 'text-slate-300'}`}>
                    ({tabCounts[tab.key]})
                  </span>
                )}
                <span
                  className={`absolute left-0 -bottom-px h-0.5 w-full rounded-full transition-colors ${
                    isActive ? 'bg-brand-600' : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 lg:justify-end">
          <div className="relative flex-1 lg:max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Temukan ..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 bg-brand-600 text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-brand-700 transition"
          >
            Cari
          </button>
        </form>
      </div>

      {sortedFilteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center mb-10">
          <PackageSearch className="mx-auto mb-3 text-slate-300" size={36} strokeWidth={1.5} />
          <p className="text-slate-500">
            {search
              ? `Tidak ada paket "${activeTabConfig.label}" yang cocok dengan "${search}".`
              : `Belum ada paket di kategori ${activeTabConfig.label}.`}
          </p>
        </div>
      ) : (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            {activeTabConfig.key === 'kelas_online' ? (
              <Video size={18} className="text-brand-600" />
            ) : (
              <FileText size={18} className="text-brand-600" />
            )}
            <h2 className="text-lg font-bold text-slate-700">{activeTabConfig.label}</h2>
          </div>
          <div className="space-y-4">
            {sortedFilteredItems.map((item) => (
              <MyPackageCard
                key={item.id}
                item={item}
                onOpen={() => handleClick(item)}
                onBuyAgain={() => handleBuyAgain(item)}
              />
            ))}
          </div>
        </div>
      )}

      {!loadingRecommended && crossSellPackages.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-700 mb-4">Paket Lain yang Mungkin Kamu Suka</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {crossSellPackages.map((pkg) => (
              <CrossSellCard key={pkg.id} pkg={pkg} onSelect={() => navigate(`/app/packages/${pkg.id}`)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}