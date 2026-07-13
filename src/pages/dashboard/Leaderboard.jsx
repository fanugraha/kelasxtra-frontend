import { useState, useEffect } from 'react';
import { Trophy, Medal, Sparkles, Target } from 'lucide-react';
import { examBatchService } from '../../services/examBatchService';

const rankStyle = {
  1: 'bg-yellow-100 text-yellow-700',
  2: 'bg-slate-200 text-slate-700',
  3: 'bg-orange-100 text-orange-700',
};

export default function Leaderboard() {
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [entries, setEntries] = useState([]);
  const [myPosition, setMyPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    examBatchService
      .listRanked()
      .then((data) => {
        setBatches(data);
        if (data.length > 0) setSelectedBatchId(data[0].id);
        else setLoading(false);
      })
      .catch(() => {
        setError('Gagal memuat daftar try out.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedBatchId) return;
    setLoading(true);
    setError('');
    setMyPosition(null);

    Promise.all([
      examBatchService.getLeaderboard(selectedBatchId),
      examBatchService.getMyPosition(selectedBatchId).catch(() => null),
    ])
      .then(([leaderboardData, myPositionData]) => {
        setEntries(leaderboardData);
        setMyPosition(myPositionData);
      })
      .catch(() => setError('Leaderboard belum tersedia untuk try out ini.'))
      .finally(() => setLoading(false));
  }, [selectedBatchId]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Leaderboard</h1>

      {batches.length === 0 && !loading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Trophy className="mx-auto mb-3 text-slate-300" size={40} strokeWidth={1.5} />
          <p className="text-slate-500">Belum ada try out yang sudah selesai dinilai.</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full sm:w-auto rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.exam?.title ? `${batch.exam.title} — ${batch.name}` : batch.name}
                </option>
              ))}
            </select>
          </div>

          {myPosition && (
            <div className="bg-gradient-to-r from-orange-500 to-brand-600 rounded-xl p-6 mb-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Target size={20} />
                <h2 className="font-bold">Posisi Kamu</h2>
              </div>
              <p className="text-white/90 text-sm mb-4">{myPosition.summary_text}</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-white/70 text-xs">Skor</p>
                  <p className="text-xl font-bold">{myPosition.score}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">Benar</p>
                  <p className="text-xl font-bold">{myPosition.correct_count}</p>
                </div>
                <div>
                  <p className="text-white/70 text-xs">Ranking</p>
                  <p className="text-xl font-bold">#{myPosition.rank}</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Ranking Nasional (Top 50)</h2>
            </div>

            <div className="p-4">
              {error ? (
                <p className="text-slate-500 text-center py-6">{error}</p>
              ) : loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : entries.length === 0 ? (
                <p className="text-slate-500 text-center py-6">Belum ada peserta di try out ini.</p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            rankStyle[entry.rank] || 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {entry.rank <= 3 ? <Medal size={15} /> : entry.rank}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{entry.user?.name}</p>
                          <p className="text-xs text-slate-400">{entry.correct_count} soal benar</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={13} className="text-brand-500" />
                        <span className="font-bold text-slate-800">{entry.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
