const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function QuestionCard({
  question,
  questionNumber,
  selectedOptionId,
  essayAnswer,
  onSelectOption,
  onEssayChange,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <p className="text-sm font-semibold text-brand-600 mb-3">
        Soal Nomor {questionNumber}
      </p>

      <p className="text-slate-800 mb-6 leading-relaxed">
        {question.question_text}
      </p>

      {question.image_url && (
        <img
          src={question.image_url}
          alt="Ilustrasi soal"
          className="mb-6 rounded-lg max-w-full"
        />
      )}

      {question.type === 'pg' ? (
        <div className="space-y-3">
          {question.options.map((option, idx) => {
            const isSelected = selectedOptionId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectOption(option.id)}
                className={`w-full flex items-center gap-4 text-left rounded-xl px-5 py-4 border-2 transition ${
                  isSelected
                    ? 'bg-brand-50 border-brand-500 text-slate-800'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span
                  className={`font-bold w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {LETTERS[idx]}
                </span>
                <span className={isSelected ? 'font-medium' : ''}>{option.option_text}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <textarea
          value={essayAnswer || ''}
          onChange={(e) => onEssayChange(e.target.value)}
          rows={8}
          placeholder="Tulis jawaban Anda di sini..."
          className="w-full border border-slate-300 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      )}
    </div>
  );
}