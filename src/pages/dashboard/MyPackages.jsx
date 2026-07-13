import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PackageSearch, Clock, GraduationCap, FileText, Video, ArrowRight,
  RefreshCw, ShoppingBag,
} from 'lucide-react';
import { packageService } from '../../services/packageService';

const ONLINE_CLASS_TYPES = ['privat', 'group', 'reguler'];
const NEAR_EXPIRY_DAYS = 7;

function getDaysLeft(endDate) {
  if (!endDate) return null;
  const diffMs = new Date(endDate) - new Date();
  return Math.ceil(diffMs / 86400000);
}

export default function MyPackages() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Cross-sell ───────────────────────────────────────────────────────
  // User di halaman ini sudah terbukti mau bayar, jadi ini kesempatan
  // bagus untuk menawarkan paket lain — bukan cuma menampilkan yang sudah
  // dimiliki. Dipakai endpoint rekomendasi yang sama dengan Beranda/
  // Packages, lalu paket yang sudah dimiliki disaring keluar.
  const [recommended, setRecommended] = useState([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);

  useEffect(() => {
    packageService.listMyPackages().then(setItems).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    packageService
      .getRecommendedPackages()
      .then((res) => setRecommended(res.packages || []))
      .catch(() => setRecommended([]))
      .finally(() => setLoadingRecommended(false));
  }, []);

  const ownedPackageIds = useMemo(
    () => new Set(items.map((item) => item.package_id ?? item.package?.id)),
    [items]
  );

  const crossSellPackages = useMemo(
    () => recommended.filter((pkg) => !ownedPackageIds.has(pkg.id)).slice(0, 3),
    [recommended, ownedPackageIds]
  );

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Paket Belajar Saya</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse h-56" />
          ))}
        </div>
      </div>
    );
  }

  // Aktif (termasuk yang hampir habis) tampil duluan, kedaluwarsa di
  // bawahnya — supaya paket yang masih relevan/bisa dipakai lebih mudah
  // ditemukan dulu, bukan tercampur acak sesuai urutan API.
  function sortByRelevance(list) {
    return [...list].sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      const aEnd = a.end_date ? new Date(a.end_date).getTime() : Infinity;
      const bEnd = b.end_date ? new Date(b.end_date).getTime() : Infinity;
      return aEnd - bEnd;
    });
  }

  const classItems = sortByRelevance(items.filter((item) => ONLINE_CLASS_TYPES.includes(item.package?.type)));
  const examItems = sortByRelevance(items.filter((item) => item.package?.type === 'latihan_soal'));

  function handleClick(item) {
    if (ONLINE_CLASS_TYPES.includes(item.package?.type)) {
      const classId = item.package?.classes?.[0]?.id;
      if (classId) {
        navigate(`/app/classes/${classId}`);
      }
      return;
    }
    navigate(`/app/packages/${item.package_id ?? item.package?.id}/exams`);
  }

  // Paket tidak auto-perpanjang (durasi tetap 1 tahun per pembelian), tapi
  // user tetap bisa beli paket yang sama lagi sebagai transaksi baru.
  function handleBuyAgain(item) {
    navigate(`/app/packages/${item.package_id ?? item.package?.id}`);
  }

  function PackageCard({ item }) {
    const isOnlineClass = ONLINE_CLASS_TYPES.includes(item.package?.type);
    const hasClass = isOnlineClass && item.package?.classes?.length > 0;

    const daysLeft = item.end_date ? getDaysLeft(item.end_date) : null;
    const isExpired = !item.is_active;
    const isNearExpiry = !isExpired && daysLeft !== null && daysLeft >= 0 && daysLeft <= NEAR_EXPIRY_DAYS;

    const price = item.package?.price;
    const discountPrice = item.package?.discount_price;
    const hasDiscount = discountPrice && Number(discountPrice) < Number(price);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md hover:border-brand-200 transition">
        <div className="h-24 bg-brand-600 flex items-center justify-center px-4">
          <p className="text-white font-bold text-center text-sm">{item.package?.name}</p>
        </div>

        <div className="p-5 flex flex-col flex-1">
          {isExpired ? (
            <span className="inline-flex w-fit items-center text-xs font-semibold px-2.5 py-1 rounded-full mb-3 bg-danger-100 text-danger-700">
              Kedaluwarsa
            </span>
          ) : isNearExpiry ? (
            <span className="inline-flex w-fit items-center text-xs font-semibold px-2.5 py-1 rounded-full mb-3 bg-warning-100 text-warning-700">
              Berakhir {daysLeft <= 0 ? 'hari ini' : `${daysLeft} hari lagi`}
            </span>
          ) : (
            <span className="inline-flex w-fit items-center text-xs font-semibold px-2.5 py-1 rounded-full mb-3 bg-success-100 text-success-700">
              Aktif
            </span>
          )}

          {item.end_date && (
            <p className="flex items-center gap-1.5 text-xs text-slate-400 mb-5">
              <Clock size={13} />
              {isExpired ? 'Berakhir' : 'Berlaku sampai'} {new Date(item.end_date).toLocaleDateString('id-ID')}
            </p>
          )}

          {isOnlineClass && !hasClass && !isExpired ? (
            <p className="mt-auto text-xs text-slate-400 text-center py-2.5">
              Kelas belum tersedia
            </p>
          ) : isExpired ? (
            <div className="mt-auto space-y-2">
              {price && (
                <p className="text-xs text-slate-500">
                  {hasDiscount && (
                    <span className="line-through text-slate-400 mr-1.5">
                      Rp{Number(price).toLocaleString('id-ID')}
                    </span>
                  )}
                  <span className="font-semibold text-slate-700">
                    Rp{Number(hasDiscount ? discountPrice : price).toLocaleString('id-ID')}
                  </span>
                </p>
              )}
              <button
                onClick={() => handleBuyAgain(item)}
                className="w-full flex items-center justify-center gap-2 bg-warning-600 text-white font-semibold py-2.5 rounded-lg hover:bg-warning-700 transition"
              >
                <RefreshCw size={15} />
                Beli Lagi
              </button>
              {(!isOnlineClass || hasClass) && (
                <button
                  onClick={() => handleClick(item)}
                  className="w-full text-xs font-medium text-slate-400 hover:text-slate-600 transition py-1"
                >
                  Lihat isi paket →
                </button>
              )}
            </div>
          ) : (
            <div className="mt-auto">
              <button
                onClick={() => handleClick(item)}
                className="w-full flex items-center justify-center gap-2 bg-brand-50 text-brand-700 font-semibold py-2.5 rounded-lg hover:bg-brand-100 transition"
              >
                {isOnlineClass ? 'Masuk Kelas' : 'Lihat Latihan Soal'}
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function CrossSellCard({ pkg }) {
    const hasDiscount = pkg.discount_price && Number(pkg.discount_price) < Number(pkg.price);
    const finalPrice = hasDiscount ? pkg.discount_price : pkg.price;

    return (
      <button
        onClick={() => navigate(`/app/packages/${pkg.id}`)}
        className="text-left bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 hover:border-brand-200 hover:shadow-sm transition"
      >
        <span className="shrink-0 w-11 h-11 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
          <ShoppingBag size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800 text-sm truncate">{pkg.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {hasDiscount && (
              <span className="line-through mr-1.5">Rp{Number(pkg.price).toLocaleString('id-ID')}</span>
            )}
            <span className="font-semibold text-brand-600">
              Rp{Number(finalPrice).toLocaleString('id-ID')}
            </span>
          </p>
        </div>
        <ArrowRight size={16} className="text-slate-300 shrink-0" />
      </button>
    );
  }

  if (items.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Paket Belajar Saya</h1>
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <PackageSearch className="mx-auto mb-3 text-slate-300" size={40} strokeWidth={1.5} />
          <p className="text-slate-500 mb-1">Kamu belum memiliki paket belajar aktif.</p>
          <p className="text-sm text-slate-400 mb-5">
            Yuk mulai belajar dengan memilih paket yang sesuai kebutuhanmu.
          </p>
          <button
            onClick={() => navigate('/app/packages')}
            className="bg-brand-600 text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-brand-700 transition"
          >
            Lihat Paket Belajar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Paket Belajar Saya</h1>

      {classItems.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Video size={18} className="text-brand-600" />
            <h2 className="text-lg font-bold text-slate-700">Kelas Online</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {classItems.map((item) => (
              <PackageCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {examItems.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-brand-600" />
            <h2 className="text-lg font-bold text-slate-700">Latihan Soal</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {examItems.map((item) => (
              <PackageCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {!loadingRecommended && crossSellPackages.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-700 mb-4">Paket Lain yang Mungkin Kamu Suka</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {crossSellPackages.map((pkg) => (
              <CrossSellCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}