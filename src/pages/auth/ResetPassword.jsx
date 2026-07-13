import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { authService } from '../../services/authService';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      navigate('/login?reset=1');
    } catch (err) {
      const messages = err.response?.data?.errors;
      const firstMessage = messages ? Object.values(messages)[0]?.[0] : null;
      setError(firstMessage || err.response?.data?.message || 'Gagal reset password, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-brand-700 flex flex-col items-center justify-center px-8 py-10 text-center">
        <span className="text-white font-bold text-2xl mb-8">Kelasxtra</span>
        <div className="bg-brand-600 rounded-2xl px-8 py-10 max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-3">Link Tidak Valid</h1>
          <p className="text-brand-100 mb-6">
            Link reset password tidak lengkap atau sudah tidak berlaku.
          </p>
          <button
            type="button"
            onClick={() => navigate('/lupa-password')}
            className="w-full bg-warning-600 hover:bg-warning-700 text-white font-bold py-3 rounded-lg transition"
          >
            Minta Link Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-700 flex flex-col lg:flex-row">
      {/* Kiri: brand + tagline */}
      <div className="lg:w-1/2 flex flex-col justify-center px-8 py-10 lg:px-16">
        <span className="text-white font-bold text-2xl mb-10">Kelasxtra</span>
        <h1 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight">
          BELAJAR TERARAH
          <br />
          <span className="text-warning-200">HASIL MENGESANKAN</span>
        </h1>
        <p className="text-brand-100 mt-4 max-w-sm">
          Try out, kelas, dan pembahasan yang disusun sesuai kategori ujianmu.
        </p>
      </div>

      {/* Kanan: form reset password */}
      <div className="lg:w-1/2 flex flex-col justify-center px-8 py-10 lg:px-16 bg-brand-600">
        <h2 className="text-3xl font-bold text-white mb-2">Buat Password Baru</h2>
        <p className="text-brand-100 mb-8">Untuk akun: {email}</p>

        <form onSubmit={handleSubmit} className="w-[400px]">
          {error && (
            <div className="bg-danger-50 border border-danger-100 text-danger-700 text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm text-white/90 mb-1">Password Baru</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg px-4 py-3 pr-11 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-warning-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                aria-label="Toggle password"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm text-white/90 mb-1">Konfirmasi Password Baru</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg px-4 py-3 pr-11 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-warning-200"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                aria-label="Toggle konfirmasi password"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-warning-600 hover:bg-warning-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition"
          >
            {loading ? 'Memproses...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
