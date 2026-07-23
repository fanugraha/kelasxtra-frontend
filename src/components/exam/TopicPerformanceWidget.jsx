import { useEffect, useState } from 'react';
import { Target, TrendingDown, TrendingUp } from 'lucide-react';
import { topicPerformanceService } from '../../services/topicPerformanceService';

/**
 * Peta Kekuatan & Kelemahan — melengkapi PassingGradeStatus. Kalau
 * PassingGradeStatus jawab "sudah lolos ambang batas atau belum" per
 * section (TWK/TIU/TKP), komponen ini masuk lebih dalam: topik APA di
 * dalam section itu yang paling lemah, diagregasi dari SEMUA attempt
 * user pada 1 program (lihat ExamController::topicPerformance()).
 *
 * programId wajib dan berasal dari 'preferred_program_id' di localStorage
 * (pola yang sama dipakai Beranda/Packages/ClassList). Kalau user pilih
 * "Semua Program" (nilai 'all') atau belum ada program terpilih, komponen
 * ini sengaja tidak fetch apa-apa (return null) -- backend butuh 1
 * program_id spesifik, mengagregasi lintas program tidak masuk akal
 * karena topik antar program konteksnya beda.
 *
 * Threshold warna: <50% dianggap lemah (merah), 50-74% cukup (kuning),
 * >=75% kuat (hijau) -- selaras dengan bahasa "kekuatan & kelemahan" di
 * judul widget, bukan pass/fail biner seperti PassingGradeStatus.
 */
const MAX_TOPICS_SHOWN = 5;

function levelColor(pct) {
  if (pct >= 75) return { bar: 'bg-success-600', text: 'text-success-700' };
  if (pct >= 50) return { bar: 'bg-warning-500', text: 'text-warning-700' };
  return { bar: 'bg-danger-600', text: 'text-danger-700' };
}

export default function TopicPerformanceWidget({ programId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (!programId || programId === 'all') {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrored(false);

    topicPerformanceService
      .getTopicPerformance(programId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [programId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-4 w-48 bg-slate-100 rounded mb-4" />
        <div className="h-3 w-full bg-slate-100 rounded mb-2" />
        <div className="h-3 w-2/3 bg-slate-100 rounded" />
      </div>
    );
  }

  // Tidak ada program terpilih, error, belum ada attempt sama sekali, atau
  // belum ada satupun topik yang punya data (soal belum ditag topik) --
  // semuanya kondisi "tidak ada apa-apa yang berguna ditampilkan", jadi
  // render null daripada placeholder kosong yang membingungkan.
  if (errored || !data || !data.topics || data.topics.length === 0) {
    return null;
  }

  const weakestTopics = data.topics.slice(0, MAX_TOPICS_SHOWN);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
        <Target size={13} />
        Peta Kekuatan & Kelemahan
      </div>
      <p className="text-sm text-slate-500 mb-5">
        Penguasaan topik dari seluruh latihan soal yang sudah kamu kerjakan.
      </p>

      <div className="space-y-4">
        {weakestTopics.map((topic) => {
          // Topik dengan sample terlalu kecil (lihat $minSample di backend)
          // tidak diberi persentase -- tampilkan sebagai "belum cukup data"
          // daripada angka yang bisa menyesatkan.
          if (!topic.has_enough_data) {
            return (
              <div key={topic.topic_id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{topic.topic_name}</p>
                    {topic.category?.name && (
                      <p className="text-xs text-slate-400 truncate">{topic.category.name}</p>
                    )}
                  </div>
                  <span className="text-xs font-medium text-neutral-400 shrink-0 ml-3">
                    Belum cukup data ({topic.total_count} soal)
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                  <div className="h-full rounded-full bg-neutral-200" style={{ width: '100%' }} />
                </div>
              </div>
            );
          }

          const colors = levelColor(topic.percentage ?? 0);

          return (
            <div key={topic.topic_id}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{topic.topic_name}</p>
                  {topic.category?.name && (
                    <p className="text-xs text-slate-400 truncate">{topic.category.name}</p>
                  )}
                </div>
                <span className="flex items-center gap-1.5 shrink-0 ml-3">
                  {topic.trend === 'up' && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-success-700">
                      <TrendingUp size={12} /> Membaik
                    </span>
                  )}
                  {topic.trend === 'down' && (
                    <span className="flex items-center gap-0.5 text-xs font-medium text-danger-700">
                      <TrendingDown size={12} /> Menurun
                    </span>
                  )}
                  <span className={`text-sm font-semibold tabular-nums ${colors.text}`}>
                    {topic.percentage}%
                  </span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${colors.bar}`}
                  style={{ width: `${Math.min(100, topic.percentage ?? 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {data.topics.length > MAX_TOPICS_SHOWN && (
        <p className="text-xs text-neutral-500 mt-4 flex items-center gap-1">
          <TrendingDown size={12} />
          Menampilkan {MAX_TOPICS_SHOWN} topik terlemah dari {data.topics.length} topik yang sudah dilatih.
        </p>
      )}
    </div>
  );
}
