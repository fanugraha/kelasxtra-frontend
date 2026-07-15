import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { packageService } from '../../services/packageService';
import { articleService } from '../../services/articleService';
import { promoService } from '../../services/promoService';
import { tutorService } from '../../services/tutorService';
import { testimonialService } from '../../services/testimonialService';
import { useAuth } from '../../context/AuthContext';
import CategoryModal from '../../components/public/CategoryModal';
import Footer from '../../components/layout/Footer';
import PackageCard from '../../components/packages/PackageCard';

const FAQS = [
  {
    q: 'Apa bedanya Try Out Fulltest dan Persubtes + Bundling?',
    a: 'Fulltest berisi soal lengkap semua subtes dalam satu paket sesuai simulasi ujian asli. Persubtes + Bundling memecah latihan per subtes supaya kamu bisa fokus memperkuat bagian yang masih lemah.',
  },
  {
    q: 'Kapan nilai, ranking, dan pembahasan Try Out bisa dilihat?',
    a: 'Nilai dan pembahasan langsung muncul begitu kamu menyelesaikan Try Out. Ranking di leaderboard diperbarui otomatis setiap ada peserta baru yang submit.',
  },
  {
    q: 'Apakah materi antar kategori berbeda?',
    a: 'Ya. Soal dan pembahasan disesuaikan dengan kisi-kisi resmi masing-masing kategori (SNBT, CPNS/SKD, BUMN, dan Ujian Mandiri).',
  },
  {
    q: 'Masa akses paket belajar sampai kapan?',
    a: 'Mengikuti masa aktif yang tertulis di masing-masing paket saat kamu membelinya — bisa dicek lagi di halaman Paket Saya setelah login.',
  },
];

const HERO_TAGS = ['CPNS', 'P3K', 'BUMN', 'SNBT'];

// NOTE: angka di bawah ini contoh saja — ganti dengan data asli sebelum tayang.
const STATS = [
  { value: 12450, suffix: '+', decimals: 0, label: 'Peserta Terdaftar' },
  { value: 87, suffix: '%', decimals: 0, label: 'Lolos Tahap SKD' },
  { value: 4.9, suffix: '/5', decimals: 1, label: 'Rating Pengguna' },
];

const BENEFITS = [
  {
    icon: 'target',
    title: 'Soal Sesuai Kisi-Kisi',
    desc: 'Try out disusun mengikuti pola soal resmi tiap kategori ujian, jadi latihanmu nggak buang waktu.',
  },
  {
    icon: 'book',
    title: 'Pembahasan Lengkap',
    desc: 'Tiap soal dilengkapi pembahasan supaya kamu paham konsepnya, bukan cuma tahu jawabannya.',
  },
  {
    icon: 'trophy',
    title: 'Ranking Nasional',
    desc: 'Leaderboard membandingkan hasilmu dengan peserta lain sehingga kamu tahu posisimu.',
  },
  {
    icon: 'calendar',
    title: 'Kelas & Materi Terstruktur',
    desc: 'Jadwal kelas dan materi belajar tersusun rapi, bisa diakses kapan saja dari Beranda kamu.',
  },
];

const PACKAGE_TYPE_LABEL = {
  privat: 'Privat',
  group: 'Kelas Grup',
  latihan_soal: 'Latihan Soal',
  reguler: 'Reguler',
};

// Gradasi hangat orange→red yang sama dengan promo card di Dashboard
// (Beranda.jsx & Packages.jsx), supaya bahasa visual "promo" konsisten
// di seluruh aplikasi — bukan cuma di area login.
const PROMO_GRADIENT = 'linear-gradient(120deg, #f97316 0%, #ef4444 35%, #dc2626 65%, #f97316 100%)';

