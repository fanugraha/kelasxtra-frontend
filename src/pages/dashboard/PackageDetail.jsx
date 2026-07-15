import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, BookOpen, Clock, ShieldCheck, Zap } from 'lucide-react';
import { packageService } from '../../services/packageService';
import CheckoutModal from '../../components/CheckoutModal';

const typeLabel = {
  privat: 'Kelas Privat',
  group: 'Kelas Group',
  reguler: 'Kelas Online',
  latihan_soal: 'Latihan Soal',
};

const ctaLabelByType = {
  latihan_soal: 'Mulai Latihan Sekarang',
  privat: 'Beli Sekarang, Akses Instan',
  group: 'Beli Sekarang, Akses Instan',
  reguler: 'Beli Sekarang, Akses Instan',
};

export default function PackageDetail() {
  const { packageId } = useParams();
  const navigate = useNavigate();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    packageService.getPackage(packageId)
      .then((data) => {
        if (active) setPkg(data);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Gagal memuat detail paket.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [packageId]);

  async function handleConfirmCheckout(promoCode) {
    setConfirming(true);
    setError('');
    try {
      const transaction = await packageService.checkout(pkg.id, promoCode);

      if (!window.snap || !transaction.snap_token) {
        setError('Payment gateway belum siap dimuat, coba refresh halaman.');
        setConfirming(false);
        return;
      }

      window.snap.pay(transaction.snap_token, {
        onSuccess: () => navigate(`/app/transactions/${transaction.id}`),
        onPending: () => navigate(`/app/transactions/${transaction.id}`),
        onError: () => {
          setError('Pembayaran gagal. Silakan coba lagi.');
          setConfirming(false);
        },
        onClose: () => setConfirming(false),
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memproses pembelian.');
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="h-4 w-32 bg-slate-200 rounded mb-6 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4 order-2 md:order-1">
            <div className="h-6 w-2/3 bg-slate-200 rounded relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>
            <div className="h-4 w-full bg-slate-200 rounded relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>
            <div className="h-4 w-5/6 bg-slate-200 rounded relative overflow-hidden">
              <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            </div>
          </div>
          <div className="h-48 bg-slate-200 rounded-xl order-1 md:order-2 relative overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !pkg) {
    return (
      <div className="p-8 text-center text-danger-600">{error}</div>
    );
  }

  if (!pkg) return null;

  const basePrice = Number(pkg.price);
  const finalPrice = Number(pkg.discount_price ?? pkg.price);
  const hasDiscount = pkg.discount_price != null && Number(pkg.discount_price) < basePrice;
  const discountPercent = hasDiscount
    ? Math.round(((basePrice - finalPrice) / basePrice) * 100)
    : 0;

  const hasFeatures = Array.isArray(pkg.features) && pkg.features.length > 0;
  const hasMateri = Array.isArray(pkg.materi) && pkg.materi.length > 0;
  const hasDescription = Boolean(pkg.description);
  const hasAboutContent = hasDescription || hasFeatures || hasMateri;
  const ctaLabel = ctaLabelByType[pkg.type] || 'Beli Sekarang';
  const durationLabel = pkg.duration_days
    ? `Berlaku ${pkg.duration_days} hari setelah aktivasi`
    : 'Akses selamanya setelah aktivasi';

  return (
    <div className="max-w-5xl mx-auto p-6 pb-28 md:pb-6 animate-fade-slide-up">
      <button
        onClick={() => navigate('/app/packages')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ChevronLeft size={16} />
        Kembali ke Daftar Paket
      </button>

      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {/* Banner — muncul duluan di mobile karena elemen paling menarik perhatian */}
        <div className="order-1 md:order-2">
          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
            {pkg.banner_image_url ? (
              <img
                src={pkg.banner_image_url}
                alt={pkg.name}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 flex flex-col items-center justify-center text-white p-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
                <BookOpen size={32} className="mb-2 opacity-90 relative" strokeWidth={1.5} />
                <span className="font-bold text-sm relative">{typeLabel[pkg.type] || pkg.type}</span>
              </div>
            )}
            <div className="p-4 bg-white">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                {typeLabel[pkg.type] || pkg.type}
              </span>
              {hasMateri && (
                <p className="text-sm text-slate-500 mt-1">
                  {pkg.materi.length} materi pembelajaran
                </p>
              )}
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                <ShieldCheck size={14} className="text-success-600" />
                Pembayaran aman diproses via Midtrans
              </div>
            </div>
          </div>
        </div>

        {/* Info paket */}
        <div className="md:col-span-2 order-2 md:order-1">
          <h1 className="text-2xl font-extrabold text-slate-800 mb-3 uppercase">
            {pkg.name}
          </h1>

          <div className="flex items-center gap-3 mb-2">
            {hasDiscount && (
              <span className="text-xs font-bold text-success-700 bg-success-50 border border-success-100 px-2 py-1 rounded animate-pop-in">
                Hemat {discountPercent}%
              </span>
            )}
            {hasDiscount && (
              <span className="text-slate-400 line-through text-sm">
                Rp{basePrice.toLocaleString('id-ID')}
              </span>
            )}
          </div>
          <div className="text-3xl font-extrabold bg-gradient-to-r from-danger-600 to-danger-500 bg-clip-text text-transparent mb-2">
            Rp{finalPrice.toLocaleString('id-ID')}
          </div>

          <p className="flex items-center gap-1.5 text-sm text-slate-500 mb-6">
            <Clock size={14} />
            {durationLabel}
          </p>

          {/* CTA desktop — sticky bar mengambil alih di mobile */}
          <button
            onClick={() => setShowCheckout(true)}
            className="hidden md:flex w-full md:w-auto items-center justify-center gap-2 px-10 bg-brand-700 hover:bg-brand-800 text-white font-bold py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-brand-700/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
          >
            <Zap size={16} />
            {ctaLabel}
          </button>

          {error && (
            <p className="text-sm text-danger-600 mt-3">{error}</p>
          )}
        </div>
      </div>

      {/* Tentang Paket - full width, hanya tampil kalau ada isinya */}
      {hasAboutContent && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-brand-700 mb-4">Tentang Paket</h2>

          {hasDescription && (
            <p className="text-slate-600 whitespace-pre-line mb-4">{pkg.description}</p>
          )}

          {hasFeatures && (
            <ul className="space-y-2 mb-6">
              {pkg.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckCircle2 size={16} className="text-success-600 mt-0.5 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          )}

          {hasMateri && (
            <>
              <h3 className="text-base font-bold text-brand-700 mb-3">Materi</h3>
              <div className="space-y-2">
                {pkg.materi.map((materi, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-brand-50 text-brand-700 font-medium text-sm rounded-lg px-4 py-2.5 transition-colors hover:bg-brand-100"
                  >
                    <span className="text-brand-400">{i + 1}.</span>
                    {materi}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Sticky CTA — mobile only, muncul terus meski user scroll jauh */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 flex items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] z-40">
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-slate-400 leading-none mb-1">Harga</div>
          <div className="text-lg font-extrabold text-danger-600 leading-none truncate">
            Rp{finalPrice.toLocaleString('id-ID')}
          </div>
        </div>
        <button
          onClick={() => setShowCheckout(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-700 hover:bg-brand-800 text-white font-bold rounded-lg transition-all active:scale-[0.98] whitespace-nowrap"
        >
          <Zap size={16} />
          {ctaLabel}
        </button>
      </div>

      {showCheckout && (
        <CheckoutModal
          pkg={pkg}
          onClose={() => setShowCheckout(false)}
          onConfirm={handleConfirmCheckout}
          confirming={confirming}
        />
      )}
    </div>
  );
}