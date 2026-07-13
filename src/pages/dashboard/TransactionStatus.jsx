import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, AlertCircle, Loader2, Ticket, Wallet, ChevronRight } from 'lucide-react';
import { packageService } from '../../services/packageService';

const statusLabel = {
  pending: 'Menunggu Pembayaran',
  success: 'Pembayaran Berhasil',
  failed: 'Pembayaran Gagal',
  expired: 'Pembayaran Kedaluwarsa',
};

// Konfigurasi visual per status — dipakai untuk header, ikon, dan warna aksen.
// Skema warna sengaja sama dengan status badge di halaman Riwayat Transaksi
// supaya kedua halaman terasa satu sistem, bukan dua desain terpisah.
const statusVisual = {
  pending: {
    header: 'bg-warning-50',
    ring: 'bg-warning-100',
    text: 'text-warning-700',
    seam: 'border-warning-200',
  },
  success: {
    header: 'bg-success-50',
    ring: 'bg-success-100',
    text: 'text-success-700',
    seam: 'border-success-200',
  },
  failed: {
    header: 'bg-danger-50',
    ring: 'bg-danger-100',
    text: 'text-danger-700',
    seam: 'border-danger-200',
  },
  expired: {
    header: 'bg-slate-100',
    ring: 'bg-slate-200',
    text: 'text-slate-600',
    seam: 'border-slate-300',
  },
};

// Pola batang dekoratif ala kode batang tiket — sama seperti di halaman Riwayat
// Transaksi, dipertahankan konsisten supaya kedua halaman terasa satu sistem.
const BARCODE_PATTERN = [3, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 3, 1, 2, 2, 1, 3, 1, 2, 1, 3, 2];

function Barcode({ className = '' }) {
  return (
    <div className={`flex items-end gap-[2px] h-7 ${className}`} aria-hidden="true">
      {BARCODE_PATTERN.map((w, i) => (
        <span
          key={i}
          className="bg-current opacity-20"
          style={{ width: w, height: i % 3 === 0 ? '100%' : '60%' }}
        />
      ))}
    </div>
  );
}

// Notch perforasi kiri-kanan menandai "sobekan tiket" di antara zona status
// dan zona detail. Warna notch harus sama dengan latar di belakang card (bukan
// warna card) — sesuaikan bg-slate-50 di bawah jika latar DashboardLayout kamu
// bukan slate-50.
function TicketNotches() {
  return (
    <>
      <span className="absolute left-0 top-full -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50" />
      <span className="absolute right-0 top-full translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-50" />
    </>
  );
}

export default function TransactionStatus() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resuming, setResuming] = useState(false);
  const pollRef = useRef(null);
  const snapTimeoutRef = useRef(null);

  useEffect(() => {
    loadTransaction();

    pollRef.current = setInterval(() => {
      loadTransaction(true);
    }, 3000);

    return () => {
      clearInterval(pollRef.current);
      if (snapTimeoutRef.current) clearTimeout(snapTimeoutRef.current);
    };
  }, [transactionId]);

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

  function clearSnapTimeout() {
    if (snapTimeoutRef.current) {
      clearTimeout(snapTimeoutRef.current);
      snapTimeoutRef.current = null;
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

      // Pengaman: kalau popup Midtrans gagal dimuat secara internal (mis. gangguan
      // jaringan ke asset sandbox mereka), Snap.js kadang tidak memanggil onError
      // atau onClose sama sekali, sehingga tombol bisa macet selamanya di "Memuat...".
      // Timeout ini memastikan user tetap bisa retry setelah beberapa detik.
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

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-slate-50">
        <Loader2 size={28} className="text-brand-500 animate-spin motion-reduce:animate-none" />
        <p className="text-slate-500 text-sm">Memuat status transaksi...</p>
      </div>
    );
  }

  if (error && !transaction) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
        <AlertCircle size={32} className="text-danger-500" />
        <p className="text-danger-600">{error}</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 bg-slate-50 px-6 text-center">
        <AlertCircle size={32} className="text-danger-500" />
        <p className="text-danger-600">Transaksi tidak ditemukan.</p>
      </div>
    );
  }

  const isPending = transaction.status === 'pending';
  const isSuccess = transaction.status === 'success';
  const visual = statusVisual[transaction.status] || statusVisual.expired;

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-6 py-10">
      <div className="max-w-lg w-full">
        <div className="relative rounded-3xl shadow-lg border border-slate-200 bg-white overflow-visible">
          {/* Zona status */}
          <div className={`relative ${visual.header} rounded-t-3xl px-8 pt-9 pb-8 text-center overflow-hidden`}>
            <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase mb-4">
              Tiket #{transaction.id}
            </p>

            {isPending ? (
              <div className="w-16 h-16 border-4 border-warning-200 border-t-warning-600 rounded-full animate-spin motion-reduce:animate-none mx-auto mb-5" />
            ) : (
              <div
                className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${visual.ring} animate-[popIn_0.35s_ease-out] motion-reduce:animate-none`}
              >
                {isSuccess && <CheckCircle2 size={38} className={visual.text} strokeWidth={2} />}
                {transaction.status === 'failed' && <XCircle size={38} className={visual.text} strokeWidth={2} />}
                {transaction.status === 'expired' && <AlertCircle size={38} className={visual.text} strokeWidth={2} />}
              </div>
            )}

            <p className="text-sm text-slate-500 mt-6">{transaction.package?.name}</p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-1 text-slate-800">
              {statusLabel[transaction.status]}
            </h1>

            <style>{`
              @keyframes popIn {
                0% { transform: scale(0.6); opacity: 0; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>
          </div>

          {/* Perforasi */}
          <div className={`relative border-t border-dashed ${visual.seam}`}>
            <TicketNotches />
          </div>

          {/* Zona detail */}
          <div className="p-8">
            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Total Pembayaran</span>
              <span className="font-bold text-brand-600 text-xl">
                Rp{Number(transaction.amount).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-slate-100">
              <span className="text-slate-500 text-sm">Paket</span>
              <span className="font-medium text-slate-800 text-right">{transaction.package?.name}</span>
            </div>

            <div className="flex justify-between items-center py-3">
              <span className="text-slate-500 text-sm flex items-center gap-1.5">
                <Ticket size={14} />
                ID Transaksi
              </span>
              <Barcode className="text-slate-400" />
            </div>

            {error && (
              <div className="mt-5 rounded-xl bg-danger-50 border border-danger-100 p-3 text-danger-700 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {isPending && (
              <>
                <p className="text-center text-sm text-slate-500 mt-6 mb-5">
                  Halaman ini akan otomatis memperbarui ketika pembayaran berhasil.
                </p>

                <button
                  onClick={handleResumePayment}
                  disabled={resuming}
                  className="w-full flex items-center justify-center gap-2 bg-warning-500 hover:bg-warning-600 transition text-white font-semibold py-3 rounded-xl disabled:opacity-60"
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
              </>
            )}

            {isSuccess ? (
              <button
                onClick={() => navigate('/app/my-packages')}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 transition text-white font-semibold py-3 rounded-xl mt-6"
              >
                Lihat Paket Belajar Saya
                <ChevronRight size={17} />
              </button>
            ) : (
              <Link
                to="/app/transactions"
                className="block w-full text-center border border-slate-300 py-3 rounded-xl hover:bg-slate-50 transition mt-6 font-medium text-slate-600"
              >
                Lihat Riwayat Transaksi
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}