import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ListChecks, Target, Sparkles, PlayCircle, BookOpen } from 'lucide-react';
import { examService } from '../../services/examService';
import ConfirmModal from '../../components/common/ConfirmModal';

export default function MyClasses() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);
  const [error, setError] = useState('');
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [pendingExamId, setPendingExamId] = useState(null);

  useEffect(() => {
    examService
      .listMyExams()
      .then(setExams)
      .catch(() => setError('Gagal memuat daftar kelas.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleStartExam(examId) {
    setStartingId(examId);
    setError('');
    try {
      const attempt = await examService.startExam(examId);
      navigate(`/app/exam/${attempt.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memulai ujian.');
      setStartingId(null);
    }
  }
  function openRulesModal(examId) {
    setPendingExamId(examId);
    setShowRulesModal(true);
  }

  function confirmStartExam() {
    setShowRulesModal(false);
    if (pendingExamId) {
      handleStartExam(pendingExamId);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="h-32 rounded-xl bg-brand-600 mb-6 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-xl bg-brand-600 px-6 py-8 mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Kelas Saya</h1>
        <p className="text-white/80 text-sm">Lanjutkan latihan soal dan try out yang sudah kamu buka.</p>
      </div>

      {error && <p className="text-sm text-danger-600 mb-4">{error}</p>}

      {exams.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <BookOpen className="mx-auto mb-3 text-slate-300" size={40} strokeWidth={1.5} />
          <p className="text-slate-500 mb-1">Belum ada kelas yang bisa diakses</p>
          <p className="text-sm text-slate-400 mb-5">
            Beli paket belajar untuk membuka akses latihan soal dan try out.
          </p>
          <button
            onClick={() => navigate('/app/packages')}
            className="bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-700 transition"
          >
            Lihat Paket Belajar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="font-semibold text-slate-800">{exam.title}</h2>
                {exam.is_free_preview && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-1 rounded-full flex-shrink-0">
                    <Sparkles size={12} />
                    Gratis
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-500 mb-5">
                <span className="flex items-center gap-1.5">
                  <Clock size={15} />
                  {exam.duration_minutes} menit
                </span>
                <span className="flex items-center gap-1.5">
                  <ListChecks size={15} />
                  {exam.questions_count} soal
                </span>
                <span className="flex items-center gap-1.5">
                  <Target size={15} />
                  Passing {exam.passing_score}
                </span>
              </div>

              <button
                onClick={() => openRulesModal(exam.id)}
                disabled={startingId === exam.id}
                className="mt-auto w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold py-2.5 rounded-lg hover:bg-brand-700 disabled:opacity-50 transition"
              >
                <PlayCircle size={18} />
                {startingId === exam.id ? 'Memulai...' : 'Mulai Ujian'}
              </button>
            </div>
          ))}
        </div>
      )}

      {showRulesModal && (
        <ConfirmModal
          title="Harap dibaca terlebih dahulu"
          rules={[
            'Pastikan kamu membuka website ini melalui browser (disarankan Chrome).',
            'Ketika kamu memulai ujian, timer akan berjalan otomatis dan tidak bisa ditunda, jadi siapkan waktu yang tepat.',
            'Jawaban akan otomatis tersimpan saat kamu memilih opsi atau menulis jawaban.',
            'Ketika waktu habis, jawaban akan otomatis terkirim.',
            'Hasil ujian bisa dilihat setelah ujian selesai atau diakhiri.',
          ]}
          confirmLabel="Mulai Sekarang"
          cancelLabel="Batal"
          onConfirm={confirmStartExam}
          onClose={() => setShowRulesModal(false)}
        />
      )}
    </div>
  );
}