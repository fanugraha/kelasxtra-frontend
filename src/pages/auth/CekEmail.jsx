import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';

export default function CekEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setSending(true);
    setStatus('');
    try {
      await authService.resendVerification(email);
      setStatus('Link verifikasi baru sudah dikirim. Cek email kamu ya.');
    } catch {
      setStatus('Gagal mengirim ulang. Coba lagi sebentar.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-700 flex flex-col items-center justify-center px-8 py-10 text-center">
      <span className="text-white font-bold text-2xl mb-8">Kelasxtra</span>

      <div className="bg-brand-600 rounded-2xl px-8 py-10 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-3">Cek Email Kamu</h1>
        <p className="text-brand-100 mb-2">
          Kami sudah kirim link verifikasi ke:
        </p>
        <p className="text-white font-semibold mb-6">{email || 'email kamu'}</p>
        <p className="text-brand-100 text-sm mb-8">
          Klik link di email tersebut untuk mengaktifkan akun, lalu kembali ke halaman Login.
        </p>

        {status && (
          <div className="bg-white/10 text-white text-sm p-3 rounded-lg mb-4">
            {status}
          </div>
        )}

        <button
          type="button"
          onClick={handleResend}
          disabled={sending || !email}
          className="w-full bg-warning-600 hover:bg-warning-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition mb-3"
        >
          {sending ? 'Mengirim...' : 'Kirim Ulang Email Verifikasi'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full bg-white/15 text-white font-semibold py-3 rounded-lg hover:bg-white/25 transition"
        >
          Kembali ke Login
        </button>
      </div>
    </div>
  );
}
