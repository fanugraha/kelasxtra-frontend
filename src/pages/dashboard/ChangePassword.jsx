import { useState } from 'react';
import { KeyRound, Save } from 'lucide-react';
import { authService } from '../../services/authService';

export default function ChangePassword() {
  const [form, setForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
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
      await authService.updatePassword(form);
      setMessage({ type: 'success', text: 'Password berhasil diubah.' });
      setForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      setErrors(err.response?.data?.errors || {});
      setMessage({ type: 'error', text: 'Gagal mengubah password. Cek kembali data Anda.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center">
          <KeyRound size={20} />
        </div>
        <h1 className="text-xl font-bold text-brand-700">Ubah Password</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 p-6">
        {message && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-danger-50 text-danger-600'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Password Lama
            </label>
            <input
              type="password"
              name="current_password"
              value={form.current_password}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            {errors.current_password && (
              <p className="text-xs text-danger-600 mt-1">{errors.current_password[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Password Baru
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            {errors.password && (
              <p className="text-xs text-danger-600 mt-1">{errors.password[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              name="password_confirmation"
              value={form.password_confirmation}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full rounded-lg border border-neutral-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-60"
          >
            <Save size={16} />
            {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  );
}