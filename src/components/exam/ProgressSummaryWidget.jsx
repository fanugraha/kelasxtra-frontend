import { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, Target, ArrowRight, Lock, Flame } from 'lucide-react';
import { performanceSummaryService } from '../../services/performanceSummaryService';

/**
 * Progress Belajar — versi ringkas. Sebelumnya widget ini punya 2 tab
 * (Ambang Batas + Peta Topik) dengan accordion penuh di dalamnya.
 * Sekarang disederhanakan jadi 1 baris ringkasan + tombol "Lihat Analisis
 * Lengkap" yang mengarah ke halaman detail /analisis-performa -- semua
 * kedalaman analisis (breakdown per topik, rekomendasi, dsb) pindah ke
 * sana. Prinsip: dashboard = peringatan dini, halaman detail = tempat
 * semua kedalaman analisis hidup.
 *
 * Sumber data tunggal: /me/performance-summary (PerformanceController).
 * Menggantikan 2 sumber data lama (examService.getExamSummary +
 * topicPerformanceService) -- endpoint baru sudah menyatukan section
 * pass/fail & topik terlemah dalam 1 response, jadi tidak lagi butuh
 * prop examId/resolvingExamId sama sekali.
 */
export default function ProgressSummaryWidget({ programId }) {
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

    performanceSummaryService
      .getPerformanceSummary(programId)
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
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-4 w-40 bg-slate-100 rounded mb-2" />
        <div className="h-3 w-2/3 bg-slate-100 rounded" />
      </div>
    );
  }

  if (errored || !data) {
    return null;
  }

  const detailLink = `/app/analisis-performa?program_id=${programId}`;

  // State kosong -- belum ada attempt sama sekali. Tampilkan CTA ke tryout
  // pertama, bukan card kosong yang membingungkan.
  if (data.state === 'no_attempts') {
    return (
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-slate-100">
            <Target size={17} className="text-slate-500" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Progress Belajar
            </div>
            <p className="text-sm font-medium mt-0.5 text-slate-700">
              {data.cta?.message || 'Kerjakan tryout pertamamu untuk melihat progress belajarmu'}
            </p>
          </div>
          <a
            href={data.cta?.action_link || `/app/packages?program_id=${programId}`}
            className="flex items-center gap-1 text-xs font-semibold text-brand-600 shrink-0"
          >
            Mulai Sekarang
            <ArrowRight size={14} />
          </a>
        </div>
      </div>
    );
  }

  const sections = data.sections || [];
  const sectionsWithThreshold = sections.filter((s) => s.min_passing_score != null);
  const hasSections = sectionsWithThreshold.length > 0;
  const allPassed = hasSections && sectionsWithThreshold.every((s) => s.status === 'passed');
  const failingSections = sectionsWithThreshold.filter((s) => s.status === 'not_passed');

  const isLocked = data.access && data.access.full === false;
  const weakest = !isLocked && data.top_recommendations?.length > 0 ? data.top_recommendations[0] : null;

  const summaryParts = [];
  if (hasSections) {
    summaryParts.push(
      allPassed
        ? 'Semua bagian sudah lolos ambang batas'
        : `Belum lolos ambang batas${failingSections.length ? ' · ' + failingSections.map((s) => s.name).join(', ') : ''}`
    );
  }
  if (weakest) {
    summaryParts.push(`Topik terlemah: ${weakest.topic_name}`);
  } else if (isLocked) {
    summaryParts.push('Buka paket untuk lihat analisis topik lengkap');
  }
  const summaryText = summaryParts.join(' · ') || 'Lihat progress belajarmu';

  const StatusIcon = isLocked ? Lock : hasSections ? (allPassed ? ShieldCheck : AlertTriangle) : Target;
  const statusColor = isLocked
    ? 'text-slate-500'
    : hasSections
      ? (allPassed ? 'text-success-700' : 'text-warning-700')
      : 'text-slate-700';
  const statusIconWrap = isLocked
    ? 'bg-slate-100'
    : hasSections
      ? (allPassed ? 'bg-success-50' : 'bg-warning-50')
      : 'bg-slate-100';
  const statusIconColor = isLocked
    ? 'text-slate-500'
    : hasSections
      ? (allPassed ? 'text-success-600' : 'text-warning-600')
      : 'text-slate-500';

  return (
    <a
      href={detailLink}
      className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 hover:bg-slate-50/60 transition"
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
      <span className="flex items-center gap-3 shrink-0">
        {data.streak?.count > 0 && (
          <span className="hidden sm:flex items-center gap-1 text-xs font-semibold text-warning-700 bg-warning-50 rounded-full px-2.5 py-1">
            <Flame size={12} />
            {data.streak.count} hari
          </span>
        )}
        <span className="flex items-center gap-1 text-xs font-semibold text-brand-600">
          Lihat Analisis Lengkap
          <ArrowRight size={14} />
        </span>
      </span>
    </a>
  );
}
