/**
 * Auto-format teks soal supaya lebih mudah dibaca siswa, TANPA perlu ubah
 * data mentah di database:
 * - Silogisme: "Premis 1:", "Premis 2:", ..., "Kesimpulan" masing-masing
 *   dipisah ke baris baru.
 * - Analogi kata: kalimat pengantar dipisah dari pasangan kata yang
 *   dianalogikan, mis. "... berikut: KANCIL : CERDIK = ... : ..."
 */
export function formatQuestionText(text) {
  if (!text) return text;

  let formatted = text;

  // Premis 1 / Premis 2 / Premis 3, dst -- tiap kemunculan baris baru.
  formatted = formatted.replace(/\s*(Premis\s*\d+\s*:)/gi, '<br/><br/>$1');

  // "Kesimpulan" (dengan variasi "Kesimpulan yang paling tepat adalah")
  formatted = formatted.replace(
    /\s*(Kesimpulan(?:\s+yang\s+paling\s+tepat)?\s*(?:adalah)?\s*:?)/gi,
    '<br/><br/>$1'
  );

  // Analogi kata: pisahkan kalimat pengantar dari pasangan kata,
  // mis. "... berikut: KANCIL : CERDIK = ... : ..."
  formatted = formatted.replace(
    /(berikut\s*:)\s*([A-Z][A-Za-z\u00C0-\u017F]*\s*:\s*[A-Za-z\u00C0-\u017F]+\s*=\s*.+)/i,
    '$1<br/><br/>$2'
  );

  // Buang <br/> dobel kalau kebetulan nempel di paling awal teks.
  formatted = formatted.replace(/^(<br\/>)+/, '');

  return formatted;
}
