import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Clock, CheckCircle2, XCircle, RotateCcw, FileSearch, X } from 'lucide-react';
import { examService } from '../../services/examService';

function ExamDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 animate-pulse">
      <div className="flex items-center gap-1 mb-6">
        <ChevronLeft size={16} className="text-slate-200" />
        <div className="h-4 w-20 bg-slate-100 rounded" />
      </div>

      <div className="h-7 w-2/3 bg-slate-100 rounded mb-2" />
      <div className="h-4 w-40 bg-slate-100 rounded mb-6" />

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="h-10 w-40 bg-slate-100 rounded-lg" />
      </div>

      <div className="h-4 w-48 bg-slate-100 rounded mb-3" />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-stretch">
        <div className="bg-white rounded-xl border border-slate-200 p-5 h-40" />
        <div className="bg-slate-100 rounded-xl h-40" />
      </div>
    </div>
  );
}

export default function ExamDetail() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetBankId = searchParams.get('bank') ? Number(searchParams.get('bank')) : null;

  const [examTitle, setExamTitle] = useState('');
  const [banks, setBanks] = useState([]);
  const [banksLoaded, setBanksLoaded] = useState(false);
  // Bank yang AKTIF dipakai untuk fetch summary/attempts -- baik dari URL
  // (?bank=) maupun dari pilihan siswa lewat modal. Sengaja TIDAK auto-pakai
  // banks[0] kalau ada >1 bank, supaya data attempt tidak pernah tercampur
  // antar-bank (bug sebelumnya: summary di-fetch dengan bank_id=null saat
  // halaman dibuka tanpa ?bank=, sehingga backend mengembalikan attempt dari
  // SEMUA bank sekaligus).
  const [activeBankId, setActiveBankId] = useState(presetBankId);

  const [summary, setSummary] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [showBankModal, setShowBankModal] = useState(false);

  // Tahap 1: ambil daftar bank exam ini (selalu, supaya tahu apakah exam ini
  // single-bank atau multi-bank) sebelum memutuskan mau fetch summary pakai
  // bank apa.
  useEffect(() => {
    if (presetBankId) return; // sudah tahu bank-nya dari URL, skip tahap ini

    let active = true;
    examService.getExamBanks(examId)
      .then((data) => {
        if (!active) return;
        const list = data.banks || [];
        setBanks(list);
        setExamTitle(data.exam?.title || '');

        if (list.length <= 1) {
          // Exam lama / single-bank: aman langsung pakai bank itu (atau null
          // kalau memang tidak ada bank sama sekali).
          setActiveBankId(list[0]?.id ?? null);
        } else {
          // Multi-bank & belum ada preset -- WAJIB tanya dulu, jangan tebak.
          setShowBankModal(true);
        }
      })
      .finally(() => {
        if (active) setBanksLoaded(true);
      });

    return () => { active = false; };
  }, [examId, presetBankId]);

  // Tahap 2: baru fetch summary & attempts SETELAH activeBankId diketahui
  // (baik dari preset URL, dari auto-resolve single-bank, atau dari pilihan
  // modal). Kalau exam multi-bank dan siswa belum pilih, effect ini menunggu
  // (activeBankId masih null) -- summary tidak pernah ke-render dengan data
  // campuran.
  useEffect(() => {
    const needsBankButNotChosen = !presetBankId && banks.length > 1 && activeBankId === null;
    if (needsBankButNotChosen) {
      setLoading(false);
      return;
    }
    if (presetBankId === null && !banksLoaded && banks.length === 0) {
      // masih menunggu tahap 1 selesai (kasus multi-bank belum kebaca)
      return;
    }

    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      examService.getExamSummary(examId, activeBankId),
      examService.listAttempts(examId, activeBankId),
    ])
      .then(([summaryData, attemptsData]) => {
        if (!active) return;
        setSummary(summaryData);
        setAttempts(attemptsData.attempts || []);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Gagal memuat detail latihan soal.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [examId, activeBankId, presetBankId, banks.length, banksLoaded]);

  function handleStart() {
    console.log('[ExamDetail] handleStart dipanggil, activeBankId =', activeBankId);
    doStart(activeBankId);
  }

  async function doStart(bankId) {
    console.log('[ExamDetail] doStart mulai, bankId =', bankId, 'examId =', examId);
    setStarting(true);
    setError('');
    try {
      const attempt = await examService.startExam(examId, null, bankId);
      console.log('[ExamDetail] startExam sukses, response =', attempt);
      console.log('[ExamDetail] mau navigate ke =', `/app/exam/${attempt.id}`);
      navigate(`/app/exam/${attempt.id}`);
    } catch (err) {
      console.error('[ExamDetail] startExam GAGAL:', err);
      console.error('[ExamDetail] err.response =', err.response);
      setError(err.response?.data?.message || 'Gagal memulai latihan soal.');
      setStarting(false);
    }
  }

  function handleContinue() {
    navigate(`/app/exam/${summary.in_progress_attempt_id}`);
  }

  function handleBankChosen(bankId) {
    setActiveBankId(bankId);
    setShowBankModal(false);
  }

  const waitingForBankChoice = !presetBankId && banks.length > 1 && activeBankId === null;

  if (loading && !waitingForBankChoice) {
    return <ExamDetailSkeleton />;
  }

  // Multi-bank & belum pilih: jangan render summary apapun -- cuma modal
  // pemilihan bank. Ini mencegah data attempt lintas-bank pernah tampil.
  if (waitingForBankChoice) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 mb-6"
        >
          <ChevronLeft size={16} />
          Kembali
        </button>
        <h1 className="text-2xl font-bold text-slate-800 mb-4">{examTitle}</h1>
        <p className="text-slate-500 mb-4">
          Latihan soal ini punya beberapa bagian. Pilih salah satu untuk melihat detail dan riwayat nilainya.
        </p>
        {showBankModal && (
          <BankSelectModal
            banks={banks}
            onSelect={handleBankChosen}
            onClose={() => navigate(-1)}
          />
        )}
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-danger-600">{error}</p>
      </div>
    );
  }

  const { exam, in_progress_attempt_id, latest_attempt } = summary;
  const hasCompletedAttempt = latest_attempt !== null;

  const sortedAttempts = [...attempts].sort((a, b) => a.attempt_number - b.attempt_number);
  const latestAttempt = sortedAttempts[sortedAttempts.length - 1] || null;
  const previousAttempt = sortedAttempts.length > 1 ? sortedAttempts[sortedAttempts.length - 2] : null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 mb-6"
      >
        <ChevronLeft size={16} />
        Kembali
      </button>

      <h1 className="text-2xl font-bold text-slate-800 mb-1">{exam.title}</h1>
      <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {exam.duration_minutes} menit waktu pengerjaan
        </span>
      </div>

      {error && (
        <p className="text-sm text-danger-600 mb-4">{error}</p>
      )}

      {in_progress_attempt_id ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <p className="text-slate-600 mb-4">
            Kamu punya pengerjaan yang belum selesai untuk latihan soal ini.
          </p>
          <button
            onClick={handleContinue}
            className="px-6 py-2.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700"
          >
            Lanjutkan Ujian
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <button
            onClick={handleStart}
            disabled={starting}
            className="px-6 py-2.5 rounded-lg bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
          >
            {hasCompletedAttempt && <RotateCcw size={16} />}
            {starting ? 'Memulai...' : hasCompletedAttempt ? 'Ulangi Ujian' : 'Mulai Ujian'}
          </button>
        </div>
      )}

      {sortedAttempts.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">Riwayat Perolehan Nilai</p>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-stretch">
            <DetailTableCard
              label="Perolehan Nilai Terbaru"
              attempt={latestAttempt}
              passingScore={exam.passing_score}
            />
            <ScoreSummaryCard
              label="Perolehan Nilai Terbaru"
              attempt={latestAttempt}
              compareScore={previousAttempt?.score}
              onReview={() => navigate(`/app/exam-attempts/${latestAttempt.attempt_id}/review`)}
            />

            {previousAttempt && (
              <>
                <DetailTableCard
                  label="Perolehan Nilai Sebelumnya"
                  attempt={previousAttempt}
                  passingScore={exam.passing_score}
                />
                <ScoreSummaryCard
                  label="Perolehan Nilai Sebelumnya"
                  attempt={previousAttempt}
                  onReview={() => navigate(`/app/exam-attempts/${previousAttempt.attempt_id}/review`)}
                />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BankSelectModal({ banks, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X size={18} />
        </button>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Pilih Bank Soal</h2>
        <p className="text-sm text-slate-500 mb-4">
          Latihan soal ini punya beberapa bagian. Pilih salah satu untuk melihat detail dan riwayat nilai.
        </p>
        <div className="space-y-2">
          {banks.map((bank) => (
            <button
              key={bank.id}
              onClick={() => onSelect(bank.id)}
              className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition font-medium text-slate-700"
            >
              {bank.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailTableCard({ label, attempt, passingScore }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 h-full">
      <p className="text-sm font-semibold text-slate-600">{label}</p>
      <p className="text-xs text-slate-400 mb-4">Percobaan ke-{attempt.attempt_number}</p>

      {attempt.sections && attempt.sections.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 border-b border-slate-200">
              <th className="text-left font-medium py-2">Pelajaran</th>
              <th className="text-right font-medium py-2">Passing Grade</th>
              <th className="text-right font-medium py-2">Nilai</th>
            </tr>
          </thead>
          <tbody>
            {attempt.sections.map((s) => {
              const sectionFailed = s.raw_score < s.min_passing_score;
              return (
                <tr key={s.code} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 text-slate-700">{s.name}</td>
                  <td className="py-2 text-right text-slate-500">{s.min_passing_score}</td>
                  <td
                    className={`py-2 text-right font-semibold ${sectionFailed ? 'text-red-600' : 'text-emerald-600'
                      }`}
                  >
                    {s.raw_score}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-slate-500">Passing grade: {passingScore}</p>
      )}
    </div>
  );
}

function ScoreSummaryCard({ label, attempt, compareScore, onReview }) {
  const passed = attempt.passed;

  const cardTheme = passed
    ? 'bg-emerald-50 border-emerald-300'
    : 'bg-red-50 border-red-300';
  const scoreColor = passed ? 'text-emerald-700' : 'text-red-700';
  const badgeTheme = passed ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white';

  let trend = null;
  if (typeof compareScore === 'number') {
    const diff = attempt.score - compareScore;
    if (diff > 0) trend = { text: `+${diff} dari sebelumnya`, color: 'text-emerald-600' };
    else if (diff < 0) trend = { text: `${diff} dari sebelumnya`, color: 'text-red-600' };
    else trend = { text: 'Sama seperti sebelumnya', color: 'text-slate-400' };
  }

  return (
    <div className={`rounded-xl p-5 border-2 h-full flex flex-col ${cardTheme}`}>
      <p className="text-xs font-semibold text-slate-600">{label}</p>
      <p className="text-xs text-slate-400 mb-3">Percobaan ke-{attempt.attempt_number}</p>

      <div className="text-center mb-4 flex-1 flex flex-col justify-center">
        <p className={`text-3xl font-bold ${scoreColor}`}>{attempt.score}</p>
        {trend && <p className={`text-xs font-medium mt-1 ${trend.color}`}>{trend.text}</p>}
        <div
          className={`inline-flex items-center gap-1 mt-2 mx-auto px-3 py-1 rounded-full text-xs font-semibold ${badgeTheme}`}
        >
          {passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {passed ? 'LULUS' : 'TIDAK LULUS'}
        </div>
      </div>

      <button
        onClick={onReview}
        className="w-full py-2 rounded-lg bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 flex items-center justify-center gap-1 transition"
      >
        <FileSearch size={14} />
        Pembahasan
      </button>
    </div>
  );
}