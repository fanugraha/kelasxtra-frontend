import { GraduationCap, ChevronRight, Check, Star, Users } from 'lucide-react';

// Komponen card paket — versi redesign terinspirasi pola marketplace/bimbel
// (Ruangguru dkk). Urutan visual: badge mengambang di atas banner → banner
// full-bleed (elemen visual dominan) → label paket (pendukung, bukan
// headline kedua) → harga → CTA → fitur pendukung → (opsional) trust
// signal. Deskripsi panjang & daftar fitur lengkap sengaja TIDAK ditaruh
// di card ini; itu tugas halaman detail paket.
//
// KENAPA BADGE PINDAH KE ATAS BANNER (bukan di panel terpisah lagi):
// menghilangkan satu blok visual berurutan (panel judul → panel gambar)
// jadi cuma satu area gambar yang badge-nya menempel di pojoknya —
// card jadi lebih ringkas dan cepat di-scan.
//
// KENAPA JUDUL TIDAK DIHAPUS TOTAL (hanya diperkecil & dipindah ke bawah
// banner): banner sering berupa aset kampanye generik yang dipakai ulang
// di beberapa paket sekaligus (mis. "PENERIMAAN CPNS 2026" dipakai di
// Part 1-3, Part 4-6, dst) — jadi banner sendiri belum tentu unik per
// paket. Judul tetap perlu ada supaya pembeli tahu paket spesifik yang
// mana, tapi cukup jadi label pendukung, bukan headline kedua yang
// bersaing sama teks di dalam banner.
//
// cornerBadge (opsional): { label, icon: LucideIcon, className } — pill
//   overlay di pojok kiri-atas banner, mis. "TERLARIS".
// typeBadgeLabel (opsional): pill kedua di sebelah cornerBadge, mis. "Privat".
// popular (opsional): ribbon gradient di tengah-atas + border lebih menonjol.
// features (opsional): array string, ditampilkan MAX 2 baris sbg bullet
//   ringkas di bawah CTA. Fallback ke pkg.features kalau tidak diisi.
// trustSignal (opsional): { icon: LucideIcon, label } — baris kecil di
//   bawah fitur, mis. { icon: Users, label: "312 orang sudah beli" } atau
//   { icon: Star, label: "4.8 dari 120 ulasan" }. TODO(API): isi prop ini
//   dari data asli (rating/jumlah pembeli) begitu backend menyediakannya —
//   JANGAN diisi angka dummy, lebih baik disembunyikan (default null).
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
  trustSignal = null,
}) {
  const hasDiscount = pkg.discount_price && Number(pkg.discount_price) < Number(pkg.price);
  const finalPrice = hasDiscount ? pkg.discount_price : pkg.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(pkg.discount_price) / Number(pkg.price)) * 100)
    : 0;
  const materiCount = Array.isArray(pkg.materi) ? pkg.materi.length : 0;

  const featureList = Array.isArray(features)
    ? features
    : Array.isArray(pkg.features)
    ? pkg.features
    : [];

  return (
    <div
      onClick={onOpen}
      className={`group relative bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col cursor-pointer transition hover:shadow-md ${
        popular ? 'border-2 border-orange-300 md:scale-[1.03] shadow-lg' : 'border border-slate-200 hover:border-brand-200'
      }`}
    >
      {popular && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 text-white text-xs font-bold px-3 py-1 rounded-full shadow bg-[length:200%_200%] animate-[promoFlow_6s_ease_infinite]"
          style={{ backgroundImage: PROMO_GRADIENT }}
        >
          {popularLabel}
        </span>
      )}

      {/* ── Banner — full-bleed dari sudut atas card, badge mengambang di pojoknya ── */}
      <div className="relative w-full h-40 sm:h-44 bg-gradient-to-br from-brand-50 to-orange-50">
        {pkg.banner_image_url ? (
          <img
            src={pkg.banner_image_url}
            alt={pkg.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <GraduationCap size={44} className="text-brand-400" strokeWidth={1.5} />
          </div>
        )}

        {(cornerBadge || typeBadgeLabel) && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            {cornerBadge && (
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-full shadow-md transition duration-200 group-hover:scale-105 ${
                  cornerBadge.className || 'bg-white text-brand-700'
                }`}
              >
                {cornerBadge.icon && <cornerBadge.icon size={11} />}
                {cornerBadge.label}
              </span>
            )}
            {typeBadgeLabel && (
              <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1.5 rounded-full bg-black/40 text-white backdrop-blur-sm">
                {typeBadgeLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Bawah: label paket → harga → CTA → fitur → trust signal ── */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-slate-700 leading-snug line-clamp-2 mb-2 min-h-[2.4em]">
          {pkg.name}
        </h3>

        <p className="text-xs text-slate-400 mb-1">
          {materiCount > 0 ? `${materiCount} Materi` : 'Paket belajar'}
          {' · '}
          Akses {pkg.duration_days ? `${pkg.duration_days} hari` : 'selamanya'}
          {hasDiscount && (
            <span className="ml-1.5 line-through text-slate-300">
              Rp{Number(pkg.price).toLocaleString('id-ID')}
            </span>
          )}
        </p>

        <div className="flex items-center gap-2 mb-4">
          {hasDiscount && (
            <span className="text-xs font-bold text-danger-600 bg-danger-50 px-2 py-0.5 rounded-full shrink-0">
              {discountPercent}%
            </span>
          )}
          <span className="text-xl font-extrabold text-brand-700">
            Rp{Number(finalPrice).toLocaleString('id-ID')}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="w-full flex items-center justify-center gap-1.5 bg-brand-700 text-white font-bold py-3 rounded-full hover:bg-brand-800 transition active:scale-95 mb-4"
        >
          {ctaLabel}
          <ChevronRight size={15} />
        </button>

        {featureList.length > 0 && (
          <ul className="space-y-1.5 text-xs text-slate-600">
            {featureList.slice(0, 2).map((f, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check size={13} className="shrink-0 mt-0.5 text-success-600" strokeWidth={2.5} />
                <span className="line-clamp-1" title={f}>{f}</span>
              </li>
            ))}
          </ul>
        )}

        {trustSignal && (
          <p className="mt-auto pt-3 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <trustSignal.icon size={12} className="text-brand-400" />
            {trustSignal.label}
          </p>
        )}
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