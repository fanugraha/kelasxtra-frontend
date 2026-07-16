import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';
import { packageService } from '../../services/packageService';
import { examService } from '../../services/examService';
import ExamCard from '../../components/exam/ExamCard';
import PackageHero from '../../components/exam/PackageHero';

export default function PackageExams() {
  const { packageId } = useParams();
  const navigate = useNavigate();

  const [pkg, setPkg] = useState(null);
  // Tiap item = 1 card = 1 bank/part di dalam 1 exam (exam_id + bank_id),
  // bukan lagi 1 item per Exam record -- lihat ExamController::forPackage().
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // `${exam_id}-${bank_id}` -> summary (minimal { in_progress_attempt_id })
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

  // Cek status pengerjaan tiap card (exam+bank), supaya tombol bisa
  // menyesuaikan: "Buka Paket" vs "Lanjutkan" per-card.
  useEffect(() => {
    if (exams.length === 0) return;
    let active = true;

    Promise.allSettled(
      exams.map((item) =>
        examService
          .getExamSummary(item.exam_id, item.bank_id)
          .then((summary) => ({ key: `${item.exam_id}-${item.bank_id}`, summary }))
      )
    ).then((results) => {
      if (!active) return;
      const map = {};
      results.forEach((r) => {
        if (r.status === 'fulfilled') map[r.value.key] = r.value.summary;
      });
      setSummaries(map);
    });

    return () => { active = false; };
  }, [exams]);

  const totalDuration = exams.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="h-4 w-32 bg-neutral-100 rounded mb-6 animate-pulse" />
        <div className="h-4 w-48 bg-neutral-100 rounded mb-6 animate-pulse" />
        <div className="h-20 bg-white rounded-2xl border border-neutral-100 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 bg-white rounded-2xl border border-neutral-100 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <button
        onClick={() => navigate('/app/my-packages')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 mb-6 transition"
      >
        <ChevronLeft size={16} />
        Paket Belajar Saya
      </button>

      <PackageHero pkg={pkg} examsCount={exams.length} totalDuration={totalDuration} />

      <h2 className="text-xl font-bold text-slate-800 mb-4">Latihan Soal</h2>

      {error && <p className="text-sm text-danger-600 mb-4">{error}</p>}

      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-neutral-100 p-10 text-center">
          <FileText className="mx-auto mb-3 text-neutral-300" size={40} strokeWidth={1.5} />
          <p className="text-neutral-500">Belum ada latihan soal yang tersedia untuk paket ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((item) => {
            const key = `${item.exam_id}-${item.bank_id}`;
            // bank_id ikut di URL supaya ExamDetail tahu part mana yang dipilih
            // dan bisa langsung mulai tanpa nanya ulang lewat modal.
            const examUrl = item.bank_id
              ? `/app/exams/${item.exam_id}?bank=${item.bank_id}`
              : `/app/exams/${item.exam_id}`;

            return (
              <ExamCard
                key={key}
                exam={{
                  id: item.exam_id,
                  title: item.title,
                  duration_minutes: item.duration_minutes,
                  questions_count: item.questions_count,
                  passing_score: item.passing_score,
                  is_free_preview: item.is_free_preview,
                }}
                summary={summaries[key]}
                simpleAction
                onStart={() => navigate(examUrl)}
                onContinue={(attemptId) => navigate(`/app/exam/${attemptId}`)}
                onReview={(attemptId) => navigate(`/app/exam-attempts/${attemptId}/review`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}