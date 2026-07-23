import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Bookmark, TrendingUp, Sparkles } from 'lucide-react';
import { examService } from '../../services/examService';

const FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'wrong', label: 'Salah' },
  { key: 'correct', label: 'Benar' },
  { key: 'unanswered', label: 'Kosong' },
  { key: 'flagged', label: 'Ditandai' },
];

// renders **bold** segments as <strong> so key terms in an explanation
// (pasal, istilah penting, dsb) stand out without touching the backend content format
function ExplanationText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold text-slate-800">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

function ExamReviewSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-6 animate-pulse">
      <div className="flex items-center gap-1 mb-4">
        <ChevronLeft size={16} className="text-slate-200" />
        <div className="h-4 w-40 bg-slate-100 rounded" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-32 bg-slate-100 rounded" />
              <div className="h-6 w-24 bg-slate-100 rounded-full" />
            </div>
            <div className="h-4 w-full bg-slate-100 rounded mb-2" />
            <div className="h-4 w-2/3 bg-slate-100 rounded mb-5" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-slate-100" />
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="h-4 w-40 bg-slate-100 rounded mb-4" />
            <div className="h-3 w-full bg-slate-100 rounded mb-2" />
            <div className="h-3 w-full bg-slate-100 rounded mb-2" />
            <div className="h-3 w-3/4 bg-slate-100 rounded mb-5" />
            <div className="h-4 w-48 bg-slate-100 rounded mt-4 pt-4 border-t border-slate-100" />
          </div>
        </div>

        {/* RIGHT COLUMN / SIDEBAR */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="mb-4 pb-4 border-b border-slate-100">
            <div className="h-4 w-24 bg-slate-100 rounded mb-2" />
            <div className="h-7 w-32 bg-slate-100 rounded mb-2" />
            <div className="h-3 w-40 bg-slate-100 rounded" />
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 w-16 bg-slate-100 rounded-full" />
            ))}
          </div>

          <div className="h-4 w-24 bg-slate-100 rounded mb-3" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-slate-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExamReview() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [flagged, setFlagged] = useState(() => new Set());
  const [visible, setVisible] = useState(false);

  const activeBtnRef = useRef(null);

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

    // restore flags saved locally for this attempt so "tandai untuk dipelajari ulang" persists across visits
    try {
      const saved = localStorage.getItem(`exam-review-flags:${attemptId}`);
      if (saved) setFlagged(new Set(JSON.parse(saved)));
    } catch {
      // ignore malformed/unavailable storage
    }

    return () => { active = false; };
  }, [attemptId]);

  // auto-scroll the active question button into view inside the grid
  useEffect(() => {
    activeBtnRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // subtle fade-in on the pembahasan card whenever the active question changes,
  // small micro-reward moment instead of content just snapping into place
  useEffect(() => {
    setVisible(false);
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [activeIndex]);

  const toggleFlag = (questionId) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      try {
        localStorage.setItem(`exam-review-flags:${attemptId}`, JSON.stringify([...next]));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // weakest topic breakdown — dihitung dari `sub_topic` (Topic model, granular
  // per sub-materi), BUKAN `topic` (itu nama kategori/section, mis. "Tes
  // Wawasan Kebangsaan" -- hampir selalu sama untuk semua soal dalam 1 exam,
  // jadi tidak berguna sebagai breakdown). Degradasi otomatis kalau soal
  // belum ditag sub_topic sama sekali (lihat hasSubTopics).
  const topicInsight = useMemo(() => {
    if (!data) return null;
    const { questions } = data;
    const hasSubTopics = questions.some((q) => q.sub_topic);
    if (!hasSubTopics) return null;

    const byTopic = {};
    questions.forEach((q) => {
      const topicName = q.sub_topic?.name || 'Belum Ditag';
      if (!byTopic[topicName]) byTopic[topicName] = { wrong: 0, total: 0 };
      byTopic[topicName].total += 1;
      if (q.selected_option_id != null && !q.is_correct) byTopic[topicName].wrong += 1;
    });

    const weakest = Object.entries(byTopic)
      .filter(([, v]) => v.wrong > 0)
      .sort((a, b) => b[1].wrong / b[1].total - a[1].wrong / a[1].total)[0];

    if (!weakest) return null;
    const [topic, stats] = weakest;
    return { topic, ...stats };
  }, [data]);

  if (loading) {
    return <ExamReviewSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p className="text-danger-600">{error || 'Pembahasan tidak ditemukan.'}</p>
      </div>
    );
  }

  const { exam_title, questions, previous_correct_count } = data;
  const current = questions[activeIndex];
  const isLastQuestion = activeIndex === questions.length - 1;

  const answeredCount = questions.filter((q) => q.selected_option_id != null).length;
  const correctCount = questions.filter((q) => q.is_correct).length;
  const wrongCount = questions.filter((q) => q.selected_option_id != null && !q.is_correct).length;
  const unansweredCount = questions.length - answeredCount;

  const scoreDelta = typeof previous_correct_count === 'number' ? correctCount - previous_correct_count : null;

  const filterCounts = {
    all: questions.length,
    wrong: wrongCount,
    correct: correctCount,
    unanswered: unansweredCount,
    flagged: flagged.size,
  };

  const filteredIndices = questions
    .map((q, i) => i)
    .filter((i) => {
      const q = questions[i];
      if (filter === 'wrong') return q.selected_option_id != null && !q.is_correct;
      if (filter === 'correct') return q.is_correct;
      if (filter === 'unanswered') return q.selected_option_id == null;
      if (filter === 'flagged') return flagged.has(q.question_id);
      return true;
    });

  const goTo = (i) => setActiveIndex(Math.max(0, Math.min(questions.length - 1, i)));

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 mb-4"
      >
        <ChevronLeft size={16} />
        {exam_title}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-500">
                  Soal Nomor {activeIndex + 1} ({current.type === 'pg' ? 'PG' : 'Essay'})
                </p>
                {current.category && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {current.category.code ? `${current.category.code} · ${current.category.name}` : current.category.name}
                  </span>
                )}
                {current.sub_topic && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600">
                    {current.sub_topic.name}
                  </span>
                )}
              </div>

              {/* flag-to-review: lets the user mark a question for restudy independent of
                  whether they got it right, e.g. answered correctly but only guessed */}
              <button
                onClick={() => toggleFlag(current.question_id)}
                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                  flagged.has(current.question_id)
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                <Bookmark size={12} fill={flagged.has(current.question_id) ? 'currentColor' : 'none'} />
                {flagged.has(current.question_id) ? 'Ditandai' : 'Tandai untuk dipelajari ulang'}
              </button>
            </div>

            {current.media_type === 'audio' && current.media_url && (
              <audio controls className="w-full mb-4">
                <source src={current.media_url} />
              </audio>
            )}
            {current.media_type === 'image' && current.media_url && (
              <img src={current.media_url} alt="" className="max-w-full rounded-lg mb-4" />
            )}

            <div
                className="question-content text-slate-800 mb-5"
                dangerouslySetInnerHTML={{ __html: current.question_text }}
              />

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
                    <span className="pt-0.5 flex flex-col gap-2">
                      {opt.image_url && (
                        <img
                          src={opt.image_url}
                          alt={`Opsi ${String.fromCharCode(65 + i)}`}
                          className="max-h-32 rounded-lg border border-slate-200 object-contain"
                        />
                      )}
                      {opt.option_text && <span>{opt.option_text}</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* pembahasan card fades in on question change instead of snapping, and leads with
              the concept explanation before the verdict badge so it reads as teaching first,
              judging second */}
          <div
            className={`bg-white rounded-xl border border-slate-200 p-6 transition-opacity duration-300 ${
              visible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <p className="font-semibold text-slate-800 mb-3">
              Pembahasan Nomor {activeIndex + 1}
            </p>

            {current.explanation ? (
              <ExplanationText text={current.explanation} />
            ) : (
              <p className="text-sm text-slate-400 italic">Pembahasan belum tersedia untuk soal ini.</p>
            )}

            <p className="text-sm text-slate-500 mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
              Jawaban kamu:{' '}
              {current.selected_option_id ? (
                <>
                  <span className="font-semibold text-slate-700">
                    {String.fromCharCode(65 + current.options.findIndex((o) => o.id === current.selected_option_id))}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                      current.is_correct ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
                    }`}
                  >
                    {current.is_correct ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {current.is_correct ? 'Benar' : 'Perlu ditinjau lagi'}
                  </span>
                </>
              ) : (
                <span className="italic text-slate-400">Tidak dijawab</span>
              )}
            </p>

            {/* prev / next navigation so users don't have to jump back to the sidebar */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
              <button
                onClick={() => goTo(activeIndex - 1)}
                disabled={activeIndex === 0}
                className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-slate-600"
              >
                <ChevronLeft size={16} />
                Sebelumnya
              </button>
              <button
                onClick={() => goTo(activeIndex + 1)}
                disabled={isLastQuestion}
                className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-brand-600 disabled:opacity-30 disabled:hover:text-slate-600"
              >
                Berikutnya
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* end-of-review CTA: keeps momentum going instead of leaving the user at a dead end
              once they've reached the last question */}
          {isLastQuestion && (
            <div className="bg-brand-50 rounded-xl border border-brand-200 p-6 text-center">
              <Sparkles className="mx-auto mb-2 text-brand-600" size={20} />
              <p className="font-semibold text-slate-800 mb-1">Kamu sudah sampai soal terakhir</p>
              <p className="text-sm text-slate-600 mb-4">
                {wrongCount > 0
                  ? `Ada ${wrongCount} soal yang masih perlu dipelajari ulang. Yuk latihan lagi supaya makin siap.`
                  : 'Semua soal terjawab dengan benar. Lanjutkan ke paket latihan berikutnya untuk terus mengasah kemampuanmu.'}
              </p>
              <button className="bg-brand-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-brand-700">
                Latihan topik yang masih lemah
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN / SIDEBAR */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] flex flex-col">
          {/* summary - fixed, never scrolls */}
          <div className="mb-4 pb-4 border-b border-slate-100 shrink-0">
            <p className="text-sm font-semibold text-slate-700 mb-1">Ringkasan</p>
            <p className="text-2xl font-bold text-slate-800">
              {correctCount}<span className="text-base font-medium text-slate-400"> / {questions.length} benar</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{answeredCount} dari {questions.length} soal dijawab</p>

            {/* progress vs previous attempt — only shows when the API provides a comparable score,
                gives a sense of momentum rather than a bare, one-off number */}
            {scoreDelta !== null && (
              <p className={`text-xs mt-2 flex items-center gap-1 font-medium ${
                scoreDelta > 0 ? 'text-success-700' : scoreDelta < 0 ? 'text-danger-600' : 'text-slate-500'
              }`}>
                {scoreDelta > 0 && <TrendingUp size={13} />}
                {scoreDelta > 0
                  ? `Naik ${scoreDelta} poin dari percobaan sebelumnya`
                  : scoreDelta < 0
                  ? `Turun ${Math.abs(scoreDelta)} poin dari percobaan sebelumnya`
                  : 'Sama seperti percobaan sebelumnya'}
              </p>
            )}

            {/* weakest-topic insight — gives direction for what to study next instead of just a score */}
            {topicInsight && (
              <p className="text-xs mt-2 text-slate-500">
                Paling sering keliru di topik{' '}
                <span className="font-semibold text-slate-700">{topicInsight.topic}</span>{' '}
                ({topicInsight.wrong} dari {topicInsight.total} salah)
              </p>
            )}
          </div>

          {/* filter chips - fixed */}
          <div className="flex flex-wrap gap-1.5 mb-3 shrink-0">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  filter === key
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {label} <span className="opacity-70">({filterCounts[key]})</span>
              </button>
            ))}
          </div>

          <p className="text-sm font-semibold text-slate-700 mb-3 shrink-0">Daftar Soal</p>

          {/* only this grid scrolls, so the sidebar height stays in sync with the left column.
              flex-1 min-h-0 is required here: without min-h-0, a flex child defaults to
              min-height:auto and grows to fit its content instead of respecting the parent's
              max-height, which is exactly the overflow bug from the earlier screenshot. */}
          <div className="overflow-y-auto pr-1 -mr-1 flex-1 min-h-0">
            {filteredIndices.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-4 text-center">
                Tidak ada soal pada kategori ini.
              </p>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {filteredIndices.map((i) => {
                  const q = questions[i];
                  const answered = q.selected_option_id != null;
                  const correct = q.is_correct;
                  const isActive = i === activeIndex;
                  const isFlagged = flagged.has(q.question_id);

                  let style = 'bg-slate-100 text-slate-500';
                  if (answered) {
                    style = correct ? 'bg-success-600 text-white' : 'bg-danger-600 text-white';
                  }

                  return (
                    <button
                      key={q.question_id}
                      ref={isActive ? activeBtnRef : null}
                      onClick={() => setActiveIndex(i)}
                      className={`h-9 rounded-lg text-sm font-semibold relative ${style} ${
                        isActive ? 'outline outline-2 outline-offset-2 outline-brand-600' : ''
                      }`}
                    >
                      {i + 1}
                      {isFlagged && (
                        <Bookmark
                          size={10}
                          fill="currentColor"
                          className="absolute -top-1 -right-1 text-amber-500 bg-white rounded-full"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* legend - fixed, always visible */}
          <div className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500 shrink-0">
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
            <span className="flex items-center gap-2">
              <Bookmark size={12} fill="currentColor" className="text-amber-500 shrink-0" /> Ditandai untuk dipelajari ulang
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}