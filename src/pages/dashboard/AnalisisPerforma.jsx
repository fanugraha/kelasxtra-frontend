import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle2, Lock,
  TrendingUp, TrendingDown, Target, Flame, Trophy,
} from 'lucide-react';
import { performanceSummaryService } from '../../services/performanceSummaryService';

/**
 * Analisis Kekuatan & Kelemahan -- halaman detail penuh, dituju dari tombol
 * "Lihat Analisis Lengkap" di ProgressSummaryWidget (Beranda). Sumber data
 * tunggal: /me/performance-summary. Sama seperti versi sebelumnya, semua
 * elemen di bawah ini (banner, kartu skor, peta topik, prioritas) dirender
 * dari array yang dikembalikan API -- jumlah section/topik TIDAK di-hardcode,
 * jadi otomatis menyesuaikan kalau admin menambah topik atau exam baru.
 *
 * Perubahan dari versi sebelumnya cuma di GAYA TAMPILAN (banner ambang batas
 * + kartu skor 2-kolom + peta topik berbentuk grid warna), bukan di sumber
 * data atau logic pengambilan data.
 */

function levelStyle(level) {
  if (level === 'strong') return { bg: 'bg-success-50', text: 'text-success-700', bar: 'bg-success-600' };
  if (level === 'medium') return { bg: 'bg-warning-50', text: 'text-warning-700', bar: 'bg-warning-500' };
  if (level === 'weak') return { bg: 'bg-danger-50', text: 'text-danger-700', bar: 'bg-danger-600' };
  return { bg: 'bg-neutral-50', text: 'text-neutral-400', bar: 'bg-neutral-200' };
}

// Urutan tampil di grid: kuat -> sedang -> lemah -> data kurang.
// Ini urutan tetap (bukan nama topik tertentu), jadi tetap generik walau
// topik/jumlahnya berubah-ubah.
const LEVEL_ORDER = { strong: 0, medium: 1, weak: 2, insufficient_data: 3 };

/**
 * Banner ringkasan ambang batas -- dihitung di sisi FE dari data section yang
 * sudah ada (tidak perlu endpoint baru). Kalau section tidak punya
 * min_passing_score (mis. bukan ujian yang punya ambang batas), section itu
 * dikeluarkan dari hitungan supaya tidak bikin bingung.
 */
function ThresholdBanner({ sections }) {
  const withThreshold = sections.filter((s) => s.min_passing_score != null);
  if (withThreshold.length === 0) return null;

  const failing = withThreshold.filter((s) => s.status !== 'passed');

  if (failing.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-success-50 px-4 py-3.5 mb-4">
        <CheckCircle2 size={20} className="text-success-600 shrink-0" />
        <p className="text-sm font-medium text-success-700">
          Semua tes sudah capai ambang batas
        </p>
      </div>
    );
  }

  // Section paling dekat lolos (gap terkecil) yang paling actionable buat disorot.
  const closest = failing
    .filter((s) => s.gap_to_pass != null)
    .sort((a, b) => a.gap_to_pass - b.gap_to_pass)[0];

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-warning-50 px-4 py-3.5 mb-4">
      <AlertTriangle size={20} className="text-warning-600 shrink-0" />
      <div>
        <p className="text-sm font-medium text-warning-700">
          {failing.length} dari {withThreshold.length} tes belum capai ambang batas
        </p>
        {closest && (
          <p className="text-xs text-slate-500 mt-0.5">
            {closest.name.trim()} masih kurang {closest.gap_to_pass} poin dari nilai minimum
          </p>
        )}
      </div>
    </div>
  );
}

