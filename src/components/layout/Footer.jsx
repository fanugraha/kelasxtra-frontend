import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const exploreLinks = [
  { to: '/', label: 'Beranda' },
  { to: '/app/packages', label: 'Paket Belajar' },
  { to: '/app/leaderboard', label: 'Leaderboard' },
  { to: '/app/promos', label: 'Promo' },
  { to: '/artikel', label: 'Artikel' },
];

const programLinks = [
  { to: '/app/packages?program=skd-cpns', label: 'SKD CPNS' },
  { to: '/app/packages?program=kedinasan', label: 'Sekolah Kedinasan' },
  { to: '/app/packages?program=tes-lainnya', label: 'Tes Seleksi Lainnya' },
];

const accountLinks = [
  { to: '/login', label: 'Masuk' },
  { to: '/daftar', label: 'Daftar Akun' },
];

function FooterColumn({ title, links }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-300/90">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.to}>
            <Link to={link.to} className="text-white/65 transition hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-brand-600 to-brand-700 mt-16">
      {/* Garis aksen emas — sama seperti garis di bawah navbar, jadi footer
          terasa sebagai "penutup" yang senada, bukan elemen terpisah. */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand + kontak */}
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-extrabold tracking-tight text-white">Xtra</span>
              <span className="text-xl font-extrabold tracking-tight text-amber-300">academy</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/60">
              Penyedia layanan bimbel online untuk persiapan SKD CPNS, kedinasan, dan tes
              seleksi lainnya dengan pembelajaran berkualitas.
            </p>

            <ul className="mt-5 space-y-2.5 text-sm text-white/65">
              <li className="flex items-center gap-2.5">
                <Mail size={14} className="shrink-0 text-amber-300/80" />
                <a href="mailto:halo@xtracademy.id" className="hover:text-white transition">
                  halo@xtracademy.id
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={14} className="shrink-0 text-amber-300/80" />
                <a href="tel:+6281234567890" className="hover:text-white transition">
                  0812-3456-7890
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={14} className="shrink-0 text-amber-300/80 mt-0.5" />
                <span>Jakarta, Indonesia</span>
              </li>
            </ul>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/60 transition hover:border-amber-300/60 hover:text-amber-300"
              aria-label="Instagram Xtracademy"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
          </div>

          <FooterColumn title="Jelajahi" links={exploreLinks} />
          <FooterColumn title="Program" links={programLinks} />
          <FooterColumn title="Akun" links={accountLinks} />
        </div>

        <div className="mt-12 flex flex-col-reverse items-center gap-4 border-t border-white/10 pt-6 sm:flex-row sm:justify-between">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Xtracademy. Semua hak dilindungi.
          </p>
          <div className="flex items-center gap-5 text-xs text-white/40">
            <Link to="/syarat-ketentuan" className="hover:text-white/70 transition">
              Syarat & Ketentuan
            </Link>
            <Link to="/kebijakan-privasi" className="hover:text-white/70 transition">
              Kebijakan Privasi
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}