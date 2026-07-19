import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Save, Trophy, Medal, Flame, Award, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { examBatchService } from '../../services/examBatchService';
import { weeklyLeaderboardService } from '../../services/weeklyLeaderboardService';

const rankBadge = {
    1: 'bg-yellow-100 text-yellow-700',
    2: 'bg-slate-200 text-slate-700',
    3: 'bg-orange-100 text-orange-700',
};

export default function Profile() {
    const { user, setUser } = useAuth();
    const [form, setForm] = useState({
        name: user?.name || '',
        phone: user?.phone || '',
        level_pendidikan: user?.level_pendidikan || '',
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setErrors({});

        try {
            const updated = await authService.updateProfile(form);
            setUser(updated);
            setMessage({ type: 'success', text: 'Profil berhasil diperbarui.' });
        } catch (err) {
            setErrors(err.response?.data?.errors || {});
            setMessage({ type: 'error', text: 'Gagal memperbarui profil. Cek kembali data Anda.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
                    <User size={20} />
                </div>
                <h1 className="text-xl font-bold text-brand-700">Profil Saya</h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6 mb-6">
                {message && (
                    <div
                        className={`mb-4 rounded-lg px-4 py-3 text-sm ${message.type === 'success'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-danger-50 text-danger-600'
                            }`}
                    >
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-500"
                        />
                        <p className="text-xs text-neutral-400 mt-1">Email tidak dapat diubah.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Nama</label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                        {errors.name && <p className="text-xs text-danger-600 mt-1">{errors.name[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Telepon / WhatsApp
                        </label>
                        <input
                            type="text"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="08xxxxxxxxxx"
                            className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                        {errors.phone && <p className="text-xs text-danger-600 mt-1">{errors.phone[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Jenjang Pendidikan
                        </label>
                        <select
                            name="level_pendidikan"
                            value={form.level_pendidikan}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                        >
                            <option value="">Pilih jenjang</option>
                            <option value="SMP">SMP</option>
                            <option value="SMA">SMA</option>
                            <option value="Kuliah">Kuliah</option>
                            <option value="Umum">Umum</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60"
                    >
                        <Save size={16} />
                        {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </form>
            </div>

            <AchievementsSection />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────
// Pencapaian Saya — mengambil daftar try out & latihan soal yang punya
// leaderboard aktif, lalu cek posisi user di masing-masing (myPosition
// mengembalikan 404 kalau user belum punya ranking di situ, jadi kita
// pakai Promise.allSettled dan buang yang gagal/404). Hasilnya diurut
// dari rank terbaik, dan badge dihitung dari entri rank <= 3.
// ─────────────────────────────────────────────────────────────────────────
function AchievementsSection() {
    const navigate = useNavigate();
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let active = true;

        async function loadAchievements() {
            try {
                const [batches, practiceExams] = await Promise.all([
                    examBatchService.listRanked().catch(() => []),
                    weeklyLeaderboardService.listRanked().then((res) => res.data).catch(() => []),
                ]);

                const batchResults = await Promise.allSettled(
                    batches.map((b) =>
                        examBatchService.getMyPosition(b.id).then((pos) => ({
                            type: 'tryout',
                            id: `tryout-${b.id}`,
                            label: b.exam?.title ? `${b.exam.title} — ${b.name}` : b.name,
                            rank: pos.rank ?? pos.ranking,
                            score: pos.score ?? pos.skor_terbaik,
                        }))
                    )
                );

                const practiceResults = await Promise.allSettled(
                    practiceExams.map((e) =>
                        weeklyLeaderboardService.getMyPosition(e.id).then((pos) => ({
                            type: 'practice',
                            id: `practice-${e.id}`,
                            label: e.title,
                            rank: pos.rank ?? pos.ranking,
                            score: pos.score ?? pos.skor_terbaik,
                        }))
                    )
                );

                const combined = [...batchResults, ...practiceResults]
                    .filter((r) => r.status === 'fulfilled')
                    .map((r) => r.value)
                    .filter((entry) => entry.rank != null)
                    .sort((a, b) => a.rank - b.rank);

                if (active) setAchievements(combined);
            } catch {
                if (active) setError('Gagal memuat pencapaian.');
            } finally {
                if (active) setLoading(false);
            }
        }

        loadAchievements();
        return () => {
            active = false;
        };
    }, []);

    const badgeCount = achievements.filter((a) => a.rank <= 3).length;
    const bestRank = achievements.length > 0 ? achievements[0] : null;

    return (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
            <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Trophy size={18} />
                </div>
                <div>
                    <h2 className="text-base font-bold text-slate-800">Pencapaian Saya</h2>
                    <p className="text-xs text-slate-400">Ranking aktif di try out & latihan soal mingguan</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : error ? (
                <p className="text-sm text-slate-400 text-center py-6">{error}</p>
            ) : achievements.length === 0 ? (
                <div className="text-center py-8">
                    <Award className="mx-auto mb-3 text-slate-300" size={36} strokeWidth={1.5} />
                    <p className="text-sm text-slate-500 mb-3">
                        Belum ada ranking. Kerjakan try out atau latihan soal untuk mulai naik leaderboard!
                    </p>
                    <button
                        onClick={() => navigate('/app/packages')}
                        className="text-sm font-semibold text-brand-600 hover:underline"
                    >
                        Mulai Kerjakan Soal →
                    </button>
                </div>
            ) : (
                <>
                    {/* Ringkasan stat */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="bg-slate-50 rounded-xl px-3 py-3 text-center">
                            <p className="text-xl font-bold text-slate-800">{achievements.length}</p>
                            <p className="text-[11px] text-slate-400">Total Ranking</p>
                        </div>
                        <div className="bg-amber-50 rounded-xl px-3 py-3 text-center">
                            <p className="text-xl font-bold text-amber-600">{badgeCount}</p>
                            <p className="text-[11px] text-slate-400">Badge Top 3</p>
                        </div>
                        <div className="bg-brand-50 rounded-xl px-3 py-3 text-center">
                            <p className="text-xl font-bold text-brand-600">#{bestRank?.rank}</p>
                            <p className="text-[11px] text-slate-400">Rank Terbaik</p>
                        </div>
                    </div>

                    {/* List ranking */}
                    <div className="space-y-2">
                        {achievements.map((entry) => (
                            <button
                                key={entry.id}
                                onClick={() => navigate('/app/leaderboard')}
                                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition text-left"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span
                                        className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                                            rankBadge[entry.rank] || 'bg-slate-100 text-slate-500'
                                        }`}
                                    >
                                        {entry.rank <= 3 ? <Medal size={16} /> : `#${entry.rank}`}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{entry.label}</p>
                                        <p className="text-xs text-slate-400 flex items-center gap-1">
                                            {entry.type === 'tryout' ? (
                                                <>
                                                    <Trophy size={10} /> Try Out
                                                </>
                                            ) : (
                                                <>
                                                    <Flame size={10} /> Latihan Soal
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="flex items-center gap-1 text-sm font-bold text-slate-700">
                                        <Sparkles size={12} className="text-brand-500" />
                                        {entry.score}
                                    </span>
                                    <ChevronRight size={15} className="text-slate-300" />
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}