function SectionScoreCard({ section }) {
  const hasThreshold = section.min_passing_score != null;
  const pct = hasThreshold
    ? Math.min(100, Math.round((section.current_score / section.min_passing_score) * 100))
    : 100;
  const passed = section.status === 'passed';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs text-slate-500 mb-1 truncate">{section.name.trim()}</p>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl font-semibold tabular-nums ${hasThreshold ? (passed ? 'text-success-700' : 'text-warning-700') : 'text-slate-800'}`}>
          {section.current_score}
        </span>
        {hasThreshold && (
          <span className="text-xs text-slate-400">/ min. {section.min_passing_score}</span>
        )}
      </div>
      {hasThreshold && (
        <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden mt-2">
          <div
            className={`h-full rounded-full transition-all ${passed ? 'bg-success-600' : 'bg-warning-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

function StreakCard({ streak }) {
  const count = streak?.count ?? 0;
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-3">
      <Flame size={20} className={count > 0 ? 'text-warning-600' : 'text-neutral-300'} />
      <div className="min-w-0">
        <p className="text-base font-semibold text-slate-800 tabular-nums">{count} hari</p>
        <p className="text-xs text-slate-500 truncate">
          {count === 0 ? 'Mulai latihan hari ini' : 'Latihan berturut-turut'}
        </p>
      </div>
    </div>
  );
}

function RankingCard({ ranking }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-3">
      <Trophy size={20} className={ranking ? 'text-brand-600' : 'text-neutral-300'} />
      <div className="min-w-0">
        {ranking ? (
          <>
            <p className="text-base font-semibold text-slate-800 tabular-nums">Peringkat {ranking.rank}</p>
            <p className="text-xs text-slate-500 truncate">Dari {ranking.total_participants} peserta</p>
          </>
        ) : (
          <>
            <p className="text-base font-semibold text-slate-400">-</p>
            <p className="text-xs text-slate-500 truncate">Ikuti tryout batch untuk lihat peringkat</p>
          </>
        )}
      </div>
    </div>
  );
}

function PriorityRow({ rec }) {
  return (
    <a
      href={rec.practice_link}
      className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-2.5 hover:bg-slate-100 transition"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{rec.topic_name}</p>
        <p className="text-xs text-danger-600 mt-0.5">
          {rec.percentage != null ? `${rec.percentage}% · ` : ''}perlu fokus
        </p>
      </div>
      <ChevronRight size={18} className="text-slate-400 shrink-0" />
    </a>
  );
}

function TopicMasteryCard({ topic }) {
  const styles = levelStyle(topic.level);

  if (topic.level === 'insufficient_data') {
    return (
      <div className="rounded-xl bg-neutral-50 p-3">
        <p className="text-xs text-neutral-400 truncate">{topic.name}</p>
        <p className="text-xs text-neutral-400 mt-0.5">{topic.sample_size} soal, kurang data</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-3 ${styles.bg}`} title={topic.trend_message || undefined}>
      <div className="flex items-center gap-1">
        <p className={`text-xs truncate ${styles.text}`}>{topic.name}</p>
        {topic.trend === 'up' && <TrendingUp size={11} className={styles.text} />}
        {topic.trend === 'down' && <TrendingDown size={11} className={styles.text} />}
      </div>
      <p className={`text-lg font-semibold mt-0.5 tabular-nums ${styles.text}`}>{topic.percentage}%</p>
    </div>
  );
}

export default function AnalisisPerforma() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlProgramId = searchParams.get('program_id');
  const storedProgramId = localStorage.getItem('preferred_program_id');
  const programId = urlProgramId
    ? Number(urlProgramId)
    : (storedProgramId && storedProgramId !== 'all' ? Number(storedProgramId) : null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!programId) {
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    performanceSummaryService
      .getPerformanceSummary(programId)
      .then((res) => {
        if (active) setData(res);
      })
      .catch(() => {
        if (active) setError('Gagal memuat data analisis. Coba muat ulang halaman.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [programId]);

  const sections = data?.sections || [];
  const isLocked = data?.access?.full === false;

  // Flatten semua topik lintas section jadi 1 daftar buat grid "Peta
  // Penguasaan Topik" -- jumlahnya ikut berapa pun topik yang ada di data,
  // tidak ada nama topik yang ditulis manual di sini.
  const allTopics = isLocked
    ? []
    : sections.flatMap((s) => (Array.isArray(s.topics) ? s.topics : []));
  const sortedTopics = [...allTopics].sort(
    (a, b) => (LEVEL_ORDER[a.level] ?? 9) - (LEVEL_ORDER[b.level] ?? 9)
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4"
      >
        <ChevronLeft size={18} />
        Kembali
      </button>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Analisis Kekuatan & Kelemahan</h1>
        {data?.program?.name && (
          <p className="text-sm text-slate-500 mt-1">{data.program.name}</p>
        )}
      </div>

      {!programId && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-500">Pilih program terlebih dahulu untuk melihat analisis performamu.</p>
        </div>
      )}

      {loading && programId && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
            <div className="h-4 w-40 bg-slate-100 rounded mb-3" />
            <div className="h-2 w-full bg-slate-100 rounded mb-4" />
            <div className="h-3 w-full bg-slate-100 rounded mb-2" />
            <div className="h-3 w-2/3 bg-slate-100 rounded" />
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="rounded-2xl border border-danger-100 bg-danger-50 p-6 text-center">
          <p className="text-sm text-danger-700">{error}</p>
        </div>
      )}

      {!loading && !error && data?.state === 'no_attempts' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <Target size={28} className="text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600 mb-4">
            {data.cta?.message || 'Kerjakan tryout pertamamu untuk melihat peta kekuatan & kelemahanmu'}
          </p>
          <a
            href={data.cta?.action_link || `/app/packages?program_id=${programId}`}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600"
          >
            Mulai Sekarang
          </a>
        </div>
      )}

      {!loading && !error && data && data.state !== 'no_attempts' && (
        <>
          {data.state === 'insufficient_attempts' && (
            <div className="rounded-xl bg-warning-50 border border-warning-100 px-4 py-3 mb-4 flex items-start gap-2">
              <Flame size={16} className="text-warning-600 shrink-0 mt-0.5" />
              <p className="text-xs text-warning-700">
                Sebagian besar topik masih kekurangan data. Kerjakan lebih banyak latihan soal supaya analisis makin akurat.
              </p>
            </div>
          )}

          {/* Banner ambang batas -- dihitung dari sections, bukan endpoint baru */}
          {!isLocked && <ThresholdBanner sections={sections} />}

          {/* Kartu skor per section, 2 kolom, jumlah ikut banyaknya section */}
          {!isLocked && sections.filter((s) => s.min_passing_score != null).length > 0 && (
            <div className={`grid gap-3 mb-4 ${sections.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {sections
                .filter((s) => s.min_passing_score != null)
                .map((section) => (
                  <SectionScoreCard key={section.section_id} section={section} />
                ))}
            </div>
          )}

          {/* Streak & ranking -- 2 kartu terpisah */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StreakCard streak={data.streak} />
            <RankingCard ranking={data.ranking} />
          </div>

          {isLocked && data.access?.upgrade_cta && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-slate-400 shrink-0" />
                <p className="text-xs text-slate-600">{data.access.upgrade_cta.message}</p>
              </div>
              <a
                href={data.access.upgrade_cta.action_link}
                className="text-xs font-semibold text-brand-600 shrink-0"
              >
                Buka Paket
              </a>
            </div>
          )}

          {/* Prioritas latihan -- jumlahnya ikut top_recommendations dari API */}
          {!isLocked && data.top_recommendations?.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2.5">
                <Flame size={15} className="text-danger-500" />
                <h2 className="text-sm font-semibold text-slate-800">Prioritas Latihan Minggu Ini</h2>
              </div>
              <div className="space-y-2">
                {data.top_recommendations.map((rec) => (
                  <PriorityRow key={rec.topic_id} rec={rec} />
                ))}
              </div>
            </div>
          )}

          {/* Peta penguasaan topik -- grid dinamis, jumlah kartu = jumlah topik di data */}
          {!isLocked && sortedTopics.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-800 mb-2.5">Peta Penguasaan Topik</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {sortedTopics.map((topic) => (
                  <TopicMasteryCard key={topic.topic_id} topic={topic} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
