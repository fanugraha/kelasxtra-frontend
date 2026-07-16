import { useState } from 'react';
import {
  Clock,
  RefreshCw,
  ArrowRight,
  Video,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
} from 'lucide-react';

const ONLINE_CLASS_TYPES = ['privat', 'group', 'reguler'];
const NEAR_EXPIRY_DAYS = 7;

function getDaysLeft(endDate) {
  if (!endDate) return null;
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((end - now) / 86400000);
}

function formatIDR(amount) {
  return `Rp${Number(amount).toLocaleString('id-ID')}`;
}

function StatusBadge({ isExpired, isNearExpiry, daysLeft }) {
  if (isExpired) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-danger-50 text-danger-700 ring-1 ring-danger-100">
        <XCircle size={13} strokeWidth={2.5} />
        Kedaluwarsa
      </span>
    );
  }
  if (isNearExpiry) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-warning-50 text-warning-700 ring-1 ring-warning-200">
        <AlertTriangle size={13} strokeWidth={2.5} />
        Berakhir {daysLeft <= 0 ? 'hari ini' : `${daysLeft} hari lagi`}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-success-50 text-success-700 ring-1 ring-success-100">
      <CheckCircle2 size={13} strokeWidth={2.5} />
      Aktif
    </span>
  );
}

function ProgressBar({ done, total }) {
  if (!total) return null;
  const pct = Math.min(100, Math.round((done / total) * 100));
  return (
    <div className="mt-2.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-neutral-500">Progres sesi</span>
        <span className="text-[11px] font-semibold text-neutral-500">{done}/{total}</span>
      </div>
      <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function MyPackageCard({ item, onOpen = () => {}, onBuyAgain = () => {} }) {
  const [imgError, setImgError] = useState(false);

  const isOnlineClass = ONLINE_CLASS_TYPES.includes(item.package?.type);
  const hasClass = isOnlineClass && item.package?.classes?.length > 0;

  const daysLeft = item.end_date ? getDaysLeft(item.end_date) : null;
  const isExpired = !item.is_active;
  const isNearExpiry = !isExpired && daysLeft !== null && daysLeft >= 0 && daysLeft <= NEAR_EXPIRY_DAYS;

  const price = item.package?.price;
  const discountPrice = item.package?.discount_price;
  const hasDiscount = Number(discountPrice) > 0 && Number(discountPrice) < Number(price);
  const finalPrice = hasDiscount ? discountPrice : price;

  const bannerUrl = item.package?.banner_image_url;
  const canViewContent = !isOnlineClass || hasClass;

  const sessionsTotal = item.package?.sessions_total;
  const sessionsDone = item.package?.sessions_done;

  return (
    <div className="group bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md hover:border-brand-200 hover:-translate-y-0.5 transition-all duration-200">
      <div className="shrink-0 w-full sm:w-44 aspect-video sm:aspect-auto sm:h-24 rounded-xl overflow-hidden bg-brand-700 flex items-center justify-center">
        {bannerUrl && !imgError ? (
          <img
            src={bannerUrl}
            alt={item.package?.name || 'Paket'}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : isOnlineClass ? (
          <Video className="text-white/70" size={28} strokeWidth={1.5} />
        ) : (
          <FileText className="text-white/70" size={28} strokeWidth={1.5} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-slate-800 text-base leading-snug mb-2 line-clamp-2">
          {item.package?.name}
        </h3>

        <div className="flex flex-col items-start gap-1.5">
          <StatusBadge isExpired={isExpired} isNearExpiry={isNearExpiry} daysLeft={daysLeft} />

          {item.end_date && (
            <time dateTime={item.end_date} className="flex items-center gap-1 text-xs text-slate-400">
              <Clock size={13} />
              {isExpired ? 'Berakhir' : 'Berlaku sampai'} {new Date(item.end_date).toLocaleDateString('id-ID')}
            </time>
          )}
        </div>

        {!isExpired && sessionsTotal > 0 && (
          <ProgressBar done={sessionsDone} total={sessionsTotal} />
        )}

        {isExpired && price && (
          <p className="text-xs text-slate-500 mt-2">
            {hasDiscount && (
              <span className="line-through text-slate-400 mr-1.5">{formatIDR(price)}</span>
            )}
            <span className="font-semibold text-slate-700">{formatIDR(finalPrice)}</span>
          </p>
        )}
      </div>

      <div className="shrink-0 w-full sm:w-auto flex flex-col sm:items-end gap-2">
        {isOnlineClass && !hasClass && !isExpired ? (
          <span className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-xs font-medium text-slate-500 border border-dashed border-slate-300 rounded-full px-4 py-2.5 whitespace-nowrap">
            <Sparkles size={13} />
            Segera hadir
          </span>
        ) : isExpired ? (
          <>
            <button
              onClick={onBuyAgain}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-brand-700 active:scale-[0.97] transition whitespace-nowrap"
            >
              <RefreshCw size={15} />
              Beli Lagi
            </button>
            {canViewContent && (
              <button
                onClick={onOpen}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 transition"
              >
                Lihat isi paket →
              </button>
            )}
          </>
        ) : (
          <button
            onClick={onOpen}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-600 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-brand-700 active:scale-[0.97] transition whitespace-nowrap group-hover:gap-3"
          >
            {isOnlineClass ? 'Masuk Kelas' : 'Lihat Latihan Soal'}
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}