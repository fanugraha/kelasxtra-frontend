import { Clock, GraduationCap } from 'lucide-react';

// Komponen card paket yang dipakai ulang di Beranda (Landing), Packages
// (Mulai Belajar), dan halaman lain yang menampilkan daftar paket. Style
// mengikuti desain referensi: header image/gradient, badge materi, divider
// tipis sebelum harga, badge diskon hijau, dan CTA pill penuh warna brand.
//
// cornerBadge (opsional): { label, icon: LucideIcon, className } — badge
//   pojok kiri atas kecil, mis. "TERLARIS" atau "BUNDLING".
// typeBadgeLabel (opsional): string singkat di pojok kanan (mis. "Privat").
// popular (opsional): true → ribbon gradient full di tengah-atas + border
//   & scale sedikit lebih menonjol (dipakai untuk highlight 1 paket, mis.
//   di section "Paket Belajar" Landing).
// popularLabel (opsional): teks ribbon saat popular=true, default
//   "🔥 Paling Laris".
// features (opsional): array string, ditampilkan sbg bullet list singkat
//   (maks 3 baris) di atas divider harga. Kalau tidak diisi, otomatis
//   fallback ke pkg.features (kalau ada) — jadi tidak akan pernah nge-render
//   fitur yang tidak benar-benar ada di data paket.
const PROMO_GRADIENT = 'linear-gradient(120deg, #f97316 0%, #ef4444 35%, #dc2626 65%, #f97316 100%)';

export default function PackageCard({
  pkg,
  onOpen,
  cornerBadge = null,
  typeBadgeLabel = null,
  ctaLabel = 'Selengkapnya',
  popular = false,
  popularLabel = '🔥 Paling Laris',
  features = null,
}) {
  const hasDiscount = pkg.discount_price && Number(pkg.discount_price) < Number(pkg.price);
  const finalPrice = hasDiscount ? pkg.discount_price : pkg.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(pkg.discount_price) / Number(pkg.price)) * 100)
    : 0;
  const materiCount = Array.isArray(pkg.materi) ? pkg.materi.length : 0;

  // Fallback ke pkg.features kalau prop features tidak diisi, biar caller
  // tidak wajib mapping manual setiap kali render list paket.
  const featureList = Array.isArray(features)
    ? features
    : Array.isArray(pkg.features)
    ? pkg.features
    : [];

  return (
    <div
      onClick={onOpen}
      className={`group relative bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col hover:shadow-md transition cursor-pointer ${
        popular ? 'border-2 border-orange-300 md:scale-[1.03] shadow-lg' : 'border border-slate-200 hover:border-brand-200'
      }`}
    >
      {popular && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-white text-xs font-bold px-3 py-1 rounded-full shadow bg-[length:200%_200%] animate-[promoFlow_6s_ease_infinite]"
          style={{ backgroundImage: PROMO_GRADIENT }}
        >
          {popularLabel}
        </span>
      )}

      {cornerBadge && (
        <span
          className={`absolute top-2.5 left-2.5 z-10 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full transition duration-200 group-hover:scale-110 ${
            cornerBadge.className || 'bg-yellow-400 text-yellow-900'
          }`}
        >
          {cornerBadge.icon && <cornerBadge.icon size={10} fill="currentColor" />}
          {cornerBadge.label}
        </span>
      )}

      <div className="relative h-36 overflow-hidden shrink-0">
        {pkg.banner_image_url ? (
          <img
            src={pkg.banner_image_url}
            alt={pkg.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-brand-600 to-orange-500 flex items-center justify-center px-4">
            <p className="text-white font-bold text-center text-sm">{pkg.name}</p>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-2 mb-3">
          {materiCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full w-fit">
              <GraduationCap size={12} />
              {materiCount} Materi
            </span>
          ) : (
            <span />
          )}
          {typeBadgeLabel && (
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
              {typeBadgeLabel}
            </span>
          )}
        </div>

        <h3 className="text-lg font-extrabold text-slate-800 leading-snug mb-2">{pkg.name}</h3>

        {pkg.description && (
          <p className="text-sm text-slate-500 mb-3 flex-1 line-clamp-2">{pkg.description}</p>
        )}

        {featureList.length > 0 && (
          <ul className="space-y-1.5 mb-3 text-sm text-slate-600">
            {featureList.slice(0, 3).map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <svg
                  className="shrink-0 mt-0.5 text-amber-500"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m5 12 5 5 9-9" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
        )}

        <p className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
          <Clock size={13} />
          Akses {pkg.duration_days ? `${pkg.duration_days} hari` : 'selamanya'}
        </p>

        <div className="border-t border-slate-100 mb-4" />

        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {hasDiscount && (
              <span className="text-xs font-bold text-success-700 bg-success-100 px-2 py-0.5 rounded-full">
                {discountPercent}%
              </span>
            )}
            {hasDiscount && (
              <span className="text-sm text-slate-400 line-through">
                Rp{Number(pkg.price).toLocaleString('id-ID')}
              </span>
            )}
          </div>
          <span className="text-xl font-extrabold text-brand-700 shrink-0">
            Rp{Number(finalPrice).toLocaleString('id-ID')}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="mt-auto w-full flex items-center justify-center bg-brand-700 text-white font-bold py-3 rounded-full hover:bg-brand-800 transition active:scale-95"
        >
          {ctaLabel}
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