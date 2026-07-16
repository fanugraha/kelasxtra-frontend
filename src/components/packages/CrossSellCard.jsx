import { ShoppingBag, ArrowRight } from 'lucide-react';

export default function CrossSellCard({ pkg, onSelect }) {
  const hasDiscount = pkg.discount_price && Number(pkg.discount_price) < Number(pkg.price);
  const finalPrice = hasDiscount ? pkg.discount_price : pkg.price;
  const bannerUrl = pkg.banner_image_url;

  return (
    <button
      onClick={onSelect}
      className="text-left bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 hover:border-brand-200 hover:shadow-sm transition"
    >
      <span className="shrink-0 w-11 h-11 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center overflow-hidden">
        {bannerUrl ? (
          <img src={bannerUrl} alt={pkg.name} className="w-full h-full object-cover" />
        ) : (
          <ShoppingBag size={18} />
        )}
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