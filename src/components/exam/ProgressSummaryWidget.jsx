import { useEffect, useState } from 'react';
import {
  ShieldCheck, AlertTriangle, Target, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, MinusCircle, TrendingUp, TrendingDown,
} from 'lucide-react';
import { examService } from '../../services/examService';
import { topicPerformanceService } from '../../services/topicPerformanceService';

/**
 * Progress Belajar — widget gabungan dari PassingGradeStatus (status lolos
 * ambang batas nasional per section) dan TopicPerformanceWidget (peta
 * kekuatan/kelemahan per topik). Sebelumnya dua card penuh berdiri sendiri
 * di Beranda, membuat halaman terasa penuh; sekarang digabung jadi satu
 * widget collapsed-by-default dengan ringkasan satu baris, detail lengkap
 * (dua tab) tinggal expand di tempat tanpa pindah halaman.
 *
 * Melakukan fetch sendiri untuk kedua data (bukan reuse PassingGradeStatus /
 * TopicPerformanceWidget sebagai children) supaya ringkasan collapsed bisa
 * dibangun dari data yang sama tanpa fetch ganda saat expand.
 * PassingGradeStatus.jsx dan TopicPerformanceWidget.jsx dibiarkan ada
 * (tidak dihapus) untuk kemungkinan dipakai di halaman lain.
 */
const MAX_TOPICS_SHOWN = 5;

function levelInfo(pct) {
  if (pct >= 75) return { label: 'Sudah Kuat', bar: 'bg-success-600', text: 'text-success-700' };
  if (pct >= 50) return { label: 'Cukup', bar: 'bg-warning-500', text: 'text-warning-700' };
  return { label: 'Perlu Banyak Latihan', bar: 'bg-danger-600', text: 'text-danger-700' };
}

