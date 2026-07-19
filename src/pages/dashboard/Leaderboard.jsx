import { useState, useEffect, useRef } from 'react';
import { Trophy, Medal, Sparkles, Target, Flame, Search, ChevronDown, Users, X } from 'lucide-react';
import { examBatchService } from '../../services/examBatchService';
import { weeklyLeaderboardService } from '../../services/weeklyLeaderboardService';

const rankStyle = {
  1: 'bg-yellow-100 text-yellow-700',
  2: 'bg-slate-200 text-slate-700',
  3: 'bg-orange-100 text-orange-700',
};

export default function Leaderboard() {
  const [tab, setTab] = useState('tryout'); // 'tryout' | 'practice'
  // Menggerbang bagian hardcode (judul + tombol tab) juga -- bukan cuma
  // panel -- supaya semuanya tampil BARENG begitu data list tab aktif
  // pertama kali siap, bukan duluan. Panel tetap selalu di-mount (supaya
  // fetch-nya tetap jalan di background) -- yang berubah cuma tampilan header
  // di atasnya, dari placeholder ke versi asli+interaktif. Setelah initial
  // load selesai, pindah tab tidak mengembalikan header ke placeholder
  // lagi -- tab memang harus tetap bisa diklik saat panel gantinya sendiri
  // yang menampilkan skeleton (lihat listLoading di LeaderboardPanel).
  const [initialLoading, setInitialLoading] = useState(true);

  return (
    <div>
      {initialLoading ? (
        <div className="animate-pulse">
          <div className="h-7 w-40 bg-slate-100 rounded mb-4" />
          <div className="inline-flex items-center gap-1 bg-slate-100 rounded-lg p-1 mb-6">
            <div className="h-8 w-24 bg-slate-200 rounded-md" />
            <div className="h-8 w-44 bg-slate-100 rounded-md ml-1" />
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Leaderboard</h1>

          <div className="inline-flex items-center gap-1 bg-slate-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setTab('tryout')}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-md transition ${
                tab === 'tryout' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Trophy size={14} />
              Try Out
            </button>
            <button
              onClick={() => setTab('practice')}
              className={`flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-md transition ${
                tab === 'practice' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Flame size={14} />
              Latihan Soal Mingguan
            </button>
          </div>
        </>
      )}

      {tab === 'tryout' ? (
        <LeaderboardPanel
          key="tryout"
          emptyListLabel="Belum ada try out yang sudah selesai dinilai."
          searchPlaceholder="Cari try out..."
          fetchList={() => examBatchService.listRanked()}
          getOptionLabel={(b) => (b.exam?.title ? `${b.exam.title} — ${b.name}` : b.name)}
          getOptionMeta={() => null}
          fetchLeaderboard={(id) => examBatchService.getLeaderboard(id)}
          fetchMyPosition={(id) => examBatchService.getMyPosition(id)}
          titleLabel="Ranking Nasional (Top 50)"
          onFirstLoad={() => setInitialLoading(false)}
        />
      ) : (
        <LeaderboardPanel
          key="practice"
          emptyListLabel="Belum ada exam dengan leaderboard mingguan aktif."
          searchPlaceholder="Cari latihan soal..."
          fetchList={() => weeklyLeaderboardService.listRanked().then((res) => res.data)}
          getOptionLabel={(e) => e.title}
          getOptionMeta={(e) => e.participants_count}
          fetchLeaderboard={(id) => weeklyLeaderboardService.getLeaderboard(id).then((res) => res.data)}
          fetchMyPosition={(id) => weeklyLeaderboardService.getMyPosition(id)}
          titleLabel="Ranking Mingguan (Top 50)"
          onFirstLoad={() => setInitialLoading(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Combobox dengan search box — dipakai sebagai pengganti <select> polos.
// Ketika jumlah exam bisa puluhan/ratusan, native <select> susah dicari
// (harus scroll manual). Combobox ini menampilkan search input di atas
// list, jadi siswa tinggal ketik sebagian judul untuk filter instan.
// Klik di luar dropdown otomatis menutup (via listener 'mousedown' pada
// document, dibersihkan saat unmount).
// ─────────────────────────────────────────────────────────────────────────
function SearchableSelect({ items, selectedId, onChange, getOptionLabel, getOptionMeta, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      // Delay singkat supaya elemen sudah ter-render sebelum di-focus.
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  const selectedItem = items.find((item) => String(item.id) === String(selectedId));
  const filteredItems = query.trim()
    ? items.filter((item) => getOptionLabel(item).toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  function handleSelect(item) {
    onChange(item.id);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={containerRef} className="relative w-full sm:w-96">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-200 transition"
      >
        <span className="truncate text-left">
          {selectedItem ? getOptionLabel(selectedItem) : placeholder}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-100">
            <Search size={15} className="text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="flex-1 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-slate-300 hover:text-slate-500 shrink-0">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {filteredItems.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Tidak ditemukan.</p>
            ) : (
              filteredItems.map((item) => {
                const meta = getOptionMeta(item);
                const isSelected = String(item.id) === String(selectedId);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition ${
                      isSelected ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{getOptionLabel(item)}</span>
                    {meta != null && (
                      <span className="shrink-0 flex items-center gap-1 text-[11px] text-slate-400">
                        <Users size={11} />
                        {meta}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function LeaderboardPanelSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-10 w-full sm:w-96 bg-slate-100 rounded-lg" />
        <div className="h-3.5 w-24 bg-slate-100 rounded" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="h-4 w-48 bg-slate-100 rounded" />
        </div>
        <div className="p-4 space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function LeaderboardPanel({
  emptyListLabel,
  searchPlaceholder,
  fetchList,
  getOptionLabel,
  getOptionMeta,
  fetchLeaderboard,
  fetchMyPosition,
  titleLabel,
  onFirstLoad,
}) {
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [entries, setEntries] = useState([]);
  const [myPosition, setMyPosition] = useState(null);
  // listLoading menggerbang fetch tahap 1 (daftar exam/batch) -- ini yang
  // menentukan apakah kita tampilkan skeleton penuh vs empty-state vs
  // konten. loading (di bawah) khusus untuk fetch tahap 2 (leaderboard per
  // item terpilih), supaya ganti pilihan tidak perlu skeleton sebesar itu.
  const [listLoading, setListLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setListLoading(true);
    fetchList()
      .then((data) => {
        setItems(data);
        if (data.length > 0) setSelectedId(data[0].id);
        else setLoading(false);
      })
      .catch(() => {
        setError('Gagal memuat daftar.');
        setLoading(false);
      })
      .finally(() => {
        setListLoading(false);
        onFirstLoad?.();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');
    setMyPosition(null);

    Promise.all([
      fetchLeaderboard(selectedId),
      fetchMyPosition(selectedId).catch(() => null),
    ])
      .then(([leaderboardData, myPositionData]) => {
        setEntries(leaderboardData);
        setMyPosition(myPositionData && (myPositionData.ranking || myPositionData.rank) ? myPositionData : null);
      })
      .catch(() => setError('Leaderboard belum tersedia.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  if (listLoading) {
    return <LeaderboardPanelSkeleton />;
  }

  return (
    <>
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Trophy className="mx-auto mb-3 text-slate-300" size={40} strokeWidth={1.5} />
          <p className="text-slate-500">{emptyListLabel}</p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex items-center gap-3 flex-wrap">
            <SearchableSelect
              items={items}
              selectedId={selectedId}
              onChange={setSelectedId}
              getOptionLabel={getOptionLabel}
              getOptionMeta={getOptionMeta}
              placeholder={searchPlaceholder}
            />
            {items.length > 0 && (
              <span className="text-xs text-slate-400">{items.length} pilihan tersedia</span>
            )}
          </div>

          {myPosition && (
            <div className="bg-gradient-to-r from-orange-500 to-brand-600 rounded-xl p-6 mb-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Target size={20} />
                <h2 className="font-bold">Posisi Kamu</h2>
              </div>
              <p className="text-white/90 text-sm mb-4">{myPosition.summary_text}</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-white/70 text-xs">Skor</p>
                  <p className="text-xl font-bold">{myPosition.score ?? myPosition.skor_terbaik}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">Benar</p>
                  <p className="text-xl font-bold">{myPosition.correct_count ?? '-'}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">Ranking</p>
                  <p className="text-xl font-bold">#{myPosition.rank ?? myPosition.ranking}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">{titleLabel}</h2>
            </div>

            <div className="p-4">
              {error ? (
                <p className="text-slate-500 text-center py-6">{error}</p>
              ) : loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <p className="text-slate-500 text-center py-6">Belum ada peserta.</p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => {
                    const rank = entry.ranking ?? entry.rank;
                    const score = entry.score ?? entry.skor_terbaik;
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between px-4 py-3.5 rounded-lg transition ${
                          rank === 1
                            ? 'bg-yellow-50/60 border border-yellow-200'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              rankStyle[rank] || 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {rank <= 3 ? <Medal size={15} /> : rank}
                          </span>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{entry.user?.name}</p>
                            <p className="text-xs text-slate-400">
                              {entry.correct_count != null ? `${entry.correct_count} soal benar` : ''}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={13} className="text-brand-500" />
                          <span className="font-bold text-slate-800">{score}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}