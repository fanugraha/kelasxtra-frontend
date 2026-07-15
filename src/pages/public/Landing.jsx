import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { packageService } from '../../services/packageService';
import { articleService } from '../../services/articleService';
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

  const [openFaq, setOpenFaq] = useState(null);

  const packagesRequestRef = useRef(0);
  const articlesRequestRef = useRef(0);

  useEffect(() => {
    packageService.getPrograms().then(setPrograms).finally(() => setLoadingPrograms(false));
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
    // User yang sudah login tidak perlu diminta pilih kategori lagi —
    // langsung arahkan ke dashboard.
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

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-brand-600 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <span className="font-bold text-lg">Kelasxtra</span>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#artikel" className="hover:text-brand-100">Artikel</a>
            <a href="#paket" className="hover:text-brand-100">Paket Belajar</a>
            <a href="#keunggulan" className="hover:text-brand-100">Keunggulan</a>
            <a href="#faq" className="hover:text-brand-100">FAQ</a>
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

      <section className="bg-brand-600 text-white">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Belajar Terarah,<br />Hasil Mengesankan
          </h1>
          <p className="text-brand-100 max-w-xl mx-auto mb-8">
            Try out, kelas, dan pembahasan yang disusun sesuai kategori ujianmu —
            SNBT, CPNS, BUMN, dan Ujian Mandiri.
          </p>
          <button
            onClick={() => openCategoryModal('filter')}
            className="bg-white text-brand-600 font-semibold px-6 py-3 rounded-xl hover:bg-brand-50 transition"
          >
            {selectedProgram ? `Kategori: ${selectedProgram.name} · Ganti` : 'Pilih Kategori & Mulai'}
          </button>
        </div>
      </section>

      <section id="artikel" className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-600 mb-2">Artikel Terupdate</h2>
          <p className="text-neutral-500">Info dan tips seputar SNBT, SKD CPNS, dan BUMN</p>
        </div>

        {loadingArticles ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-neutral-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="text-center text-neutral-500">Belum ada artikel untuk kategori ini.</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                to={`/artikel/${article.slug}`}
                className="block rounded-xl border border-brand-100 overflow-hidden hover:shadow-md transition"
              >
                <div className="h-40 bg-neutral-100">
                  {article.thumbnail_url && (
                    <img
                      src={article.thumbnail_url}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-brand-700 leading-snug">{article.title}</h3>
                  {article.excerpt && (
                    <p className="text-sm text-neutral-500 mt-2 line-clamp-2">{article.excerpt}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-8">
          <Link
            to="/artikel"
            className="inline-block bg-brand-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-brand-700 transition"
          >
            Artikel Lainnya
          </Link>
        </div>
      </section>

      <section id="paket" className="bg-brand-50 py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-brand-600 mb-2">Paket Belajar</h2>
            <p className="text-neutral-500">
              {selectedProgram
                ? `Paket belajar untuk kategori ${selectedProgram.name}`
                : 'Pilih kategori di atas untuk melihat paket yang paling relevan buat kamu'}
            </p>
          </div>

          {loadingPackages ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-72 bg-white rounded-xl animate-pulse" />
              ))}
            </div>
          ) : packages.length === 0 ? (
            <p className="text-center text-neutral-500">Belum ada paket untuk kategori ini.</p>
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

      <section id="keunggulan" className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-600 mb-2">Kenapa Belajar di Kelasxtra</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            ['Soal Sesuai Kisi-Kisi', 'Try out disusun mengikuti pola soal resmi tiap kategori ujian, jadi latihanmu nggak buang waktu.'],
            ['Pembahasan Lengkap', 'Tiap soal dilengkapi pembahasan supaya kamu paham konsepnya, bukan cuma tahu jawabannya.'],
            ['Ranking Nasional', 'Leaderboard membandingkan hasilmu dengan peserta lain sehingga kamu tahu posisimu.'],
            ['Kelas & Materi Terstruktur', 'Jadwal kelas dan materi belajar tersusun rapi, bisa diakses kapan saja dari Beranda kamu.'],
          ].map(([title, desc]) => (
            <div key={title} className="flex gap-4 p-5 rounded-xl bg-brand-50">
              <div className="w-2 bg-brand-600 rounded-full shrink-0" />
              <div>
                <h3 className="font-semibold text-brand-700 mb-1">{title}</h3>
                <p className="text-sm text-neutral-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="bg-brand-50 py-16">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-600 text-center mb-10">
            Pertanyaan yang Sering Ditanyakan
          </h2>
          <div className="space-y-3">
            {FAQS.map((faq, i) => {
              const isOpen = openFaq === i;
              const panelId = `faq-panel-${i}`;
              const buttonId = `faq-button-${i}`;
              return (
                <div key={i} className="bg-white rounded-xl border border-brand-100">
                  <button
                    id={buttonId}
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    className="w-full flex items-center justify-between px-5 py-4 text-left font-medium text-brand-700"
                  >
                    {faq.q}
                    <span className="text-neutral-500" aria-hidden="true">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <p id={panelId} role="region" aria-labelledby={buttonId} className="px-5 pb-4 text-sm text-neutral-500">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
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