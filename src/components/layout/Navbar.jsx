import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Package,
  ShoppingCart,
  Award,
  BadgePercent,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  {
    to: '/app/dashboard',
    label: 'Beranda',
    icon: LayoutGrid,
    isActive: (pathname) => pathname === '/app/dashboard',
  },
  {
    to: '/app/packages',
    label: 'Mulai Belajar',
    icon: Package,
    isActive: (pathname) =>
      pathname === '/app/packages' ||
      /^\/app\/packages\/[^/]+$/.test(pathname),
  },
  {
    to: '/app/transactions',
    label: 'Riwayat Transaksi',
    icon: ShoppingCart,
    isActive: (pathname) => pathname.startsWith('/app/transactions'),
  },
  {
    to: '/app/my-packages',
    label: 'Paket Belajar Saya',
    icon: Award,
    isActive: (pathname) =>
      pathname === '/app/my-packages' ||
      /^\/app\/packages\/[^/]+\/exams$/.test(pathname) ||
      /^\/app\/exams\/[^/]+$/.test(pathname) ||
      pathname.startsWith('/app/exam-attempts/') ||
      pathname.startsWith('/app/classes'),
  },
  {
    to: '/app/promos',
    label: 'Promo',
    icon: BadgePercent,
    isActive: (pathname) => pathname.startsWith('/app/promos'),
  },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Shadow + blur saat halaman di-scroll, biar navbar terasa "melayang"
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Tutup dropdown profil kalau klik di luar
  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-30 bg-brand-600/95 backdrop-blur-md transition-shadow duration-300 ${
        scrolled ? 'shadow-lg shadow-black/10' : ''
      }`}
    >
      {/* garis aksen tipis di bagian bawah navbar */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            {/* Wordmark — tanpa kotak ikon, aksen warna jadi identitasnya */}
            <Link
              to="/app/dashboard"
              className="flex items-baseline gap-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 rounded-md"
            >
              <span className="text-white font-extrabold text-lg tracking-tight">
                Xtra
              </span>
              <span className="text-amber-300 font-extrabold text-lg tracking-tight">
                academy
              </span>
            </Link>

            {/* Menu desktop */}
            <div className="hidden lg:flex items-center gap-1 h-full">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = item.isActive(pathname);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={active ? 'page' : undefined}
                    className={`group relative flex items-center gap-2 px-4 h-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 rounded-lg ${
                      active ? 'text-amber-300' : 'text-white/75 hover:text-white'
                    }`}
                  >
                    <Icon
                      size={16}
                      className={`transition-transform ${
                        active ? '' : 'group-hover:-translate-y-0.5'
                      }`}
                    />
                    {item.label}
                    {/* underline aktif */}
                    <span
                      className={`absolute left-3 right-3 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 transition-transform origin-left ${
                        active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-40'
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Profil desktop */}
          <div className="hidden lg:flex items-center" ref={profileRef}>
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-brand-700 flex items-center justify-center text-xs font-bold ring-2 ring-white/20">
                  {initials || '?'}
                </div>
                <span className="text-white text-sm font-medium max-w-[140px] truncate">
                  {user?.name}
                </span>
                <ChevronDown
                  size={15}
                  className={`text-white/70 transition-transform ${
                    profileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl shadow-black/15 ring-1 ring-black/5 py-1.5 overflow-hidden animate-fade-slide-up origin-top-right">
                  <div className="px-3.5 py-2.5 border-b border-neutral-100">
                    <p className="text-sm font-semibold text-brand-700 truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/app/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    <User size={15} /> Profil Saya
                  </Link>
                  <Link
                    to="/app/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                  >
                    <Settings size={15} /> Ubah Password
                  </Link>
                  <div className="my-1 border-t border-neutral-100" />
                  <button
                    onClick={logout}
                    className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-danger-600 hover:bg-danger-50"
                  >
                    <LogOut size={15} /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tombol menu mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 rounded-lg"
            aria-label="Buka menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Overlay + drawer mobile */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`absolute top-0 right-0 h-full w-72 max-w-[85%] bg-brand-700 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
            mobileOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
            <span className="text-white font-semibold text-sm">Menu</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 text-white/80 hover:text-white"
              aria-label="Tutup menu"
            >
              <X size={22} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = item.isActive(pathname);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition ${
                    active
                      ? 'bg-amber-400/15 text-amber-300'
                      : 'text-white/80 hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-white/10 px-4 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-brand-700 flex items-center justify-center text-xs font-bold ring-2 ring-white/20">
                {initials || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                <p className="text-white/50 text-xs truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/15"
            >
              <LogOut size={16} />
              Keluar
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}