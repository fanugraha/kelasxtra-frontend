import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Ticket,
  Wallet,
  ChevronRight,
  Copy,
  Check,
  Clock,
  RefreshCw,
  ChevronLeft,
} from 'lucide-react';
import { packageService } from '../../services/packageService';

const statusLabel = {
  pending: 'Menunggu Pembayaran',
  success: 'Pembayaran Berhasil',
  failed: 'Pembayaran Gagal',
  expired: 'Pembayaran Kedaluwarsa',
};

const statusVisual = {
  pending: {
    icon: 'bg-warning-100 text-warning-600',
    badge: 'bg-warning-50 text-warning-700 border-warning-200',
    accent: 'bg-warning-600 hover:bg-warning-700',
    dot: 'bg-warning-600',
  },
  success: {
    icon: 'bg-success-100 text-success-600',
    badge: 'bg-success-50 text-success-700 border-success-200',
    accent: 'bg-brand-600 hover:bg-brand-700',
    dot: 'bg-success-500',
  },
  failed: {
    icon: 'bg-danger-100 text-danger-600',
    badge: 'bg-danger-50 text-danger-700 border-danger-200',
    accent: 'bg-brand-600 hover:bg-brand-700',
    dot: 'bg-danger-600',
  },
  expired: {
    icon: 'bg-slate-200 text-slate-500',
    badge: 'bg-slate-100 text-slate-600 border-slate-300',
    accent: 'bg-brand-600 hover:bg-brand-700',
    dot: 'bg-slate-400',
  },
};

// Batas polling otomatis — kalau user meninggalkan tab terbuka lama tanpa
// membayar, kita berhenti nge-poll server dan biarkan user refresh manual.
const MAX_POLL_DURATION_MS = 10 * 60 * 1000; // 10 menit
const POLL_INTERVAL_MS = 3000;

const BARCODE_PATTERN = [3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 3, 2];

function Barcode({ className = '' }) {
  return (
    <div className={`flex items-end gap-[2px] h-6 ${className}`} aria-hidden="true">
      {BARCODE_PATTERN.map((w, i) => (
        <span
          key={i}
          className="bg-current opacity-25"
          style={{ width: w, height: i % 3 === 0 ? '100%' : '60%' }}
        />
      ))}
    </div>
  );
}