function BenefitIcon({ name }) {
  const common = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'target':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5Z" />
          <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
          <path d="m9 10.5 2 2 4-4.5" />
        </svg>
      );
    case 'trophy':
      return (
        <svg {...common}>
          <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
          <path d="M8 5H5a3 3 0 0 0 3 4" />
          <path d="M16 5h3a3 3 0 0 1-3 4" />
          <path d="M10 15.5h4" />
          <path d="M12 13v6.5" />
          <path d="M8.5 19.5h7" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M3.5 9.5h17" />
          <path d="M8 3v4M16 3v4" />
          <path d="m8.5 14 2 2 4-4" />
        </svg>
      );
    case 'tag':
      return (
        <svg {...common}>
          <path d="M20.5 12.8 12.2 21a1 1 0 0 1-1.4 0l-7.8-7.8a1 1 0 0 1 0-1.4L11.3 3.5a2 2 0 0 1 1.4-.6H19a1.5 1.5 0 0 1 1.5 1.5v6.4a2 2 0 0 1-.6 1.4Z" />
          <circle cx="16" cy="8" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...common} strokeWidth={1.6}>
          <path d="M12 3v4M12 17v4M4.2 6.2l2.8 2.8M17 15l2.8 2.8M3 12h4M17 12h4M4.2 17.8 7 15M17 9l2.8-2.8" />
          <path d="M12 8.5 13 11l2.5 1-2.5 1-1 2.5-1-2.5L8.5 12l2.5-1 1-2.5Z" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      return null;
  }
}

function StarRow({ rating = 5 }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${rating} dari 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="14" height="14" viewBox="0 0 24 24" fill={n <= rating ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="1.5">
          <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  );
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'reveal-visible' : ''} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

