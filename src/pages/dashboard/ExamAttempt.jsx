import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examService } from '../../services/examService';
import QuestionCard from '../../components/exam/QuestionCard';
import Timer from '../../components/exam/Timer';
import ProgressBar from '../../components/exam/ProgressBar';

export default function ExamAttempt() {
    const { attemptId } = useParams();
    const navigate = useNavigate();

    const [attempt, setAttempt] = useState(null);
    const [orderedQuestions, setOrderedQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [flagged, setFlagged] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [finishing, setFinishing] = useState(false);
    const [error, setError] = useState('');

    const saveTimeoutRef = useRef(null);
    const indexStorageKey = `exam_current_index_${attemptId}`;
    const flagStorageKey = `exam_flagged_${attemptId}`;

    useEffect(() => {
        loadAttempt();
    }, [attemptId]);

    useEffect(() => {
        if (orderedQuestions.length > 0) {
            localStorage.setItem(indexStorageKey, String(currentIndex));
        }
    }, [currentIndex, orderedQuestions.length, indexStorageKey]);

    useEffect(() => {
        if (orderedQuestions.length > 0) {
            localStorage.setItem(flagStorageKey, JSON.stringify(Array.from(flagged)));
        }
    }, [flagged, orderedQuestions.length, flagStorageKey]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && attempt?.status === 'in_progress') {
                examService.recordTabSwitch(attemptId).catch(() => { });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [attemptId, attempt?.status]);

    async function loadAttempt() {
        try {
            setLoading(true);
            const data = await examService.getAttempt(attemptId);
            applyAttemptData(data);
        } catch (err) {
            setError('Gagal memuat ujian. Attempt mungkin tidak ditemukan atau bukan milik Anda.');
        } finally {
            setLoading(false);
        }
    }

    function applyAttemptData(data) {
        setAttempt(data);

        if (data.status !== 'in_progress') {
            localStorage.removeItem(indexStorageKey);
            localStorage.removeItem(flagStorageKey);
            const backUrl = data.bank_id
                ? `/app/exams/${data.exam_id}?bank=${data.bank_id}`
                : `/app/exams/${data.exam_id}`;
            navigate(backUrl, { replace: true });
            return;
        }

        const restoredAnswers = {};
        (data.answers || []).forEach((a) => {
            restoredAnswers[a.question_id] =
                a.essay_answer !== null && a.essay_answer !== undefined
                    ? { essay_answer: a.essay_answer }
                    : { selected_option_id: a.selected_option_id };
        });
        setAnswers(restoredAnswers);

        const order = data.question_order;
        const questionMap = new Map(data.questions.map((q) => [q.id, q]));

        const optionOrderMap = new Map(
            (order.options || []).map((entry) => [entry.question_id, entry.option_ids])
        );

        const ordered = order.questions.map((qId) => {
            const q = questionMap.get(qId);
            if (q.type !== 'pg') return q;

            const optionOrder = optionOrderMap.get(qId) || [];
            const optionMap = new Map(q.options.map((o) => [o.id, o]));
            const orderedOptions = optionOrder.map((oId) => optionMap.get(oId)).filter(Boolean);

            return { ...q, options: orderedOptions };
        });

        setOrderedQuestions(ordered);

        const savedIndexRaw = localStorage.getItem(indexStorageKey);
        const savedIndex = savedIndexRaw !== null ? parseInt(savedIndexRaw, 10) : 0;
        const validIndex =
            !Number.isNaN(savedIndex) && savedIndex >= 0 && savedIndex < ordered.length
                ? savedIndex
                : 0;
        setCurrentIndex(validIndex);

        try {
            const savedFlagsRaw = localStorage.getItem(flagStorageKey);
            if (savedFlagsRaw) setFlagged(new Set(JSON.parse(savedFlagsRaw)));
        } catch {
            // ignore corrupted flag storage
        }
    }

    const currentQuestion = orderedQuestions[currentIndex];
    const answeredQuestionIds = new Set(Object.keys(answers).map(Number));
    const answeredCount = answeredQuestionIds.size;
    const totalCount = orderedQuestions.length;

    function saveAnswerDebounced(questionId, answerPayload) {
        setAnswers((prev) => ({ ...prev, [questionId]: answerPayload }));

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            examService.submitAnswer(attemptId, questionId, answerPayload).catch(() => {
                setError('Gagal menyimpan jawaban. Periksa koneksi Anda.');
            });
        }, 600);
    }

    function handleSelectOption(optionId) {
        saveAnswerDebounced(currentQuestion.id, { selected_option_id: optionId });
    }

    function handleEssayChange(text) {
        saveAnswerDebounced(currentQuestion.id, { essay_answer: text });
    }

    function toggleFlag() {
        if (!currentQuestion) return;
        setFlagged((prev) => {
            const next = new Set(prev);
            if (next.has(currentQuestion.id)) next.delete(currentQuestion.id);
            else next.add(currentQuestion.id);
            return next;
        });
    }

    function goNext() {
        if (currentIndex < orderedQuestions.length - 1) setCurrentIndex((i) => i + 1);
    }

    function goPrev() {
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
    }

    const handleExpire = useCallback(async () => {
        try {
            await examService.finishExam(attemptId);
        } finally {
            localStorage.removeItem(indexStorageKey);
            localStorage.removeItem(flagStorageKey);
            const backUrl = attempt.bank_id
                ? `/app/exams/${attempt.exam_id}?bank=${attempt.bank_id}`
                : `/app/exams/${attempt.exam_id}`;
            navigate(backUrl, { replace: true });
        }
    }, [attemptId, navigate, indexStorageKey, flagStorageKey, attempt]);

    async function handleFinish() {
        const unanswered = totalCount - answeredCount;
        const confirmMsg =
            unanswered > 0
                ? `Masih ada ${unanswered} soal yang belum dijawab. Yakin ingin menyelesaikan ujian sekarang? Jawaban tidak bisa diubah lagi setelah ini.`
                : 'Yakin ingin menyelesaikan ujian sekarang? Jawaban tidak bisa diubah lagi setelah ini.';

        if (!confirm(confirmMsg)) {
            return;
        }
        setFinishing(true);
        try {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
                const lastQ = currentQuestion;
                if (lastQ && answers[lastQ.id]) {
                    await examService.submitAnswer(attemptId, lastQ.id, answers[lastQ.id]);
                }
            }
            await examService.finishExam(attemptId);
            localStorage.removeItem(indexStorageKey);
            localStorage.removeItem(flagStorageKey);
            const backUrl = attempt.bank_id
                ? `/app/exams/${attempt.exam_id}?bank=${attempt.bank_id}`
                : `/app/exams/${attempt.exam_id}`;
            navigate(backUrl, { replace: true });
        } catch (err) {
            setError('Gagal menyelesaikan ujian. Coba lagi.');
            setFinishing(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-500">Memuat ujian...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-sm">
                    <p className="text-danger-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/app/dashboard')}
                        className="text-brand-600 font-medium hover:underline"
                    >
                        Kembali ke Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!currentQuestion) return null;

    const currentAnswer = answers[currentQuestion.id];
    const isCurrentFlagged = flagged.has(currentQuestion.id);

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold text-brand-600 mb-1">Tryout</p>
                                <h1 className="text-xl font-bold text-slate-800">
                                    {attempt.title || 'Latihan Soal'}
                                </h1>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-semibold text-slate-700">
                                    {answeredCount}/{totalCount} soal terjawab
                                </p>
                                <div className="w-32 h-2 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                    <div
                                        className="h-full bg-brand-500 rounded-full transition-all"
                                        style={{ width: `${totalCount ? (answeredCount / totalCount) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <QuestionCard
                        question={currentQuestion}
                        questionNumber={currentIndex + 1}
                        selectedOptionId={currentAnswer?.selected_option_id}
                        essayAnswer={currentAnswer?.essay_answer}
                        onSelectOption={handleSelectOption}
                        onEssayChange={handleEssayChange}
                    />

                    <div className="flex justify-between items-center">
                        <button
                            onClick={goPrev}
                            disabled={currentIndex === 0}
                            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 font-medium disabled:opacity-40"
                        >
                            Sebelumnya
                        </button>

                        <button
                            onClick={toggleFlag}
                            className={`px-4 py-2.5 rounded-lg border font-medium text-sm transition ${isCurrentFlagged
                                ? 'border-amber-400 bg-amber-50 text-amber-700'
                                : 'border-slate-300 text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            {isCurrentFlagged ? '★ Ditandai' : '☆ Tandai ragu-ragu'}
                        </button>

                        {currentIndex === orderedQuestions.length - 1 ? (
                            <button
                                onClick={handleFinish}
                                disabled={finishing}
                                className="px-6 py-2.5 rounded-lg bg-success-600 text-white font-semibold hover:bg-success-700 disabled:opacity-50"
                            >
                                {finishing ? 'Menyimpan...' : 'Selesai & Kumpulkan'}
                            </button>
                        ) : (
                            <button
                                onClick={goNext}
                                className="px-6 py-2.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700"
                            >
                                Soal Selanjutnya
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <Timer remainingSeconds={attempt.remaining_seconds} onExpire={handleExpire} />

                    <ProgressBar
                        questions={orderedQuestions}
                        currentIndex={currentIndex}
                        answeredQuestionIds={answeredQuestionIds}
                        flaggedQuestionIds={flagged}
                        onJumpTo={setCurrentIndex}
                    />

                    <button
                        onClick={handleFinish}
                        disabled={finishing}
                        className="w-full py-3 rounded-lg border-2 border-danger-200 bg-white text-danger-700 font-semibold hover:bg-danger-50 disabled:opacity-50 transition"
                    >
                        Akhiri Ujian
                    </button>
                </div>
            </div>
        </div>
    );
}