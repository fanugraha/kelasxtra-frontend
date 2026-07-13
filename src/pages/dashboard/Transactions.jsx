import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ChevronRight,
  Ticket,
  Wallet,
  TrendingUp,
  ArrowUpDown,
  PartyPopper,
} from 'lucide-react';
import { packageService } from '../../services/packageService';

const statusConfig = {
  pending: {
    label: 'Menunggu Pembayaran',
    badge: 'bg-warning-100 text-warning-700',
    bar: 'bg-warning-500',
    icon: Clock,
  },
  success: {
    label: 'Berhasil',
    badge: 'bg-success-100 text-success-700',
    bar: 'bg-success-500',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Gagal',
    badge: 'bg-danger-100 text-danger-700',
    bar: 'bg-danger-500',
    icon: XCircle,
  },
  expired: {
    label: 'Kedaluwarsa',
    badge: 'bg-slate-100 text-slate-500',
    bar: 'bg-slate-300',
    icon: AlertCircle,
  },
};

const tabs = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu Pembayaran' },
  { key: 'success', label: 'Berhasil' },
  { key: 'expired', label: 'Kedaluwarsa' },
];

// Pesan empty state dibedakan per tab — tab "pending" kosong itu kabar baik,
// bukan hal netral seperti tab lain.
const emptyStateConfig = {
  all: {
    title: 'Belum ada transaksi',
    desc: 'Yuk mulai belajar dengan paket try out atau kelas online pilihanmu.',
    icon: Ticket,
    showCta: true,
  },
  pending: {
    title: 'Tidak ada tagihan menunggu',
    desc: 'Semua transaksimu sudah lunas.',
    icon: PartyPopper,
    showCta: false,
  },
  success: {
    title: 'Belum ada transaksi berhasil',
    desc: 'Transaksi yang sudah lunas akan muncul di sini.',
    icon: CheckCircle2,
    showCta: true,
  },
  expired: {
    title: 'Tidak ada transaksi kedaluwarsa',
    desc: 'Tidak ada pembayaran yang terlewat.',
    icon: AlertCircle,
    showCta: false,
  },
};

// Pola batang dekoratif ala kode batang tiket — murni visual, lebar acak tapi tetap (bukan random tiap render).
const BARCODE_PATTERN = [3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 3, 1, 2, 2, 1, 3, 1];

function Barcode({ className = '' }) {
  return (
    <div className={`flex items-end gap-[2px] h-6 ${className}`} aria-hidden="true">
      {BARCODE_PATTERN.map((w, i) => (
        <span
          key={i}
          className="bg-current opacity-25"
          style={{ width: w, height: i % 3 === 0 ? '100%' : '65%' }}
        />
      ))}
    </div>
  );
}

// Notch perforasi di kedua ujung garis putus-putus penanda "sobekan tiket".
// Warna notch harus sama dengan warna latar di belakang kartu (bukan warna kartu itu sendiri)
// supaya efek "lubang" terlihat menyatu — sesuaikan bg-slate-50 di bawah jika latar
// DashboardLayout kamu bukan slate-50.
function TicketNotches({ stubWidthClass }) {
  return (
    <>
      <span
        className={`hidden sm:block absolute top-0 ${stubWidthClass} w-4 h-4 -translate-y-1/2 translate-x-1/2 rounded-full bg-slate-50`}
      />
      <span
        className={`hidden sm:block absolute bottom-0 ${stubWidthClass} w-4 h-4 translate-y-1/2 translate-x-1/2 rounded-full bg-slate-50`}
      />
      <span className="sm:hidden absolute left-0 top-0 w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-50" />
      <span className="sm:hidden absolute right-0 top-0 w-4 h-4 translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-50" />
    </>
  );
}