function StatCounter({ value, suffix = '', decimals = 0, label }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame;
    let start;
    const duration = 1600;
    function tick(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className="text-center px-2">
      <div className="font-display tabular-nums text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
        {display.toLocaleString('id-ID', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
        {suffix}
      </div>
      <div className="text-[11px] sm:text-xs md:text-sm text-brand-100 mt-1 tracking-wide">{label}</div>
    </div>
  );
}

// Section wrapper yang tetap tampil rapi walau data belum ada, alih-alih
// menghilang begitu saja dan membuat halaman terasa bolong.
function EmptyState({ icon = 'tag', message }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6 rounded-2xl border border-dashed border-brand-200 bg-white/60">
      <div className="w-11 h-11 rounded-xl bg-brand-100 text-brand-500 flex items-center justify-center mb-3">
        <BenefitIcon name={icon} />
      </div>
      <p className="text-sm text-neutral-500 max-w-xs">{message}</p>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryModalIntent, setCategoryModalIntent] = useState('filter'); // 'filter' | 'login' | 'buy'
  const [pendingPackageId, setPendingPackageId] = useState(null);

  const [selectedProgram, setSelectedProgram] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  const [promos, setPromos] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(true);

  const [tutors, setTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(true);

  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  const [openFaq, setOpenFaq] = useState(null);

  const packagesRequestRef = useRef(0);
  const articlesRequestRef = useRef(0);

  useEffect(() => {
    packageService.getPrograms().then(setPrograms).finally(() => setLoadingPrograms(false));
  }, []);

  useEffect(() => {
    promoService.listActive().then(setPromos).catch(() => setPromos([])).finally(() => setLoadingPromos(false));
  }, []);

  useEffect(() => {
    tutorService.listFeatured().then(setTutors).catch(() => setTutors([])).finally(() => setLoadingTutors(false));
  }, []);

  useEffect(() => {
    testimonialService
      .listFeatured()
      .then(setTestimonials)
      .catch(() => setTestimonials([]))
      .finally(() => setLoadingTestimonials(false));
  }, []);

  const loadPackages = useCallback((programId) => {
    const requestId = ++packagesRequestRef.current;
    setLoadingPackages(true);
    const request = programId
      ? packageService.listPackages(programId)
      : packageService.getRecommendedPackages().then((res) => res.packages);

    request
      .then((data) => {
        if (requestId !== packagesRequestRef.current) return; // hasil basi, diabaikan
        setPackages(data);
      })
      .catch(() => {
        if (requestId !== packagesRequestRef.current) return;
        setPackages([]);
      })
      .finally(() => {
        if (requestId !== packagesRequestRef.current) return;
        setLoadingPackages(false);
      });
  }, []);

  const loadArticles = useCallback((programId) => {
    const requestId = ++articlesRequestRef.current;
    setLoadingArticles(true);
    articleService
      .listArticles({ programId, perPage: 3 })
      .then((res) => {
        if (requestId !== articlesRequestRef.current) return;
        setArticles(res.data || []);
      })
      .catch(() => {
        if (requestId !== articlesRequestRef.current) return;
        setArticles([]);
      })
      .finally(() => {
        if (requestId !== articlesRequestRef.current) return;
        setLoadingArticles(false);
      });
  }, []);

  useEffect(() => {
    loadPackages(selectedProgram?.id);
    loadArticles(selectedProgram?.id);
  }, [selectedProgram, loadPackages, loadArticles]);

  function goToApp() {
    navigate(isAuthenticated ? '/app/dashboard' : '/login');
  }

  function handleSelectCategory(program) {
    // Preferensi kategori disimpan ke localStorage HANYA saat memang untuk
    // memfilter tampilan landing page (intent 'filter'). Untuk intent 'login'
    // atau 'buy', jangan disimpan di sini — biar tidak nempel ke browser
    // sebelum user benar-benar login, yang berisiko salah nempel ke akun lain.
    if (categoryModalIntent === 'filter') {
      localStorage.setItem('preferred_program_id', program.id);
    }

    setSelectedProgram(program);
    setShowCategoryModal(false);

    if (categoryModalIntent === 'login') {
      goToApp();
    } else if (categoryModalIntent === 'buy' && pendingPackageId) {
      navigate(isAuthenticated ? `/app/packages/${pendingPackageId}` : '/login');
      setPendingPackageId(null);
    }
  }

  function handleSkipCategory() {
    if (categoryModalIntent === 'filter') {
      localStorage.removeItem('preferred_program_id');
      setSelectedProgram(null);
    }

    setShowCategoryModal(false);

    if (categoryModalIntent === 'login') {
      goToApp();
    } else if (categoryModalIntent === 'buy' && pendingPackageId) {
      navigate(isAuthenticated ? `/app/packages/${pendingPackageId}` : '/login');
      setPendingPackageId(null);
    }
  }

  function openCategoryModal(intent) {
    setCategoryModalIntent(intent);
    setShowCategoryModal(true);
  }

  function handleMasukClick() {
    if (isAuthenticated) {
      navigate('/app/dashboard');
      return;
    }
    openCategoryModal('login');
  }

  function handleBeliPaket(pkg) {
    if (isAuthenticated) {
      navigate(`/app/packages/${pkg.id}`);
      return;
    }
    setPendingPackageId(pkg.id);
    openCategoryModal('buy');
  }

  function formatTanggal(dateStr) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        .font-display { font-family: 'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif; }

        .reveal { opacity: 0; transform: translateY(18px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .reveal-visible { opacity: 1; transform: translateY(0); }

        .radar-rings { position: absolute; top: 50%; left: 50%; width: 900px; height: 900px; transform: translate(-50%, -50%); pointer-events: none; }
        .radar-ring { position: absolute; inset: 0; border-radius: 9999px; border: 1px solid rgba(255,255,255,0.14); }
        .radar-ring.r1 { animation: radarPulse 4.2s ease-out infinite; }
        .radar-ring.r2 { animation: radarPulse 4.2s ease-out infinite; animation-delay: 1.4s; }
        .radar-ring.r3 { animation: radarPulse 4.2s ease-out infinite; animation-delay: 2.8s; }
        @keyframes radarPulse {
          0% { transform: scale(0.28); opacity: 0; }
          12% { opacity: 0.55; }
          100% { transform: scale(1); opacity: 0; }
        }

        .cta-primary { transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease; }
        .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 24px -8px rgba(245, 158, 11, 0.55); }
        .cta-primary:active { transform: translateY(0); }

        .hscroll { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .hscroll::-webkit-scrollbar { display: none; }
        .hscroll > * { scroll-snap-align: start; }

        @keyframes promoFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          60%, 100% { transform: translateX(100%); }
        }
        .promo-flow { background-size: 200% 200%; animation: promoFlow 10s ease infinite; }
        .promo-shimmer { animation: shimmerSweep 3s ease-in-out infinite; }
        .ribbon-flow { background-size: 200% 200%; animation: promoFlow 6s ease infinite; }

        @media (prefers-reduced-motion: reduce) {
          .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
          .radar-ring { animation: none !important; opacity: 0.12 !important; }
          .cta-primary:hover { transform: none !important; }
          .promo-flow, .ribbon-flow { animation: none !important; }
          .promo-shimmer { display: none !important; }
        }
      `}</style>

      <header className="sticky top-0 z-40 bg-brand-600/95 backdrop-blur text-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <span className="font-display font-extrabold text-lg tracking-tight">Xtracademy</span>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#promo" className="hover:text-brand-100 transition-colors">Promo</a>
            <a href="#paket" className="hover:text-brand-100 transition-colors">Paket Belajar</a>
            <a href="#tutor" className="hover:text-brand-100 transition-colors">Tutor</a>
            <a href="#artikel" className="hover:text-brand-100 transition-colors">Artikel</a>
            <a href="#faq" className="hover:text-brand-100 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <button
              onClick={handleMasukClick}
              className="text-sm font-semibold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
            >
              {isAuthenticated ? 'Buka Dashboard' : 'Masuk'}
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-brand-600 text-white">
        <div className="radar-rings" aria-hidden="true">
          <span className="radar-ring r1" />
          <span className="radar-ring r2" />
          <span className="radar-ring r3" />
        </div>
        <div className="pointer-events-none absolute -top-32 -right-20 w-[28rem] h-[28rem] bg-brand-400/20 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 w-80 h-80 bg-brand-300/10 rounded-full blur-3xl" />

        <div className="relative max-w-3xl mx-auto px-4 md:px-6 pt-20 pb-14 md:pt-28 md:pb-20 text-center">
          <span className="inline-block bg-white/10 border border-white/20 text-brand-50 text-xs font-semibold tracking-wide px-3 py-1.5 rounded-full mb-6">
            Try Out &middot; Kelas &middot; Pembahasan Lengkap
          </span>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold mb-5 leading-[1.08] tracking-tight">
            Belajar Terarah,
            <br />
            <span className="text-amber-300">Hasil Mengesankan</span>
          </h1>

          <p className="text-brand-100 text-base md:text-lg max-w-xl mx-auto mb-9">
            Try out, kelas, dan pembahasan yang disusun sesuai kategori ujianmu —
            SNBT, CPNS, BUMN, dan Ujian Mandiri.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
            <button
              onClick={() => openCategoryModal('filter')}
              className="cta-primary bg-amber-400 text-brand-900 font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-black/10"
            >
              {selectedProgram ? `Kategori: ${selectedProgram.name} · Ganti` : 'Pilih Kategori & Mulai'}
            </button>
            <a
              href="#paket"
              className="border border-white/30 font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition"
            >
              Lihat Paket Belajar
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-14">
            {HERO_TAGS.map((tag) => (
              <span
                key={tag}
                className="bg-white/10 border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto pt-8 border-t border-white/15">
            {STATS.map((stat) => (
              <StatCounter key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      <section id="promo" className="bg-orange-50/60 py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal className="flex items-center justify-between mb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-widest text-orange-600 uppercase">
                <BenefitIcon name="sparkles" />
                Jangan Lewatkan
              </span>
              <h2 className="font-display text-xl md:text-2xl font-extrabold text-brand-700 mt-1">Promo Aktif</h2>
            </div>
          </Reveal>

          {loadingPromos ? (
            <div className="hscroll gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="shrink-0 w-72 h-40 bg-white/70 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : promos.length === 0 ? (
            <EmptyState icon="tag" message="Belum ada promo aktif saat ini — pantau terus, promo baru akan tampil di sini." />
          ) : (
            <div className="hscroll gap-4 pb-2">
              {promos.map((promo, i) => (
                <Reveal key={promo.id} delay={i * 80} className="shrink-0 w-72 sm:w-80">
                  <div
                    className="promo-flow relative overflow-hidden rounded-2xl p-5 text-white shadow-lg shadow-orange-900/10 transition-transform duration-300 hover:-translate-y-1 h-full flex flex-col"
                    style={{ backgroundImage: PROMO_GRADIENT }}
                  >
                    <div className="pointer-events-none absolute -top-10 -right-8 w-32 h-32 rounded-full bg-white/15 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-12 -left-8 w-36 h-36 rounded-full bg-yellow-300/15 blur-2xl" />

                    <div className="relative flex flex-col h-full">
                      <span className="relative inline-flex items-center gap-1.5 self-start overflow-hidden bg-white/20 text-xs font-bold px-2.5 py-1 rounded-full mb-3">
                        {promo.discount_type === 'percentage'
                          ? `Diskon ${promo.discount_value}%`
                          : `Potongan Rp${Number(promo.discount_value).toLocaleString('id-ID')}`}
                        <span className="promo-shimmer pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
                      </span>
                      <h3 className="font-semibold leading-snug mb-1">{promo.title}</h3>
                      {promo.description && (
                        <p className="text-sm text-white/85 mb-3 line-clamp-2">{promo.description}</p>
                      )}
                      <div className="mt-auto flex items-center justify-between text-xs text-white/80 pt-3 border-t border-white/20">
                        <span className="font-mono bg-white/15 px-2 py-1 rounded font-semibold">{promo.code}</span>
                        <span>s.d. {formatTanggal(promo.valid_until)}</span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="paket" className="bg-brand-50 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest text-amber-600 uppercase">Pilihan Paket</span>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-700 mt-2 mb-2">Paket Belajar</h2>
            <p className="text-neutral-500">
              {selectedProgram
                ? `Paket belajar untuk kategori ${selectedProgram.name}`
                : 'Pilih kategori di atas untuk melihat paket yang paling relevan buat kamu'}
            </p>
          </Reveal>

          {loadingPackages ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 bg-white rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <EmptyState icon="calendar" message="Belum ada paket untuk kategori ini — coba pilih kategori lain atau kembali lagi nanti." />
          ) : (
            <div className="grid md:grid-cols-3 gap-6 items-start">
              {packages.map((pkg, idx) => (
                <Reveal key={pkg.id} delay={idx * 80}>
                  <PackageCard
                    pkg={pkg}
                    onOpen={() => handleBeliPaket(pkg)}
                    popular={packages.length > 1 && idx === 1}
                    typeBadgeLabel={pkg.type ? PACKAGE_TYPE_LABEL[pkg.type] || pkg.type : null}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="tutor" className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <Reveal className="text-center mb-12">
          <span className="text-xs font-bold tracking-widest text-amber-600 uppercase">Pengajar</span>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-700 mt-2 mb-2">Kenalan dengan Tutor Kami</h2>
          <p className="text-neutral-500">Berpengalaman menyiapkan peserta untuk ujian sesungguhnya</p>
        </Reveal>

        {loadingTutors ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 bg-neutral-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : tutors.length === 0 ? (
          <EmptyState icon="user" message="Profil tutor akan tampil di sini setelah tersedia." />
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {tutors.map((tutor, i) => (
              <Reveal key={tutor.id} delay={i * 80}>
                <div className="rounded-2xl border border-brand-100 p-6 h-full flex flex-col items-center text-center hover:shadow-lg transition-shadow">
                  <div className="w-20 h-20 rounded-full bg-brand-100 overflow-hidden mb-4 flex items-center justify-center text-brand-500">
                    {tutor.photo ? (
                      <img src={tutor.photo} alt={tutor.name} className="w-full h-full object-cover" />
                    ) : (
                      <BenefitIcon name="user" />
                    )}
                  </div>
                  <h3 className="font-semibold text-brand-700">{tutor.name}</h3>
                  {tutor.expertise && <p className="text-sm text-amber-600 font-medium mt-0.5">{tutor.expertise}</p>}
                  {tutor.bio && <p className="text-sm text-neutral-500 mt-2 line-clamp-3">{tutor.bio}</p>}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <section className="bg-brand-50 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest text-amber-600 uppercase">Kata Mereka</span>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-700 mt-2 mb-2">Pengalaman Peserta</h2>
          </Reveal>

          {loadingTestimonials ? (
            <div className="hscroll gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="shrink-0 w-80 h-48 bg-white/70 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : testimonials.length === 0 ? (
            <EmptyState icon="user" message="Testimoni peserta akan tampil di sini setelah tersedia." />
          ) : (
            <div className="hscroll gap-5 pb-2">
              {testimonials.map((t) => (
                <div key={t.id} className="shrink-0 w-80 bg-white rounded-2xl border border-brand-100 p-6 flex flex-col">
                  <StarRow rating={t.rating} />
                  <p className="text-sm text-neutral-600 mt-3 mb-4 flex-1">&ldquo;{t.content}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 overflow-hidden flex items-center justify-center text-brand-500 shrink-0">
                      {t.photo ? (
                        <img src={t.photo} alt={t.name} className="w-full h-full object-cover" />
                      ) : (
                        <BenefitIcon name="user" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-brand-700">{t.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="artikel" className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <Reveal className="text-center mb-10">
          <span className="text-xs font-bold tracking-widest text-amber-600 uppercase">Insight</span>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-700 mt-2 mb-2">Artikel Terupdate</h2>
          <p className="text-neutral-500">Info dan tips seputar SNBT, SKD CPNS, dan BUMN</p>
        </Reveal>

        {loadingArticles ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-neutral-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <EmptyState icon="book" message="Belum ada artikel untuk kategori ini." />
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {articles.map((article, i) => (
              <Reveal key={article.id} delay={i * 80}>
                <Link
                  to={`/artikel/${article.slug}`}
                  className="group block h-full rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="h-40 bg-neutral-100 overflow-hidden">
                    {article.thumbnail_url && (
                      <img
                        src={article.thumbnail_url}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-brand-700 leading-snug group-hover:text-brand-600 transition-colors">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{article.excerpt}</p>
                    )}
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}

        <div className="text-center mt-10">
          <Link
            to="/artikel"
            className="inline-block bg-brand-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-brand-700 transition"
          >
            Artikel Lainnya
          </Link>
        </div>
      </section>

      <section id="keunggulan" className="bg-brand-50 py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <Reveal className="text-center mb-12">
            <span className="text-xs font-bold tracking-widest text-amber-600 uppercase">Mengapa Xtracademy</span>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-700 mt-2 mb-2">Kenapa Belajar di Xtracademy</h2>
          </Reveal>
          <div className="grid md:grid-cols-2 gap-6">
            {BENEFITS.map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="flex gap-4 p-6 rounded-2xl bg-white hover:shadow-md transition-shadow h-full">
                  <div className="w-11 h-11 shrink-0 rounded-xl bg-brand-600 text-white flex items-center justify-center">
                    <BenefitIcon name={item.icon} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-700 mb-1">{item.title}</h3>
                    <p className="text-sm text-neutral-500">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="max-w-3xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <Reveal className="text-center mb-10">
          <span className="text-xs font-bold tracking-widest text-amber-600 uppercase">Bantuan</span>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-brand-700 mt-2">
            Pertanyaan yang Sering Ditanyakan
          </h2>
        </Reveal>
        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openFaq === i;
            const panelId = `faq-panel-${i}`;
            const buttonId = `faq-button-${i}`;
            return (
              <Reveal key={i} delay={i * 60}>
                <div className="bg-white rounded-xl border border-brand-100 overflow-hidden">
                  <button
                    id={buttonId}
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-medium text-brand-700 hover:bg-brand-50/60 transition-colors"
                  >
                    {faq.q}
                    <svg
                      className={`shrink-0 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  {isOpen && (
                    <p id={panelId} role="region" aria-labelledby={buttonId} className="px-5 pb-4 text-sm text-neutral-500">
                      {faq.a}
                    </p>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <Footer />

      {showCategoryModal && (
        <CategoryModal
          programs={programs}
          loading={loadingPrograms}
          onSelect={handleSelectCategory}
          onSkip={handleSkipCategory}
          onClose={() => setShowCategoryModal(false)}
          title={categoryModalIntent === 'filter' ? 'Kamu mau persiapan apa?' : 'Masuk'}
          subtitle={
            categoryModalIntent === 'filter'
              ? 'Pilih kategori supaya Beranda kamu langsung terarah sesuai kebutuhan.'
              : 'Pilih kategori dulu ya, biar Beranda kamu langsung sesuai kebutuhan.'
          }
        />
      )}
    </div>
  );
}