import { FileText, Ticket, CheckCircle2 } from 'lucide-react';

/**
 * Header halaman detail paket — mirip pola "Daftar Paket Bundling" Al Faiz:
 * teks + checklist di kiri, banner di kanan.
 * Dipisah dari PackageExams.jsx supaya gampang dipakai ulang.
 *
 * Props:
 * - pkg: {
 *     name, description?, validity_note?, banner_image_url?, features?: string[],
 *     program?: { name }
 *   }
 * - examsCount: number
 * - totalDuration: number (menit)
 */
export default function PackageHero({ pkg, examsCount, totalDuration }) {
  if (!pkg) return null;

  const checklist =
    Array.isArray(pkg.features) && pkg.features.length > 0
      ? pkg.features
      : [
          `${examsCount} paket Try Out Online`,
          ...(totalDuration > 0 ? [`${totalDuration} menit total pengerjaan`] : []),
        ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 items-start mb-10 animate-fade-slide-up">
      {/* Left: teks */}
      <div>
        {pkg.program?.name && (
          <span className="inline-block bg-brand-50 text-brand-600 text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full mb-3">
            {pkg.program.name}
          </span>
        )}

        <h1 className="text-3xl font-extrabold text-slate-800 mb-3 leading-tight">
          {pkg.name}
        </h1>

        {pkg.description && (
          <p className="text-slate-600 mb-4 line-clamp-2">{pkg.description}</p>
        )}

        {pkg.validity_note && (
          <p className="font-semibold text-slate-700 mb-4 text-sm">{pkg.validity_note}</p>
        )}

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-700 text-sm">
          {checklist.map((item, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <CheckCircle2 size={15} className="text-success-600 shrink-0 mt-0.5" />
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Right: banner */}
      <div className="relative h-52 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-600 to-brand-700 shrink-0 w-full">
        {pkg.banner_image_url ? (
          <img
            src={pkg.banner_image_url}
            alt={pkg.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            {/* Fallback dekoratif: tumpukan kartu tiket, dipakai kalau
                paket belum punya banner_image_url dari admin */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, white 0, white 2px, transparent 2px, transparent 24px)',
              }}
            />
            <div className="relative z-10 h-full flex items-center justify-center gap-2">
              <Ticket size={64} className="text-white/25 -rotate-12 -mr-6" strokeWidth={1.2} />
              <Ticket size={72} className="text-white/50 rotate-3 z-10" strokeWidth={1.2} />
              <Ticket size={64} className="text-white/25 rotate-12 -ml-6" strokeWidth={1.2} />

              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">
                <FileText size={13} />
                {examsCount} Try Out
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}