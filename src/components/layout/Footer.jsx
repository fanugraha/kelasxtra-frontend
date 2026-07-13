import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
                K
              </div>
              <span className="text-lg font-bold text-slate-800">Kelasxtra</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-slate-500">
              Penyedia layanan bimbel online untuk persiapan SKD CPNS, kedinasan, dan tes seleksi lainnya dengan pembelajaran berkualitas.
            </p>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="mt-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:border-brand-600 hover:text-brand-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-800">Jelajahi</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link to="/" className="hover:text-brand-600">Beranda</Link></li>
              <li><Link to="/app/packages" className="hover:text-brand-600">Paket Belajar</Link></li>
              <li><Link to="/artikel" className="hover:text-brand-600">Artikel</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-800">Akun</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-500">
              <li><Link to="/login" className="hover:text-brand-600">Masuk</Link></li>
              <li><Link to="/daftar" className="hover:text-brand-600">Daftar</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} Kelasxtra. Semua hak dilindungi.
        </div>
      </div>
    </footer>
  );
}