function formatCountdown(ms) {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// Stepper 3 langkah. Untuk failed/expired, langkah terakhir ditandai merah/abu
// alih-alih dianggap "belum sampai".
function StatusStepper({ status }) {
  const isPending = status === 'pending';
  const isDone = status === 'success';
  const isBad = status === 'failed' || status === 'expired';

  const steps = [
    { label: 'Pesanan Dibuat', state: 'done' },
    {
      label: 'Menunggu Pembayaran',
      state: isPending ? 'current' : 'done',
    },
    {
      label: isBad ? statusLabel[status] : 'Selesai',
      state: isDone ? 'done' : isBad ? 'bad' : 'upcoming',
    },
  ];

  return (
    <ol className="flex items-start gap-2 sm:gap-4">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <li key={step.label} className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-2 text-center min-w-[72px]">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shrink-0 ${
                  step.state === 'done'
                    ? 'bg-brand-600 text-white'
                    : step.state === 'current'
                    ? 'bg-warning-600 text-white'
                    : step.state === 'bad'
                    ? 'bg-danger-600 text-white'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {step.state === 'done' ? (
                  <Check size={14} />
                ) : step.state === 'bad' ? (
                  <XCircle size={14} />
                ) : (
                  i + 1
                )}
              </span>
              <span
                className={`text-[11px] sm:text-xs leading-tight ${
                  step.state === 'upcoming' ? 'text-slate-400' : 'text-slate-600 font-medium'
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <span
                className={`h-[2px] flex-1 mx-1 sm:mx-2 rounded-full ${
                  step.state === 'done' ? 'bg-brand-600' : 'bg-slate-200'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function TransactionStatus() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resuming, setResuming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pollStopped, setPollStopped] = useState(false);
  const [now, setNow] = useState(Date.now());

  const pollRef = useRef(null);
  const pollStartRef = useRef(null);
  const snapTimeoutRef = useRef(null);
  const copyTimeoutRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    loadTransaction();
    startPolling();

    tickRef.current = setInterval(() => setNow(Date.now()), 1000);

    return () => {
      clearInterval(pollRef.current);
      clearInterval(tickRef.current);
      if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, [transactionId]);

  function startPolling() {
    pollStartRef.current = Date.now();
    setPollStopped(false);
    pollRef.current = setInterval(() => {
      if (Date.now() - pollStartRef.current > MAX_POLL_DURATION_MS) {
        clearInterval(pollRef.current);
        setPollStopped(true);
        return;
      }
      loadTransaction(true);
    }, POLL_INTERVAL_MS);
  }

  async function loadTransaction(isPoll = false) {
    try {
      const data = await packageService.getTransaction(transactionId);
      setTransaction(data);

      if (data.status !== 'pending' && pollRef.current) {
        clearInterval(pollRef.current);
      }
    } catch (err) {
      if (!isPoll) setError('Gagal memuat status transaksi.');
    } finally {
      if (!isPoll) setLoading(false);
    }
  }

  function handleManualRefresh() {
    setLoading(true);
    loadTransaction().finally(() => setLoading(false));
    if (transaction?.status === 'pending') startPolling();
  }

  function clearSnapTimeout() {
    if (snapTimeoutRef.current) {
      clearTimeout(snapTimeoutRef.current);
      snapTimeoutRef.current = null;
    }
  }

  async function handleCopyId() {
    const value = transaction?.invoice_number || transaction?.midtrans_order_id || transaction?.id;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API bisa gagal di browser lama / non-HTTPS — abaikan diam-diam,
      // ID tetap terlihat sebagai teks jadi user masih bisa select-copy manual.
    }
  }

  async function handleResumePayment() {
    setResuming(true);
    setError('');
    try {
      const { snap_token } = await packageService.resumeTransaction(transactionId);

      if (!window.snap) {
        setError('Payment gateway belum siap dimuat, coba refresh halaman.');
        setResuming(false);
        return;
      }

      clearSnapTimeout();
      snapTimeoutRef.current = setTimeout(() => {
        setResuming(false);
        setError('Popup pembayaran gagal dimuat. Periksa koneksi internet Anda dan coba lagi.');
      }, 15000);

      window.snap.pay(snap_token, {
        onSuccess: () => {
          clearSnapTimeout();
          loadTransaction();
        },
        onPending: () => {
          clearSnapTimeout();
          loadTransaction();
        },
        onError: () => {
          clearSnapTimeout();
          setError('Pembayaran gagal. Silakan coba lagi.');
          setResuming(false);
        },
        onClose: () => {
          clearSnapTimeout();
          setResuming(false);
        },
      });
    } catch (err) {
      clearSnapTimeout();
      setError(err.response?.data?.message || 'Gagal melanjutkan pembayaran.');
      setResuming(false);
    }
  }

  const countdownMs = useMemo(() => {
    if (!transaction?.expires_at) return null;
    return new Date(transaction.expires_at).getTime() - now;
  }, [transaction?.expires_at, now]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 size={28} className="text-brand-500 animate-spin motion-reduce:animate-none" />
        <p className="text-slate-500 text-sm">Memuat status transaksi...</p>
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle size={32} className="text-danger-600" />
        <p className="text-danger-600">{error}</p>
        <button
          onClick={handleManualRefresh}
          className="mt-2 flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <RefreshCw size={14} /> Coba lagi
        </button>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 px-6 text-center">
        <AlertCircle size={32} className="text-danger-600" />
        <p className="text-danger-600">Transaksi tidak ditemukan.</p>
      </div>
    );
  }

  const isPending = transaction.status === 'pending';
  const isSuccess = transaction.status === 'success';
  const isBad = transaction.status === 'failed' || transaction.status === 'expired';
  const visual = statusVisual[transaction.status] || statusVisual.expired;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500 mb-6">
        <Link to="/app/transactions" className="flex items-center gap-1 hover:text-brand-600 transition">
          <ChevronLeft size={15} />
          Riwayat Transaksi
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-medium">Tiket #{transaction.invoice_number || transaction.id}</span>
      </nav>

      {/* Hero status */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-7">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${visual.icon}`}>
            {isPending && <Loader2 size={24} className="animate-spin motion-reduce:animate-none" />}
            {isSuccess && <CheckCircle2 size={24} strokeWidth={2} />}
            {transaction.status === 'failed' && <XCircle size={24} strokeWidth={2} />}
            {transaction.status === 'expired' && <AlertCircle size={24} strokeWidth={2} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-500">{transaction.package?.name}</p>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5">
              {statusLabel[transaction.status]}
            </h1>
          </div>
          {isPending && countdownMs !== null && countdownMs > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-warning-50 border border-warning-200 px-4 py-2.5 self-start sm:self-center">
              <Clock size={16} className="text-warning-600 shrink-0" />
              <div>
                <p className="text-[11px] text-warning-700 leading-none mb-1">Bayar sebelum</p>
                <p className="text-sm font-semibold text-warning-800 tabular-nums leading-none">
                  {formatCountdown(countdownMs)}
                </p>
              </div>
            </div>
          )}
        </div>

        <StatusStepper status={transaction.status} />
      </div>

      {/* Konten 2 kolom */}
      <div className="grid md:grid-cols-5 gap-6">
        {/* Kolom kiri — aksi */}
        <div className="md:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          {isPending && (
            <>
              <h2 className="font-semibold text-slate-800 mb-1">Selesaikan pembayaran</h2>
              <p className="text-sm text-slate-500 mb-6">
                Halaman ini otomatis memperbarui begitu pembayaran Anda berhasil diverifikasi.
              </p>

              {transaction.payment_method && (
                <div className="flex justify-between items-center py-3 border-b border-slate-100 text-sm">
                  <span className="text-slate-500">Metode Pembayaran</span>
                  <span className="font-medium text-slate-800">{transaction.payment_method}</span>
                </div>
              )}

              <button
                onClick={handleResumePayment}
                disabled={resuming}
                className={`w-full flex items-center justify-center gap-2 transition text-white font-semibold py-3 rounded-xl disabled:opacity-60 mt-6 ${visual.accent}`}
              >
                {resuming ? (
                  <>
                    <Loader2 size={18} className="animate-spin motion-reduce:animate-none" />
                    Memuat...
                  </>
                ) : (
                  <>
                    <Wallet size={18} />
                    Lanjutkan Pembayaran
                  </>
                )}
              </button>

              {pollStopped && (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm">
                  <span className="text-slate-500">Pembaruan otomatis dihentikan.</span>
                  <button
                    onClick={handleManualRefresh}
                    className="flex items-center gap-1.5 font-medium text-brand-600 hover:text-brand-700 shrink-0"
                  >
                    <RefreshCw size={14} /> Cek status
                  </button>
                </div>
              )}
            </>
          )}

          {isSuccess && (
            <>
              <h2 className="font-semibold text-slate-800 mb-1">Paket sudah aktif</h2>
              <p className="text-sm text-slate-500 mb-6">
                Terima kasih, pembayaran Anda telah diverifikasi. Paket belajar sudah bisa diakses.
              </p>
              <button
                onClick={() => navigate('/app/my-packages')}
                className={`w-full flex items-center justify-center gap-2 transition text-white font-semibold py-3 rounded-xl ${visual.accent}`}
              >
                Lihat Paket Belajar Saya
                <ChevronRight size={17} />
              </button>
            </>
          )}

          {isBad && (
            <>
              <h2 className="font-semibold text-slate-800 mb-1">
                {transaction.status === 'failed' ? 'Pembayaran tidak berhasil' : 'Waktu pembayaran habis'}
              </h2>
              <p className="text-sm text-slate-500 mb-6">
                {transaction.failure_reason
                  ? transaction.failure_reason
                  : transaction.status === 'failed'
                  ? 'Transaksi ditolak oleh penyedia pembayaran. Anda bisa membuat pesanan baru untuk paket ini.'
                  : 'Pesanan ini kedaluwarsa karena tidak dibayar tepat waktu. Anda bisa membuat pesanan baru untuk paket ini.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/app/mulai-belajar"
                  className={`flex-1 flex items-center justify-center gap-2 transition text-white font-semibold py-3 rounded-xl ${visual.accent}`}
                >
                  Buat Pesanan Baru
                </Link>
                <Link
                  to="/app/transactions"
                  className="flex-1 flex items-center justify-center text-center border border-slate-300 py-3 rounded-xl hover:bg-slate-50 transition font-medium text-slate-600"
                >
                  Riwayat Transaksi
                </Link>
              </div>
            </>
          )}

          {error && (
            <div className="mt-5 rounded-xl bg-danger-50 border border-danger-100 p-3 text-danger-700 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* Kolom kanan — ringkasan tiket */}
        <div className="md:col-span-2">
          <div className={`rounded-2xl border px-6 py-6 ${visual.badge} border-b-0 rounded-b-none`}>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
              <Ticket size={13} />
              Ringkasan Pesanan
            </div>
          </div>
          <div className="relative bg-white border-x border-slate-200">
            <div className="absolute left-0 top-0 -translate-x-1/2 w-5 h-5 rounded-full bg-slate-50" />
            <div className="absolute right-0 top-0 translate-x-1/2 w-5 h-5 rounded-full bg-slate-50" />
            <div className="border-t border-dashed border-slate-200" />
          </div>
          <div className="rounded-2xl rounded-t-none border border-t-0 border-slate-200 bg-white p-6">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Total</span>
              <span className="font-bold text-brand-600 text-lg">
                Rp{Number(transaction.amount).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Paket</span>
              <span className="font-medium text-slate-800 text-right text-sm">
                {transaction.package?.name}
              </span>
            </div>
            {transaction.created_at && (
              <div className="flex justify-between items-center py-3 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Tanggal</span>
                <span className="font-medium text-slate-800 text-sm">
                  {new Date(transaction.created_at).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            )}
            <div className="py-3">
              <span className="text-slate-500 text-sm flex items-center gap-1.5 mb-2">
                <Ticket size={14} />
                ID Transaksi
              </span>
              <button
                onClick={handleCopyId}
                className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:bg-slate-100 transition group"
              >
                <span className="font-mono text-sm text-slate-700 truncate">
                  {transaction.invoice_number || transaction.midtrans_order_id || transaction.id}
                </span>
                {copied ? (
                  <Check size={15} className="text-success-600 shrink-0" />
                ) : (
                  <Copy size={15} className="text-slate-400 group-hover:text-slate-600 shrink-0" />
                )}
              </button>
            </div>
            <Barcode className="text-slate-300 mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}