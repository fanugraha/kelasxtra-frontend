import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, XCircle } from 'lucide-react';
import { examService } from '../../services/examService';

export default function ExamReview() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    examService.getAttemptReview(attemptId)
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Gagal memuat pembahasan.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [attemptId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6 animate-pulse space-y-4">
        <div className="h-4 w-32 bg-slate-200 rounded" />
        <div className="h-64 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p className="text-danger-600">{error || 'Pembahasan tidak ditemukan.'}</p>
      </div>
    );
  }

  const { exam_title, questions } = data;
  const current = questions[activeIndex];

  const answeredCount = questions.filter((q) => q.selected_option_id != null).length;
  const correctCount = questions.filter((q) => q.is_correct).length;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 mb-4"
      >
        <ChevronLeft size={16} />
        {exam_title}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-sm font-semibold text-slate-500 mb-2">
              Soal Nomor {activeIndex + 1} ({current.type === 'pg' ? 'PG' : 'Essay'})
            </p>

            {current.media_type === 'audio' && current.media_url && (
              <audio controls className="w-full mb-4">
                <source src={current.media_url} />
              </audio>
            )}
            {current.media_type === 'image' && current.media_url && (
              <img src={current.media_url} alt="" className="max-w-full rounded-lg mb-4" />
            )}

            <p className="text-slate-800 mb-5">{current.question_text}</p>

            <div className="space-y-2">
              {current.options.map((opt, i) => {
                const isSelected = opt.id === current.selected_option_id;
                const isCorrectOpt = opt.id === current.correct_option_id;

                let style = 'bg-white border-slate-200 text-slate-700';
                let badgeStyle = 'bg-slate-100 text-slate-500';

                if (isCorrectOpt) {
                  style = 'bg-success-50 border-success-400 text-slate-800';
                  badgeStyle = 'bg-success-600 text-white';
                } else if (isSelected && !isCorrectOpt) {
                  style = 'bg-danger-50 border-danger-400 text-slate-800';
                  badgeStyle = 'bg-danger-600 text-white';
                }

                return (
                  <div
                    key={opt.id}
                    className={`rounded-lg px-4 py-3 border-2 flex items-start gap-3 ${style}`}
                  >
                    <span className={`font-semibold shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm ${badgeStyle}`}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="pt-0.5">{opt.option_text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="font-semibold text-slate-800 mb-2">
              Pembahasan Nomor {activeIndex + 1}
            </p>

            <p className="text-sm text-slate-600 mb-3 flex items-center gap-2">
              Jawaban kamu:{' '}
              {current.selected_option_id ? (
                <>
                  <span className="font-semibold">
                    {String.fromCharCode(65 + current.options.findIndex((o) => o.id === current.selected_option_id))}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                      current.is_correct ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
                    }`}
                  >
                    {current.is_correct ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {current.is_correct ? 'Benar' : 'Salah'}
                  </span>
                </>
              ) : (
                <span className="italic text-slate-400">Tidak dijawab</span>
              )}
            </p>

            {current.explanation ? (
              <p className="text-sm text-slate-600 whitespace-pre-line">{current.explanation}</p>
            ) : (
              <p className="text-sm text-slate-400 italic">Pembahasan belum tersedia untuk soal ini.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 h-fit lg:sticky lg:top-6">
          <div className="mb-4 pb-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700 mb-1">Ringkasan</p>
            <p className="text-2xl font-bold text-slate-800">
              {correctCount}<span className="text-base font-medium text-slate-400"> / {questions.length} benar</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{answeredCount} dari {questions.length} soal dijawab</p>
          </div>

          <p className="text-sm font-semibold text-slate-700 mb-3">Daftar Soal</p>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, i) => {
              const answered = q.selected_option_id != null;
              const correct = q.is_correct;
              const isActive = i === activeIndex;

              let style = 'bg-slate-100 text-slate-500';
              if (answered) {
                style = correct ? 'bg-success-600 text-white' : 'bg-danger-600 text-white';
              }

              return (
                <button
                  key={q.question_id}
                  onClick={() => setActiveIndex(i)}
                  className={`h-9 rounded-lg text-sm font-semibold relative ${style} ${
                    isActive ? 'outline outline-2 outline-offset-2 outline-brand-600' : ''
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success-600 inline-block shrink-0" /> Jawaban benar
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-danger-600 inline-block shrink-0" /> Jawaban salah
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300 inline-block shrink-0" /> Tidak dijawab
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-brand-600 inline-block shrink-0" /> Soal yang dilihat
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}