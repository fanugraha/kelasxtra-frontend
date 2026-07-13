import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, BookOpen, Clock } from 'lucide-react';
import { packageService } from '../../services/packageService';
import CheckoutModal from '../../components/CheckoutModal';

const typeLabel = {
  privat: 'Kelas Privat',
  group: 'Kelas Group',
  reguler: 'Kelas Online',
  latihan_soal: 'Latihan Soal',
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
      <div className="max-w-5xl mx-auto p-6 animate-pulse">
        <div className="h-4 w-32 bg-slate-200 rounded mb-6" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="h-6 w-2/3 bg-slate-200 rounded" />
            <div className="h-4 w-full bg-slate-200 rounded" />
            <div className="h-4 w-5/6 bg-slate-200 rounded" />
          </div>
          <div className="h-40 bg-slate-200 rounded-xl" />
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

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button
        onClick={() => navigate('/app/packages')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 mb-6"
      >
        <ChevronLeft size={16} />
        Beli Paket
      </button>

      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {/* Kiri: info paket */}
        <div className="md:col-span-2">
          <h1 className="text-2xl font-extrabold text-slate-800 mb-3 uppercase">
            {pkg.name}
          </h1>

          <div className="flex items-center gap-3 mb-2">
            {hasDiscount && (
              <span className="text-xs font-bold text-success-700 bg-success-50 border border-success-100 px-2 py-1 rounded">
                {discountPercent}%
              </span>
            )}
            {hasDiscount && (
              <span className="text-slate-400 line-through text-sm">
                Rp{basePrice.toLocaleString('id-ID')}
              </span>
            )}
          </div>
          <div className="text-3xl font-extrabold text-danger-600 mb-2">
            Rp{finalPrice.toLocaleString('id-ID')}
          </div>

          <p className="flex items-center gap-1.5 text-sm text-slate-500 mb-6">
            <Clock size={14} />
            Berlaku {pkg.duration_days} hari setelah aktivasi
          </p>

          <button
            onClick={() => setShowCheckout(true)}
            className="w-full md:w-auto px-10 bg-brand-700 hover:bg-brand-800 text-white font-bold py-3 rounded-lg transition"
          >
            Beli Paket
          </button>

          {error && (
            <p className="text-sm text-danger-600 mt-3">{error}</p>
          )}
        </div>

        {/* Kanan: banner */}
        <div>
          <div className="rounded-xl overflow-hidden border border-slate-200">
            {pkg.banner_image_url ? (
              <img
                src={pkg.banner_image_url}
                alt={pkg.name}
                className="w-full h-48 object-cover"
              />
            ) : (
              <div className="w-full h-48 bg-brand-700 flex flex-col items-center justify-center text-white p-4 text-center">
                <BookOpen size={32} className="mb-2 opacity-80" />
                <span className="font-bold text-sm">
                  {typeLabel[pkg.type] || pkg.type}
                </span>
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
            </div>
          </div>
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
                    className="flex items-center gap-2 bg-brand-50 text-brand-700 font-medium text-sm rounded-lg px-4 py-2.5"
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