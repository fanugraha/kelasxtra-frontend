import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, PlayCircle, RotateCw, Clock, ListChecks, BookOpen } from 'lucide-react';
import { packageService } from '../../services/packageService';
import { examService } from '../../services/examService';

export default function PackageExams() {
  const { packageId } = useParams();
  const navigate = useNavigate();

  const [pkg, setPkg] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // examId -> summary (minimal { in_progress_attempt_id })
  const [summaries, setSummaries] = useState({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      packageService.getPackage(packageId),
      packageService.listPackageExams(packageId),
    ])
      .then(([packageData, packageExams]) => {
        if (!active) return;
        setPkg(packageData);
        setExams(packageExams);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Gagal memuat daftar latihan soal.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [packageId]);

  // Cek status pengerjaan tiap exam (ada attempt yang masih berjalan atau belum),
  // supaya tombol bisa menyesuaikan: "Mulai" vs "Lanjutkan" — pola yang sama
  // dengan "Lanjutkan Belajar" di Beranda, dipakai ulang di sini per-card.
  useEffect(() => {
    if (exams.length === 0) return;
    let active = true;

    Promise.allSettled(
      exams.map((exam) =>
        examService.getExamSummary(exam.id).then((summary) => ({ id: exam.id, summary }))
      )
    ).then((results) => {
      if (!active) return;
      const map = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled') map[r.value.id] = r.value.summary;
      });
      setSummaries(map);
    });

    return () => { active = false; };
  }, [exams]);

  const totalQuestions = exams.reduce((sum, e) => sum + (e.questions_count || 0), 0);
  const totalDuration = exams.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="h-4 w-32 bg-slate-200 rounded mb-6 animate-pulse" />
        <div className="h-4 w-48 bg-slate-200 rounded mb-6 animate-pulse" />
        <div className="h-20 bg-white rounded-2xl border border-slate-200 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button
        onClick={() => navigate('/app/my-packages')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 mb-6 transition"
      >
        <ChevronLeft size={16} />
        Paket Belajar Saya
      </button>

      <h1 className="text-2xl font-bold text-slate-800 mb-4">Latihan Soal</h1>

      {/* Ringkasan paket — mengisi area yang sebelumnya kosong, sekaligus
          kasih konteks jumlah try out/soal/durasi sebelum user memilih. */}
      {pkg && (
        <div className="flex items-center gap-4 bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <span className="shrink-0 w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <BookOpen size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-800 truncate">{pkg.name}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <FileText size={12} />
                {exams.length} try out
              </span>
              <span className="flex items-center gap-1">
                <ListChecks size={12} />
                {totalQuestions} soal
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {totalDuration} menit total
              </span>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-danger-600 mb-4">{error}</p>}

      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <FileText className="mx-auto mb-3 text-slate-300" size={40} strokeWidth={1.5} />
          <p className="text-slate-500">Belum ada latihan soal yang tersedia untuk paket ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {exams.map((exam) => {
            const summary = summaries[exam.id];
            const isInProgress = Boolean(summary?.in_progress_attempt_id);

            return (
              <div
                key={exam.id}
                className={`relative bg-white rounded-2xl border p-6 flex flex-col transition hover:shadow-md ${
                  isInProgress ? 'border-warning-300' : 'border-slate-200 hover:border-brand-300'
                }`}
              >
                {isInProgress && (
                  <span className="absolute top-4 right-4 flex items-center gap-1 bg-warning-100 text-warning-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                    Sedang Dikerjakan
                  </span>
                )}

                <span className="shrink-0 w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
                  <FileText size={18} />
                </span>

                <h3 className="font-bold text-lg text-slate-800 mb-2 pr-24">
                  {exam.title}
                </h3>

                <div className="flex items-center gap-3 text-sm text-slate-500 mb-5">
                  <span className="flex items-center gap-1">
                    <Clock size={13} />
                    {exam.duration_minutes} menit
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1">
                    <ListChecks size={13} />
                    {exam.questions_count} soal
                  </span>
                </div>

                <button
                  onClick={() =>
                    isInProgress
                      ? navigate(`/app/exam/${summary.in_progress_attempt_id}`)
                      : navigate(`/app/exams/${exam.id}`)
                  }
                  className={`mt-auto w-full py-3 rounded-lg text-white font-semibold text-sm flex items-center justify-center gap-2 transition ${
                    isInProgress
                      ? 'bg-amber-500 hover:bg-amber-600'
                      : 'bg-brand-700 hover:bg-brand-800'
                  }`}
                >
                  {isInProgress ? <RotateCw size={17} /> : <PlayCircle size={18} />}
                  {isInProgress ? 'Lanjutkan' : 'Mulai'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}