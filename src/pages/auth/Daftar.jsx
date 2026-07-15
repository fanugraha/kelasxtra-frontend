import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PHONE_MAX_LENGTH = 13;

export default function Daftar() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordTooShort = password.length > 0 && password.length < 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordMismatch(false);

    // Validasi kecocokan password di client dulu, sebelum kirim ke server —
    // supaya user tahu typo-nya langsung, tanpa nunggu round-trip network.
    if (password !== passwordConfirmation) {
      setPasswordMismatch(true);
      setError('Password dan konfirmasi password tidak sama.');
      return;
    }

    setLoading(true);
    try {
      await register({
        name,
        email,
        phone: phone || undefined,
        password,
        password_confirmation: passwordConfirmation,
      });
      navigate('/cek-email', { state: { email } });
    } catch (err) {
      const messages = err.response?.data?.errors;
      const allMessages = messages
        ? Object.values(messages).flatMap((fieldErrors) => fieldErrors || [])
        : [];
      setError(
        allMessages.length > 0
          ? allMessages.join(' ')
          : err.response?.data?.message || 'Gagal mendaftar, coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-700 flex flex-col lg:flex-row">
      {/* Kiri: brand + tagline */}
      <div className="lg:w-1/2 flex flex-col justify-center px-8 py-10 lg:px-16">
        <span className="text-white font-bold text-2xl mb-10">Xtracademy</span>
        <h1 className="text-3xl lg:text-5xl font-extrabold text-white leading-tight">
          BELAJAR TERARAH
          <br />
          <span className="text-warning-200">HASIL MENGESANKAN</span>
        </h1>
        <p className="text-brand-100 mt-4 max-w-sm">
          Try out, kelas, dan pembahasan yang disusun sesuai kategori ujianmu.
        </p>
      </div>

      {/* Kanan: form daftar */}
      <div className="lg:w-1/2 flex flex-col justify-center px-8 py-10 lg:px-16 bg-brand-600">
        <h2 className="text-3xl font-bold text-white mb-2">Daftar Akun</h2>
        <p className="text-brand-100 mb-8">Mulailah mengerjakan tryoutmu!</p>

        <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
          {error && (
            <div className="bg-danger-50 border border-danger-100 text-danger-700 text-sm p-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm text-white/90 mb-1">Nama</label>
            <input
              type="text"
              value={name}
              autoComplete="name"
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg px-4 py-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-warning-200"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm text-white/90 mb-1">Email</label>
            <input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg px-4 py-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-warning-200"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm text-white/90 mb-1">Telepon</label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 rounded-lg bg-white text-slate-500 text-sm">+62</span>
              <input
                type="tel"
                value={phone}
                autoComplete="tel-national"
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, PHONE_MAX_LENGTH))}
                placeholder="8xxxxxxxxxx"
                className="flex-1 rounded-lg px-4 py-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-warning-200"
              />
            </div>
          </div>

          <div className="mb-1">
            <label className="block text-sm text-white/90 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                autoComplete="new-password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordMismatch(false);
                }}
                required
                minLength={8}
                className="w-full rounded-lg px-4 py-3 pr-11 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-warning-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <p className={`text-xs mb-5 ${passwordTooShort ? 'text-warning-200' : 'text-white/60'}`}>
            Minimal 8 karakter.
          </p>

          <div className="mb-1">
            <label className="block text-sm text-white/90 mb-1">Konfirmasi Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={passwordConfirmation}
                autoComplete="new-password"
                onChange={(e) => {
                  setPasswordConfirmation(e.target.value);
                  setPasswordMismatch(false);
                }}
                required
                minLength={8}
                className={`w-full rounded-lg px-4 py-3 pr-11 bg-white text-slate-800 focus:outline-none focus:ring-2 ${
                  passwordMismatch ? 'ring-2 ring-danger-400' : 'focus:ring-warning-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500"
                aria-label={showConfirm ? 'Sembunyikan konfirmasi password' : 'Tampilkan konfirmasi password'}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <p className="text-xs text-white/60 mb-6">
            {passwordMismatch ? (
              <span className="text-danger-200">Password belum sama dengan di atas.</span>
            ) : (
              'Ketik ulang password yang sama.'
            )}
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-warning-600 hover:bg-warning-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition"
          >
            {loading ? 'Memproses...' : 'Daftar'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full mt-3 bg-white/15 text-white font-semibold py-3 rounded-lg hover:bg-white/25 transition"
          >
            Sudah Punya Akun? Login Disini
          </button>
        </form>
      </div>
    </div>
  );
}