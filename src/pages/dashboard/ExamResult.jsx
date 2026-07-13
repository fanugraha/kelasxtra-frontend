import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../../services/examService';

const statusLabel = {
  submitted: 'Menunggu Penilaian',
  auto_submitted: 'Waktu Habis — Menunggu Penilaian',
  graded: 'Selesai Dinilai',
};

export default function ExamResult() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    examService
      .getAttempt(attemptId)
      .then(setAttempt)
      .catch(() => setError('Gagal memuat hasil ujian.'))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Memuat hasil...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-red-600">{error || 'Data tidak ditemukan.'}</p>
      </div>
    );
  }

  const isPending = attempt.has_pending_essay;
  const passed = attempt.status === 'graded' && attempt.score >= attempt.passing_score;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="bg-white rounded-2xl shadow-md p-10 max-w-md w-full text-center">
        <p className="text-sm text-slate-400 mb-2">
          {statusLabel[attempt.status] || attempt.status}
        </p>

        {attempt.status === 'graded' ? (
          <>
            <h1 className="text-5xl font-bold text-slate-800 mb-1">{attempt.score}</h1>
            <p className="text-slate-500 mb-6">
              {attempt.correct_count} jawaban benar · Passing score {attempt.passing_score}
            </p>
            <span
              className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${
                passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}
            >
              {passed ? 'Lulus' : 'Belum Lulus'}
            </span>
          </>
        ) : (
          <p className="text-slate-600 mb-6">
            {isPending
              ? 'Ujian Anda berisi soal essay yang sedang menunggu penilaian tutor. Skor akhir akan muncul setelah selesai dinilai.'
              : 'Ujian sedang diproses.'}
          </p>
        )}

        <button
          onClick={() => navigate('/app/dashboard')}
          className="mt-8 w-full bg-purple-600 text-white font-semibold py-2.5 rounded-lg hover:bg-purple-700"
        >
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}