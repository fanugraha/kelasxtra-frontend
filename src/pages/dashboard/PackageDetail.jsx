import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, CheckCircle2, BookOpen, Clock,
  ShieldCheck, Zap, Layers, Tag,
} from 'lucide-react';
import { packageService } from '../../services/packageService';
import CheckoutModal from '../../components/CheckoutModal';
import PackageCard from '../../components/packages/PackageCard';
import { useOwnedPackageIds } from '../../hooks/useOwnedPackageIds';

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
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  // ── Jumlah latihan soal REAL dari relasi Package->exams() ────────────
  // Beda dari `pkg.materi` (teks bebas yang ditulis admin), ini angka
  // yang benar-benar bisa dibuktikan sistem — karena itu ditampilkan
  // sebagai klaim terpisah ("X Latihan Soal Termasuk"), bukan digabung
  // ke daftar materi. TODO(API): kalau `packageService.getPackageExams`
  // belum ada, tambahkan method yang manggil
  // `GET /packages/{package}/exams` (route ini sudah ada di routes/api.php).
  const [examCount, setExamCount] = useState(null);

  useEffect(() => {
    if (!packageId) return;
    let active = true;
    packageService
      .getPackageExams?.(packageId)
      .then((exams) => {
        if (active && Array.isArray(exams)) setExamCount(exams.length);
      })
      .catch(() => {
        if (active) setExamCount(null);
      });
    return () => { active = false; };
  }, [packageId]);

  // ── Paket lain di kategori yang sama (program_id) ────────────────────
  // Bukan "seri/part" formal (Package tidak punya field grouping di DB),
  // tapi konteks kategori (`program_id`) valid dan sudah di-load backend
  // lewat `$package->load('program', 'subject')`. Dipakai buat cross-sell
  // yang jujur: paket lain yang benar-benar satu program, bukan tebakan.
  const [relatedPackages, setRelatedPackages] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
    const { ownedPackageIds } = useOwnedPackageIds();
    const availableRelatedPackages = relatedPackages.filter((p) => !ownedPackageIds.has(p.id));

  useEffect(() => {
    if (!pkg?.program_id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoadingRelated(false);
      return;
    }
    let active = true;
    setLoadingRelated(true);
    packageService
      .listPackages(pkg.program_id)
      .then((data) => {
        if (!active) return;
        setRelatedPackages(data.filter((p) => p.id !== pkg.id).slice(0, 4));
      })
      .catch(() => {
        if (active) setRelatedPackages([]);
      })
      .finally(() => {
        if (active) setLoadingRelated(false);
      });
    return () => { active = false; };
  }, [pkg?.program_id, pkg?.id]);

  async function handleConfirmCheckout(promoCode) {
    setConfirming(true);
    setCheckoutError('');
    try {
      const transaction = await packageService.checkout(pkg.id, promoCode);

      if (!window.snap || !transaction.snap_token) {
        setCheckoutError('Payment gateway belum siap dimuat, coba refresh halaman.');
        setConfirming(false);
        return;
      }

      window.snap.pay(transaction.snap_token, {
        onSuccess: () => navigate(`/app/transactions/${transaction.id}`),
        onPending: () => navigate(`/app/transactions/${transaction.id}`),
        onError: () => {
          setCheckoutError('Pembayaran gagal. Silakan coba lagi.');
          setConfirming(false);
        },
        onClose: () => setConfirming(false),
      });
    } catch (err) {
      setCheckoutError(err.response?.data?.message || 'Gagal memproses pembelian.');
      setConfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="h-4 w-32 bg-slate-200 rounded mb-6 relative overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
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
          <div className="h-72 bg-slate-200 rounded-xl relative overflow-hidden">
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
  // Breakdown harga per hari — murni hasil bagi dari field yang sudah ada
  // (price, duration_days), bukan angka baru. Cuma relevan buat paket
  // yang punya masa berlaku; "akses selamanya" tidak dapat baris ini.
  const perDayPrice = pkg.duration_days
    ? Math.round(finalPrice / pkg.duration_days)
    : null;

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

      <div className="grid md:grid-cols-3 gap-8 mb-8 items-start">
        {/* ── Info paket — dibungkus card putih supaya kepisah jelas dari
            background halaman, konsisten sama pola card lain di app ── */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          {/* Breadcrumb kategori — data sudah dikirim backend via
              $package->load('program','subject'), sebelumnya tidak
              ditampilkan sama sekali. */}
          {(pkg.program?.name || pkg.subject?.name) && (
            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              {pkg.program?.name && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full">
                  <Tag size={11} />
                  {pkg.program.name}
                </span>
              )}
              {pkg.subject?.name && (
                <span className="inline-flex items-center text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                  {pkg.subject.name}
                </span>
              )}
            </div>
          )}

          <h1 className="text-2xl font-extrabold text-slate-800 mb-3">
            {pkg.name}
          </h1>

          {/* Quick-stat strip — scan cepat sebelum baca deskripsi panjang */}
          <div className="flex items-center gap-4 flex-wrap text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
            <span className="flex items-center gap-1.5">
              <BookOpen size={15} className="text-brand-500" />
              {hasMateri ? `${pkg.materi.length} Materi` : (typeLabel[pkg.type] || pkg.type)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={15} className="text-brand-500" />
              {durationLabel}
            </span>
            {examCount !== null && examCount > 0 && (
              <span className="flex items-center gap-1.5">
                <Layers size={15} className="text-brand-500" />
                {examCount} Latihan Soal Termasuk
              </span>
            )}
          </div>

          {hasAboutContent && (
            <>
              {hasDescription && (
                <p className="text-slate-600 whitespace-pre-line mb-6">{pkg.description}</p>
              )}

              {hasFeatures && (
                <>
                  <h2 className="text-base font-bold text-brand-700 mb-3">Yang Kamu Dapatkan</h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 mb-6">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckCircle2 size={16} className="text-success-600 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {hasMateri && (
                <>
                  <h2 className="text-base font-bold text-brand-700 mb-3">Materi</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
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
            </>
          )}

          {error && (
            <p className="text-sm text-danger-600 mt-3">{error}</p>
          )}
        </div>

        {/* ── Purchase card — sticky di desktop, gabungan banner+harga+CTA ──
            top-24 (bukan top-6): navbar app ini fixed/sticky di atas, kalau
            offset sticky lebih kecil dari tinggi navbar, card ini nempel
            SEBAGIAN ketutup navbar pas discroll — kelihatan kayak "masih
            ikut kescroll" padahal sebenarnya sudah sticky, cuma posisinya
            salah. Sesuaikan angka top-24 ini kalau tinggi navbar-mu beda. */}
        <div className="md:sticky md:top-24">
          <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white">
            {pkg.banner_image_url ? (
              <img
                src={pkg.banner_image_url}
                alt={pkg.name}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 flex flex-col items-center justify-center text-white p-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
                <BookOpen size={32} className="mb-2 opacity-90 relative" strokeWidth={1.5} />
                <span className="font-bold text-sm relative">{typeLabel[pkg.type] || pkg.type}</span>
              </div>
            )}

            <div className="p-5">
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

              <div className="text-3xl font-extrabold text-danger-600 mb-1">
                Rp{finalPrice.toLocaleString('id-ID')}
              </div>

              {perDayPrice !== null && (
                <p className="text-xs text-slate-400 mb-4">
                  Setara Rp{perDayPrice.toLocaleString('id-ID')}/hari
                </p>
              )}

              <button
                onClick={() => setShowCheckout(true)}
                className="hidden md:flex w-full items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white font-bold py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-brand-700/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] mt-2"
              >
                <Zap size={16} />
                {ctaLabel}
              </button>

              {/* Preview fitur singkat — penguat keputusan tepat sebelum
                  CTA, bukan daftar lengkap (itu sudah ada di "Yang Kamu
                  Dapatkan" di kolom kiri). Cuma 3 poin teratas. */}
              {hasFeatures && (
                <ul className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  {pkg.features.slice(0, 3).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 size={14} className="text-success-600 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-1">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck size={14} className="text-success-600 shrink-0" />
                Pembayaran aman diproses via Midtrans
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Paket Lain di Kategori Ini — cross-sell dari program_id yang sama,
          bukan tebakan; hanya muncul kalau memang ada paket lain di
          program tersebut. */}
      {!loadingRelated && availableRelatedPackages.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Paket Lain di Kategori Ini</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {availableRelatedPackages.map((related) => (
              <PackageCard
                key={related.id}
                pkg={related}
                onOpen={() => navigate(`/app/packages/${related.id}`)}
                ctaLabel="Lihat Detail"
              />
            ))}
          </div>
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
          onClose={() => { setShowCheckout(false); setCheckoutError(''); }}
          onConfirm={handleConfirmCheckout}
          confirming={confirming}
          checkoutError={checkoutError}
        />
      )}
    </div>
  );
}