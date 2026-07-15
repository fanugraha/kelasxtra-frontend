import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Package, ShoppingCart, Award, LogOut, Menu, X } from 'lucide-react';
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
    // aktif untuk halaman browse & detail paket (untuk dibeli)
    // BUKAN untuk /app/packages/:id/exams — itu milik "Paket Belajar Saya"
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
    // aktif untuk: daftar paket dimiliki, latihan soal dari paket dimiliki,
    // detail hasil ujian per exam, halaman pembahasan, dan kelas yang diikuti
    isActive: (pathname) =>
      pathname === '/app/my-packages' ||
      /^\/app\/packages\/[^/]+\/exams$/.test(pathname) ||
      /^\/app\/exams\/[^/]+$/.test(pathname) ||
      pathname.startsWith('/app/exam-attempts/') ||
      pathname.startsWith('/app/classes'),
  },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <nav className="bg-brand-600 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <span className="text-brand-600 font-bold text-sm">K</span>
              </div>
              <span className="text-white font-bold text-lg">Xtracademy</span>
            </div>

            <div className="hidden lg:flex items-center gap-1">
              {menuItems.map((item) => {
                const active = item.isActive(pathname);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      active
                        ? 'bg-white/15 text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-white/15 text-white flex items-center justify-center text-sm font-semibold">
              {initials || '?'}
            </div>
            <span className="text-white text-sm font-medium">{user?.name}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden p-2 text-white"
            aria-label="Buka menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-brand-700 px-4 pb-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive(pathname);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  active ? 'bg-white/15 text-white' : 'text-white/80'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}

          <div className="border-t border-white/15 mt-3 pt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/15 text-white flex items-center justify-center text-xs font-semibold">
                {initials || '?'}
              </div>
              <span className="text-white text-sm">{user?.name}</span>
            </div>
            <button onClick={logout} className="text-white/80 text-sm font-medium">
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}