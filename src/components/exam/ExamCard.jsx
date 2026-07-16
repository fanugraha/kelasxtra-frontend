import { FileText, Clock, ListChecks, PlayCircle, RotateCw, Eye, CheckCircle2, XCircle } from 'lucide-react';

/**
 * Card exam individual — dipisah dari PackageExams.jsx supaya:
 * - bisa dipakai ulang di halaman lain (mis. Beranda / Rekomendasi Untukmu)
 * - gampang diubah desainnya tanpa menyentuh logic fetching di parent
 *
 * Props:
 * - exam: { id, title, duration_minutes, questions_count, passing_score, is_free_preview }
 *   -> field ini persis yang dikembalikan ExamController::forPackage()
 * - summary: hasil ExamController::summary() untuk exam ini, bentuknya:
 *   { in_progress_attempt_id, attempts_count, latest_attempt: { attempt_id, score, correct_count, passed } | null }
 * - onStart: () => void         — mulai attempt baru
 * - onContinue: (attemptId) => void   — lanjutkan attempt in-progress
 * - onReview: (attemptId) => void     — lihat hasil/pembahasan attempt terakhir
 * - simpleAction: boolean       — kalau true, card ini SELALU cuma tampilkan
 *   1 tombol "Buka Paket" apapun state-nya (baru/sedang/selesai), yang
 *   membawa siswa ke halaman detail exam dulu (ExamDetail.jsx) untuk lihat
 *   riwayat nilai & pilih Lanjutkan/Ulangi/Pembahasan di sana. Dipakai di
 *   halaman package (PackageExams.jsx) supaya card di situ murni jadi pintu
 *   masuk, bukan tempat aksi langsung. Default false supaya pemakaian di
 *   tempat lain (mis. Beranda) tetap seperti semula.
 */
export default function ExamCard({ exam, summary, onStart, onContinue, onReview, simpleAction = false }) {
    const inProgressId = summary?.in_progress_attempt_id;
    const latest = summary?.latest_attempt;

    // 3 state: belum pernah dikerjakan / sedang dikerjakan / sudah pernah selesai
    const state = inProgressId ? 'in_progress' : latest ? 'completed' : 'new';

    return (
        <div className="group bg-white rounded-2xl border border-neutral-100 overflow-hidden flex flex-col transition hover:shadow-lg hover:-translate-y-0.5 animate-fade-slide-up">
            {/* Banner */}
            <div className="relative h-32 bg-gradient-to-br from-brand-600 to-brand-700 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_20%_20%,white,transparent_35%)]" />
                <FileText size={40} className="text-white/90 relative z-10" strokeWidth={1.5} />

                {exam.is_free_preview && (
                    <span className="absolute top-3 left-3 bg-success-100 text-success-700 text-[11px] font-semibold px-2.5 py-1 rounded-full z-10">
                        Gratis
                    </span>
                )}

                {state === 'in_progress' && (
                    <span className="absolute top-3 right-3 flex items-center gap-1 bg-warning-100 text-warning-700 text-[11px] font-semibold px-2.5 py-1 rounded-full z-10">
                        Sedang Dikerjakan
                    </span>
                )}

                {state === 'completed' && (
                    <span
                        className={`absolute top-3 right-3 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full z-10 ${latest.passed ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
                            }`}
                    >
                        {latest.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {latest.passed ? 'Lulus' : 'Belum Lulus'}
                    </span>
                )}
            </div>

            {/* Body */}
            <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-slate-800 mb-3 line-clamp-2 min-h-[3rem]">
                    {exam.title}
                </h3>

                <div className="flex items-center gap-3 text-sm text-neutral-500 mb-3">
                    <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {exam.duration_minutes} menit
                    </span>
                    <span className="text-neutral-300">·</span>
                    <span className="flex items-center gap-1">
                        <ListChecks size={13} />
                        {exam.questions_count} soal
                    </span>
                </div>

                {/* Skor terakhir — hanya muncul kalau sudah pernah diselesaikan */}
                {state === 'completed' && (
                    <div className="flex items-center justify-between bg-neutral-100 rounded-lg px-3 py-2 mb-4 text-sm">
                        <span className="text-slate-600">Skor terakhir</span>
                        <span className="font-bold text-slate-800">
                            {latest.score}
                            {exam.passing_score != null && (
                                <span className="font-normal text-neutral-500"> / min. {exam.passing_score}</span>
                            )}
                        </span>
                    </div>
                )}

                <div className="mt-auto flex gap-2">
                    {state === 'new' && (
                        <button
                            onClick={onStart}
                            className="w-full py-3 rounded-full text-white font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] bg-brand-600 hover:bg-brand-700"
                        >
                            <PlayCircle size={18} />
                            Buka Paket
                        </button>
                    )}

                    {state === 'in_progress' && (
                        <button
                            onClick={simpleAction ? onStart : () => onContinue(inProgressId)}
                            className="w-full py-3 rounded-full text-white font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] bg-warning-600 hover:bg-warning-700"
                        >
                            <RotateCw size={17} />
                            {simpleAction ? 'Buka Paket' : 'Lanjutkan'}
                        </button>
                    )}

                    {state === 'completed' && simpleAction && (
                        <button
                            onClick={onStart}
                            className="w-full py-3 rounded-full text-white font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] bg-brand-600 hover:bg-brand-700"
                        >
                            <PlayCircle size={18} />
                            Buka Paket
                        </button>
                    )}

                    {state === 'completed' && !simpleAction && (
                        <>
                            <button
                                onClick={() => onReview(latest.attempt_id)}
                                className="flex-1 py-3 rounded-full text-brand-600 border border-brand-200 font-semibold text-sm flex items-center justify-center gap-2 transition hover:bg-brand-50"
                            >
                                <Eye size={16} />
                                Lihat Hasil
                            </button>
                            <button
                                onClick={onStart}
                                className="flex-1 py-3 rounded-full text-white font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98] bg-brand-600 hover:bg-brand-700"
                            >
                                <RotateCw size={16} />
                                Ulangi
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}