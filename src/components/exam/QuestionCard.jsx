import { formatQuestionText } from '../../lib/formatQuestionText';
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
      <div className="flex items-center gap-2 mb-3">
        <p className="text-sm font-semibold text-brand-600">
          Soal Nomor {questionNumber}
        </p>
        {question.category && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {question.category.code ? `${question.category.code} · ${question.category.name}` : question.category.name}
          </span>
        )}
      </div>

      <div
          className="question-content text-slate-800 mb-6 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatQuestionText(question.question_text) }}
        />

      {question.media_type === 'audio' && question.media_url && (
        <audio controls className="w-full mb-6">
          <source src={question.media_url} />
        </audio>
      )}
      {question.media_type === 'image' && question.media_url && (
        <img
          src={question.media_url}
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
                <span className="flex-1 flex flex-col gap-2">
                  {option.image_url && (
                    <img
                      src={option.image_url}
                      alt={`Opsi ${LETTERS[idx]}`}
                      className="max-h-32 rounded-lg border border-slate-200 object-contain"
                    />
                  )}
                  {option.option_text && (
                    <span className={isSelected ? 'font-medium' : ''}>{option.option_text}</span>
                  )}
                </span>
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