export default function ProgressSummaryWidget({ examId, resolvingExamId, programId }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryErrored, setSummaryErrored] = useState(false);

  const [topicData, setTopicData] = useState(null);
  const [topicLoading, setTopicLoading] = useState(true);
  const [topicErrored, setTopicErrored] = useState(false);

  useEffect(() => {
    if (resolvingExamId) return;

    if (!examId) {
      setSummaryLoading(false);
      return;
    }

    let cancelled = false;
    setSummaryLoading(true);
    setSummaryErrored(false);

    examService
      .getExamSummary(examId)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummaryErrored(true);
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [examId, resolvingExamId]);

  useEffect(() => {
    if (!programId || programId === 'all') {
      setTopicLoading(false);
      return;
    }

    let cancelled = false;
    setTopicLoading(true);
    setTopicErrored(false);

    topicPerformanceService
      .getTopicPerformance(programId)
      .then((res) => {
        if (!cancelled) setTopicData(res);
      })
      .catch(() => {
        if (!cancelled) setTopicErrored(true);
      })
      .finally(() => {
        if (!cancelled) setTopicLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [programId]);

  const stillResolving = resolvingExamId || summaryLoading || topicLoading;

  const latest = summary?.latest_attempt;
  const sections = (latest?.sections || []).filter((s) => s.min_passing_score != null);
  const hasPassingGradeContent = !summaryErrored && !!latest && sections.length > 0;
  const allPassed = hasPassingGradeContent && sections.every((s) => s.passed_threshold === true);
  const failingSections = sections.filter((s) => s.passed_threshold === false);

  const topics = topicData?.topics || [];
  const hasTopicContent = !topicErrored && topics.length > 0;
  const weakestTopic = topics.find((t) => t.has_enough_data) || null;
  const weakestTopicsShown = topics.slice(0, MAX_TOPICS_SHOWN);

  // Tab default: prioritaskan Ambang Batas kalau ada, kalau tidak baru Peta
  // Topik -- ditentukan sekali data siap, bukan ditebak dari useState awal.
  useEffect(() => {
    if (activeTab || stillResolving) return;
    if (hasPassingGradeContent) setActiveTab('passing_grade');
    else if (hasTopicContent) setActiveTab('topics');
  }, [activeTab, stillResolving, hasPassingGradeContent, hasTopicContent]);

  if (stillResolving) {
    return (
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-4 w-40 bg-slate-100 rounded mb-4" />
        <div className="h-3 w-full bg-slate-100 rounded mb-2" />
        <div className="h-3 w-2/3 bg-slate-100 rounded" />
      </div>
    );
  }

  // Tidak ada apa-apa yang berguna ditampilkan dari kedua sumber data --
  // render null daripada card kosong yang membingungkan.
  if (!hasPassingGradeContent && !hasTopicContent) {
    return null;
  }

  const summaryParts = [];
  if (hasPassingGradeContent) {
    summaryParts.push(
      allPassed
        ? 'Semua bagian sudah lolos ambang batas'
        : `Belum lolos ambang batas${failingSections.length ? ' · ' + failingSections.map((s) => s.name).join(', ') : ''}`
    );
  }
  if (hasTopicContent && weakestTopic) {
    summaryParts.push(`Topik terlemah: ${weakestTopic.topic_name} (${weakestTopic.percentage}%)`);
  }
  const summaryText = summaryParts.join(' · ') || 'Lihat progress belajarmu';

  const StatusIcon = hasPassingGradeContent ? (allPassed ? ShieldCheck : AlertTriangle) : Target;
  const statusColor = hasPassingGradeContent
    ? (allPassed ? 'text-success-700' : 'text-warning-700')
    : 'text-slate-700';
  const statusIconWrap = hasPassingGradeContent
    ? (allPassed ? 'bg-success-50' : 'bg-warning-50')
    : 'bg-slate-100';
  const statusIconColor = hasPassingGradeContent
    ? (allPassed ? 'text-success-600' : 'text-warning-600')
    : 'text-slate-500';

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-slate-50/60 transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${statusIconWrap}`}>
            <StatusIcon size={17} className={statusIconColor} />
          </span>
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Progress Belajar
            </div>
            <p className={`text-sm font-medium mt-0.5 truncate ${statusColor}`}>{summaryText}</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs font-semibold text-brand-600 shrink-0">
          {expanded ? 'Tutup' : 'Lihat Detail'}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-slate-200">
          <div className="flex gap-2 px-6 pt-4">
            {hasPassingGradeContent && (
              <button
                type="button"
                onClick={() => setActiveTab('passing_grade')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'passing_grade'
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Ambang Batas
              </button>
            )}
            {hasTopicContent && (
              <button
                type="button"
                onClick={() => setActiveTab('topics')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'topics' ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                Peta Topik
              </button>
            )}
          </div>

          {activeTab === 'passing_grade' && hasPassingGradeContent && (
            <div className="p-6 pt-4">
              <div className="space-y-4">
                {sections.map((section) => {
                  const status = section.passed_threshold;
                  const pct = Math.min(100, Math.round((section.raw_score / section.min_passing_score) * 100));

                  return (
                    <div key={section.code}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {status === true && <CheckCircle2 size={16} className="text-success-600 shrink-0" />}
                          {status === false && <XCircle size={16} className="text-danger-600 shrink-0" />}
                          {status == null && <MinusCircle size={16} className="text-neutral-400 shrink-0" />}
                          <span className="text-sm font-medium text-slate-800">{section.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-800 tabular-nums">
                          {section.raw_score}
                          <span className="text-slate-400 font-normal"> / min. {section.min_passing_score}</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            status === true ? 'bg-success-600' : status === false ? 'bg-danger-600' : 'bg-neutral-300'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-neutral-500 mt-5 leading-relaxed">
                Ambang batas mengacu pada Kepmen PANRB No. 321 Tahun 2024. Nilai ini
                dari percobaan latihan soal terakhirmu, terpisah dari ranking di
                Leaderboard Mingguan. Status ini menunjukkan hasil latihanmu di
                Kelasxtra, bukan jaminan kelulusan pada seleksi CPNS resmi.
              </p>
            </div>
          )}

          {activeTab === 'topics' && hasTopicContent && (
            <div className="p-6 pt-4">
              <p className="text-sm text-slate-500 mb-5">
                Penguasaan topik dari seluruh latihan soal yang sudah kamu kerjakan.
              </p>
              <div className="space-y-4">
                {weakestTopicsShown.map((topic, idx) => {
                  // Topik pertama di daftar (paling lemah, karena backend
                  // sudah mengurutkan dari yang terlemah) ditandai sebagai
                  // prioritas -- supaya walaupun semua topik terlihat
                  // "merah", user tetap tahu mana yang harus dikerjakan
                  // duluan alih-alih bingung memilih.
                  const isPriority = idx === 0;
                  const rowClass = isPriority ? 'pl-3 border-l-4 border-orange-400' : '';

                  if (!topic.has_enough_data) {
                    return (
                      <div key={topic.topic_id} className={rowClass}>
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

                  const info = levelInfo(topic.percentage ?? 0);

                  return (
                    <div key={topic.topic_id} className={rowClass}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{topic.topic_name}</p>
                          {topic.category?.name && (
                            <p className="text-xs text-slate-400 truncate">{topic.category.name}</p>
                          )}
                        </div>
                        {/* Label kualitatif jadi info utama -- user tidak perlu
                            menerjemahkan sendiri "3.3%" jadi "ini jelek".
                            Persentase presisi tetap ada tapi kecil & pudar
                            sebagai detail pendukung, bukan fokus utama. */}
                        <span className="text-right shrink-0 ml-3">
                          <span className={`block text-xs font-semibold ${info.text}`}>{info.label}</span>
                          <span className="block text-[11px] text-slate-400 tabular-nums mt-0.5">{topic.percentage}%</span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${info.bar}`}
                          style={{ width: `${Math.min(100, topic.percentage ?? 0)}%` }}
                        />
                      </div>
                      {(topic.trend === 'up' || topic.trend === 'down') && (() => {
                        const diff = Math.round(Math.abs(topic.recent_percentage - topic.percentage));
                        const isUp = topic.trend === 'up';
                        return (
                          <p className={`text-xs mt-1.5 flex items-center gap-1 ${isUp ? 'text-success-700' : 'text-danger-700'}`}>
                            {isUp ? <TrendingUp size={12} className="shrink-0" /> : <TrendingDown size={12} className="shrink-0" />}
                            {isUp ? 'Naik' : 'Turun'} {diff} poin dari latihan sebelumnya
                          </p>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>

              {topics.length > MAX_TOPICS_SHOWN && (
                <p className="text-xs text-neutral-500 mt-4">
                  Menampilkan {MAX_TOPICS_SHOWN} topik terlemah dari {topics.length} topik yang sudah dilatih.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
