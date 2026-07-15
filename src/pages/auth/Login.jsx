import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [resending, setResending] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const googleButtonRef = useRef(null);

  const verified = searchParams.get('verified');
  const resetOk = searchParams.get('reset');

  // Tujuan setelah login berhasil: dari state router (redirect via <Navigate state={{ from }} />),
  // atau dari query param ?redirect=, kalau tidak ada fallback ke dashboard.
  const redirectTo = location.state?.from || searchParams.get('redirect') || '/app/dashboard';

  const handleGoogleCredential = useCallback(
    async (response) => {
      setError('');
      try {
        await loginWithGoogle(response.credential);
        navigate(redirectTo, { replace: true });
      } catch (err) {
        setError(err.response?.data?.message || 'Gagal masuk dengan Google.');
      }
    },
    [loginWithGoogle, navigate, redirectTo]
  );

  useEffect(() => {
    let cancelled = false;
    let pollId;

    function tryInitGoogleButton() {
      if (cancelled) return;

      // Script Google (accounts.id) sering dimuat async dan bisa belum siap
      // saat komponen pertama kali mount — polling sampai tersedia, lalu berhenti.
      if (!window.google || !googleButtonRef.current) {
        pollId = setTimeout(tryInitGoogleButton, 300);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: googleButtonRef.current.offsetWidth,
        shape: 'rectangular',
        text: 'signin_with',
      });
    }

    tryInitGoogleButton();

    return () => {
      cancelled = true;
      if (pollId) clearTimeout(pollId);
    };
  }, [handleGoogleCredential]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResendStatus('');
    setNeedsVerification(false);
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Email atau password salah.';
      setError(message);
      if (message.toLowerCase().includes('verifikasi')) {
        setNeedsVerification(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResendStatus('');
    try {
      await authService.resendVerification(email);
      setResendStatus('Link verifikasi baru sudah dikirim. Cek email kamu ya.');
    } catch {
      setResendStatus('Gagal mengirim ulang. Coba lagi sebentar.');
    } finally {
      setResending(false);
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

      {/* Kanan: form login */}
      <div className="lg:w-1/2 flex flex-col justify-center px-8 py-10 lg:px-16 bg-brand-600">
        <h2 className="text-3xl font-bold text-white mb-2">Selamat Datang Kembali!</h2>
        <p className="text-brand-100 mb-8">Mulailah mengerjakan tryoutmu!</p>

        <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
          {verified === '1' && (
            <div className="bg-success-50 border border-success-100 text-success-700 text-sm p-3 rounded-lg mb-4">
              Email berhasil diverifikasi! Silakan login.
            </div>
          )}
          {verified === '0' && (
            <div className="bg-danger-50 border border-danger-100 text-danger-700 text-sm p-3 rounded-lg mb-4">
              Link verifikasi tidak valid atau sudah kedaluwarsa.
            </div>
          )}
          {resetOk === '1' && (
            <div className="bg-success-50 border border-success-100 text-success-700 text-sm p-3 rounded-lg mb-4">
              Password berhasil direset! Silakan login dengan password baru.
            </div>
          )}

          {error && (
            <div className="bg-danger-50 border border-danger-100 text-danger-700 text-sm p-3 rounded-lg mb-2">
              {error}
            </div>
          )}

          {needsVerification && (
            <div className="mb-4">
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || !email}
                className="text-sm text-warning-200 hover:underline disabled:opacity-50"
              >
                {resending ? 'Mengirim...' : 'Kirim Ulang Email Verifikasi'}
              </button>
              {resendStatus && (
                <p className="text-xs text-white/80 mt-1">{resendStatus}</p>
              )}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm text-white/90 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-lg px-4 py-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-warning-200"
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm text-white/90 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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

          <div className="text-right mb-6">
            <button
              type="button"
              onClick={() => navigate('/lupa-password')}
              className="text-sm text-white/90 hover:underline"
            >
              Lupa Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-warning-600 hover:bg-warning-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 transition"
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-white/30" />
            <span className="text-xs text-white/60">ATAU</span>
            <div className="flex-1 h-px bg-white/30" />
          </div>

          <div
            ref={googleButtonRef}
            className={`flex justify-center ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            aria-disabled={loading}
          />

          <button
            type="button"
            onClick={() => navigate('/daftar')}
            className="w-full mt-3 bg-white/15 text-white font-semibold py-3 rounded-lg hover:bg-white/25 transition"
          >
            Belum Punya Akun? Daftar Sekarang!
          </button>
        </form>
      </div>
    </div>
  );
}