export default function Transactions() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

  useEffect(() => {
    packageService
      .listTransactions()
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const pendingCount = transactions.filter((tx) => tx.status === 'pending').length;
    const totalSpent = transactions
      .filter((tx) => tx.status === 'success')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
    return { total: transactions.length, pendingCount, totalSpent };
  }, [transactions]);

  const filtered = useMemo(() => {
    const base =
      activeTab === 'all'
        ? transactions
        : transactions.filter((tx) =>
          activeTab === 'expired'
            ? ['expired', 'failed'].includes(tx.status)
            : tx.status === activeTab
        );

    return [...base].sort((a, b) => {
      const diff = new Date(a.created_at) - new Date(b.created_at);
      return sortOrder === 'newest' ? -diff : diff;
    });
  }, [transactions, activeTab, sortOrder]);

  const emptyState = emptyStateConfig[activeTab] || emptyStateConfig.all;
  const EmptyIcon = emptyState.icon;

  if (loading) {
    return (
      <div>
        <div className="mb-8 h-32 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="mb-6 flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-28 rounded-full bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-40 rounded-2xl border border-slate-200 bg-white animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header: gradient identitas brand, menyatukan judul + ringkasan statistik */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-orange-600 px-5 sm:px-7 py-6 mb-8">
        <div className="pointer-events-none absolute -top-10 -right-8 w-48 h-48 rounded-full bg-white/10 blur-3xl" />

        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Riwayat Transaksi</h1>
          <p className="text-white/75 text-sm mt-1 mb-5">
            Pantau status pembayaran paket dan try out kamu.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 bg-white/12 rounded-xl px-4 py-2.5">
              <Ticket size={17} className="text-white/80" />
              <div>
                <p className="text-[11px] text-white/70 leading-none">Total Transaksi</p>
                <p className="text-white font-bold leading-tight mt-0.5">{stats.total}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition ${
                stats.pendingCount > 0
                  ? 'bg-white text-warning-700'
                  : 'bg-white/12 text-white'
              }`}
            >
              <span className="relative flex items-center justify-center">
                <Clock size={17} className={stats.pendingCount > 0 ? 'text-warning-600' : 'text-white/80'} />
                {stats.pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-warning-500 animate-pulse motion-reduce:animate-none" />
                )}
              </span>
              <div className="text-left">
                <p className={`text-[11px] leading-none ${stats.pendingCount > 0 ? 'text-warning-600' : 'text-white/70'}`}>
                  Menunggu
                </p>
                <p className={`font-bold leading-tight mt-0.5 ${stats.pendingCount > 0 ? 'text-warning-700' : 'text-white'}`}>
                  {stats.pendingCount}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2.5 bg-white/12 rounded-xl px-4 py-2.5">
              <TrendingUp size={17} className="text-white/80" />
              <div>
                <p className="text-[11px] text-white/70 leading-none">Total Dibelanjakan</p>
                <p className="text-white font-bold leading-tight mt-0.5">
                  Rp{stats.totalSpent.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + sort */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const count =
              tab.key === 'all'
                ? transactions.length
                : tab.key === 'expired'
                  ? transactions.filter((t) => ['expired', 'failed'].includes(t.status)).length
                  : transactions.filter((t) => t.status === tab.key).length;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setSortOrder((s) => (s === 'newest' ? 'oldest' : 'newest'))}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-brand-300 px-3.5 py-2 rounded-lg transition shrink-0"
        >
          <ArrowUpDown size={14} />
          {sortOrder === 'newest' ? 'Terbaru' : 'Terlama'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <EmptyIcon size={52} strokeWidth={1.5} className="mx-auto mb-5 text-slate-300" />
          <h3 className="text-xl font-bold text-slate-700">{emptyState.title}</h3>
          <p className="mt-2 text-slate-500">{emptyState.desc}</p>
          {emptyState.showCta && (
            <button
              onClick={() => navigate('/app/packages')}
              className="mt-6 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
            >
              Lihat Paket Belajar
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((tx) => {
            const config = statusConfig[tx.status] || {
              label: tx.status,
              badge: 'bg-slate-100 text-slate-600',
              bar: 'bg-slate-300',
              icon: Clock,
            };
            const StatusIcon = config.icon;
            const isPending = tx.status === 'pending';

            return (
              <div
                key={tx.id}
                className="relative rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <TicketNotches stubWidthClass="right-24 sm:right-32" />

                <div
                  onClick={() => navigate(`/app/transactions/${tx.id}`)}
                  className="flex flex-col sm:flex-row cursor-pointer"
                >
                  {/* Stub utama */}
                  <div className="relative flex-1 min-w-0 p-5">
                    <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${config.bar}`} />

                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                          Tiket #{tx.id}
                        </p>
                        <h2 className="text-base font-bold text-slate-800 mt-0.5 line-clamp-1">
                          {tx.package?.name}
                        </h2>
                      </div>
                      <span className={`shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}>
                        <StatusIcon size={12} />
                        {config.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mb-1">
                      {tx.package?.category?.name || tx.package?.program?.name || 'Paket Belajar'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  {/* Garis perforasi */}
                  <div className="border-t sm:border-t-0 sm:border-l border-dashed border-slate-200 mx-0 sm:mx-0" />

                  {/* Stub jumlah bayar (counterfoil) */}
                  <div className="w-full sm:w-24 md:w-32 shrink-0 p-4 flex sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-2 bg-slate-50/60 rounded-b-2xl sm:rounded-b-none sm:rounded-r-2xl">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide">Total</p>
                      <p className="text-base font-bold text-brand-700 leading-tight">
                        Rp{Number(tx.amount).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <Barcode className="hidden sm:flex text-slate-400 mt-1" />
                  </div>
                </div>

                <div className="border-t border-slate-100 px-5 py-3 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/app/transactions/${tx.id}`);
                    }}
                    className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold text-white transition ${
                      isPending ? 'bg-warning-500 hover:bg-warning-600' : 'bg-brand-600 hover:bg-brand-700'
                    }`}
                  >
                    {isPending ? (
                      <>
                        <Wallet size={13} />
                        Bayar Sekarang
                      </>
                    ) : (
                      <>
                        Lihat Detail
                        <ChevronRight size={13} />
                      </>
                    )}
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