export default function ProgressBar({ questions, currentIndex, answeredQuestionIds, flaggedQuestionIds, onJumpTo }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <p className="text-sm font-semibold text-slate-700 mb-3">Daftar Soal</p>

      <div className="grid grid-cols-5 gap-2 max-h-[420px] overflow-y-auto pr-1">
        {questions.map((q, index) => {
          const isAnswered = answeredQuestionIds.has(q.id);
          const isCurrent = index === currentIndex;
          const isFlagged = flaggedQuestionIds?.has(q.id);
          return (
            <button
              key={q.id}
              onClick={() => onJumpTo(index)}
              className={`aspect-square rounded-lg text-sm font-semibold flex items-center justify-center transition relative ${
                isCurrent
                  ? 'bg-warning-600 text-white'
                  : isAnswered
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {index + 1}
              {isFlagged && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border border-white" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-warning-600 inline-block" /> Soal aktif
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-brand-50 border border-brand-200 inline-block" /> Terjawab
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-100 border border-slate-200 inline-block" /> Belum dijawab
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Ditandai ragu-ragu
        </span>
      </div>
    </div>
  );
}