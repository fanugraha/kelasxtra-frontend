import { useState } from 'react';
import { User, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

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

            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
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
        </div>
    );
}