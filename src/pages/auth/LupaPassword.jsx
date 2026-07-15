import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function LupaPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('');
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setStatus(res.message || 'Jika email terdaftar, link reset password sudah dikirim.');
    } catch (err) {
      setStatus(err.response?.data?.message || 'Gagal mengirim link reset. Coba lagi.');
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

      {/* Kanan: form lupa password */}
      <div className="lg:w-1/2 flex flex-col justify-center px-8 py-10 lg:px-16 bg-brand-600">
        <h2 className="text-3xl font-bold text-white mb-2">Lupa Password?</h2>
        <p className="text-brand-100 mb-8">
          Masukkan email kamu, kami akan kirim link untuk reset password.
        </p>

        <form onSubmit={handleSubmit} className="w-[400px]">
          {status && (
            <div className="bg-white/10 text-white text-sm p-3 rounded-lg mb-4">
              {status}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm text-white/90 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg px-4 py-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-warning-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-warning-600 hover:bg-warning-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition"
          >
            {loading ? 'Mengirim...' : 'Kirim Link Reset Password'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full mt-3 bg-white/15 text-white font-semibold py-3 rounded-lg hover:bg-white/25 transition"
          >
            Kembali ke Login
          </button>
        </form>
      </div>
    </div>
  );
}
