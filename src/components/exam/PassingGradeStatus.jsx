import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, MinusCircle, ShieldCheck } from 'lucide-react';
import { examService } from '../../services/examService';

/**
 * Status Passing Grade — melengkapi (bukan menggantikan) Leaderboard Mingguan.
 * Leaderboard jawab "aku rangking berapa dibanding orang lain" (relatif).
 * Komponen ini jawab "apa aku sudah memenuhi syarat minimal kelulusan"
 * (absolut) — supaya siswa yang rangkingnya rendah tapi sudah lolos ambang
 * batas nasional tetap dapat sinyal "kamu sudah aman di bagian ini", bukan
 * cuma sinyal cemas dari leaderboard.
 *
 * Sengaja TIDAK melakukan fetch exam_id sendiri -- menerima examId dari
 * parent (Beranda.jsx sudah resolve via examService.getLatestAttemptedExam()
 * untuk WeeklyLeaderboardHero), supaya tidak ada request duplikat ke
 * /my-exams/latest-attempted.
 *
 * min_passing_score per section diisi admin dari Filament (SectionsRelationManager)
 * sesuai Kepmen PANRB yang berlaku (mis. TWK 65, TIU 80, TKP 166 utk formasi umum).
 * Section tanpa min_passing_score diisi (null) otomatis disembunyikan dari sini,
 * karena tidak ada ambang batas yang bisa dibandingkan.
 */
export default function PassingGradeStatus({ examId, resolvingExamId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    if (resolvingExamId) return;

    if (!examId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrored(false);

    examService
      .getExamSummary(examId)
      .then((data) => {
        if (!cancelled) setSummary(data);
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
  }, [examId, resolvingExamId]);

  const latest = summary?.latest_attempt;
  // Cuma section yang punya ambang batas terisi yang relevan ditampilkan --
  // section tanpa min_passing_score (mis. exam lama / belum diisi admin)
  // tidak bisa dinilai lolos/belum, jadi disembunyikan daripada nampilin
  // status yang salah.
  const sections = (latest?.sections || []).filter((s) => s.min_passing_score != null);

  // Belum ada attempt sama sekali, masih resolving, error, atau tidak ada
  // section berambang-batas -- section ini tidak punya apa-apa yang berguna
  // untuk ditampilkan, jadi render null (Beranda tetap rapi, tidak ada
  // placeholder kosong yang membingungkan).
  if (resolvingExamId || loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 animate-pulse">
        <div className="h-4 w-40 bg-slate-100 rounded mb-4" />
        <div className="h-3 w-full bg-slate-100 rounded mb-2" />
        <div className="h-3 w-2/3 bg-slate-100 rounded" />
      </div>
    );
  }

  if (errored || !latest || sections.length === 0) {
    return null;
  }

  const allPassed = sections.every((s) => s.passed_threshold === true);

  return (
    <div>
      {/* Header tiket — pakai palet sesuai status keseluruhan, konsisten
          dengan motif boarding-pass di TransactionStatus.jsx */}
      <div
        className={`rounded-2xl border px-6 py-6 border-b-0 rounded-b-none ${
          allPassed
            ? 'bg-success-50 text-success-700 border-success-200'
            : 'bg-warning-50 text-warning-700 border-warning-200'
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
          <ShieldCheck size={13} />
          Status Passing Grade Nasional
        </div>
        <p className="text-sm mt-1 opacity-90">
          {allPassed
            ? 'Semua bagian sudah memenuhi ambang batas minimal.'
            : 'Masih ada bagian yang belum memenuhi ambang batas minimal.'}
        </p>
      </div>

      {/* Notch perforasi — motif sobekan tiket, sama seperti Ringkasan
          Pesanan di TransactionStatus.jsx */}
      <div className="relative bg-white border-x border-slate-200">
        <div className="absolute left-0 top-0 -translate-x-1/2 w-5 h-5 rounded-full bg-slate-50" />
        <div className="absolute right-0 top-0 translate-x-1/2 w-5 h-5 rounded-full bg-slate-50" />
        <div className="border-t border-dashed border-slate-200" />
      </div>

      <div className="rounded-2xl rounded-t-none border border-t-0 border-slate-200 bg-white p-6">
        <div className="space-y-4">
          {sections.map((section) => {
            const status = section.passed_threshold;
            const pct = Math.min(
              100,
              Math.round((section.raw_score / section.min_passing_score) * 100)
            );

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
    </div>
  );
}