export default function ConfirmModal({
  title,
  message,
  rules,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  onConfirm,
  onClose,
  confirmDisabled = false,
  confirmColor = 'bg-brand-600 hover:bg-brand-700',
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 relative">
        <h2 className="text-lg font-bold text-slate-800 mb-3">{title}</h2>

        {rules && rules.length > 0 ? (
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 mb-6">
            {rules.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-slate-600 mb-6">{message}</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition disabled:opacity-50 ${confirmColor}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
