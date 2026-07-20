path = "src/pages/dashboard/ExamReview.jsx"
with open(path) as f:
    content = f.read()

old_header = """              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-500">
                  Soal Nomor {activeIndex + 1} ({current.type === 'pg' ? 'PG' : 'Essay'})
                </p>"""

new_header = """              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-500">
                    Soal Nomor {activeIndex + 1} ({current.type === 'pg' ? 'PG' : 'Essay'})
                  </p>
                  {current.category && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {current.category.code ? `${current.category.code} · ${current.category.name}` : current.category.name}
                    </span>
                  )}
                </div>"""

assert old_header in content, "pola header soal tidak ditemukan"
content = content.replace(old_header, new_header)

old_option = """                      <span className="pt-0.5">{opt.option_text}</span>"""

new_option = """                      <span className="pt-0.5 flex flex-col gap-2">
                        {opt.image_url && (
                          <img
                            src={opt.image_url}
                            alt={`Opsi ${String.fromCharCode(65 + i)}`}
                            className="max-h-32 rounded-lg border border-slate-200 object-contain"
                          />
                        )}
                        {opt.option_text && <span>{opt.option_text}</span>}
                      </span>"""

assert old_option in content, "pola opsi jawaban tidak ditemukan"
content = content.replace(old_option, new_option)

with open(path, "w") as f:
    f.write(content)
print("OK: 2 perubahan diterapkan di ExamReview.jsx")
