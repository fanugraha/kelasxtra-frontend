import { GraduationCap, Landmark, IdCard, Building2, BookOpen } from 'lucide-react';

const PROGRAM_ICON = {
  'snbt': GraduationCap,
  'ujian-mandiri': Landmark,
  'skd': IdCard,
  'cpns-skd': IdCard,
  'bumn': Building2,
};

const PROGRAM_SUBTITLE = {
  'snbt': 'Kejar Universitas dan Sekolah Tinggi Impian',
  'ujian-mandiri': 'Siap hadapi Ujian Mandiri',
  'skd': 'Ayo taklukkan Ujian SKD',
  'cpns-skd': 'Ayo taklukkan Ujian SKD',
  'bumn': 'Taklukkan ujian TKD Akhlak BUMN untuk Indonesia',
};

export default function CategoryModal({
  programs,
  loading,
  onSelect,
  onSkip,
  onClose,
  title = 'Kamu mau persiapan apa?',
  subtitle = 'Pilih kategori supaya Beranda kamu langsung terarah sesuai kebutuhan.',
  skipLabel = 'Lewati, saya belum tahu →',
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl p-6 md:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-500 hover:text-brand-700 text-xl leading-none"
          aria-label="Tutup"
        >
          ×
        </button>

        <h2 className="text-xl md:text-2xl font-bold text-brand-700 mb-1">{title}</h2>
        <p className="text-neutral-500 mb-6 text-sm md:text-base">{subtitle}</p>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-neutral-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {programs.map((program) => {
              const Icon = PROGRAM_ICON[program.slug] ?? BookOpen;
              return (
                <button
                  key={program.id}
                  onClick={() => onSelect(program)}
                  className="bg-white border border-brand-100 rounded-xl py-6 px-3 text-center hover:border-brand-500 hover:shadow-md transition flex flex-col items-center gap-3"
                >
                  <Icon size={36} className="text-brand-600" strokeWidth={1.5} />
                  <span className="font-bold text-brand-700">{program.name}</span>
                  <span className="text-xs text-neutral-500 leading-snug">
                    {PROGRAM_SUBTITLE[program.slug] ?? 'Ayo mulai belajar sekarang'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={onSkip}
          className="text-sm text-neutral-500 hover:text-brand-700 hover:underline"
        >
          {skipLabel}
        </button>
      </div>
    </div>
  );
}