import { useState } from 'react';
import { X, Tag, Check, Loader2 } from 'lucide-react';
import { packageService } from '../services/packageService';

export default function CheckoutModal({ pkg, onClose, onConfirm, confirming }) {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [validating, setValidating] = useState(false);
  const [promoError, setPromoError] = useState('');

  const basePrice = Number(pkg.discount_price ?? pkg.price);
  const finalAmount = appliedPromo ? appliedPromo.final_amount : basePrice;

  async function handleApplyPromo() {
    if (!promoCode.trim()) return;
    setValidating(true);
    setPromoError('');
    try {
      const result = await packageService.validatePromo(promoCode.trim(), pkg.id);
      setAppliedPromo(result);
    } catch (err) {
      setPromoError(err.response?.data?.message || 'Kode promo tidak valid.');
      setAppliedPromo(null);
    } finally {
      setValidating(false);
    }
  }

  function handleRemovePromo() {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Pilih Metode Pembayaran</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="bg-slate-50 rounded-xl p-4 mb-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-500">Total Pembayaran</span>
              <span className="text-xl font-bold text-brand-700">
                Rp{finalAmount.toLocaleString('id-ID')}
              </span>
            </div>
            {appliedPromo && (
              <div className="flex items-center justify-between text-xs text-success-700">
                <span>Diskon promo ({appliedPromo.promo.code})</span>
                <span>-Rp{Number(appliedPromo.discount_amount).toLocaleString('id-ID')}</span>
              </div>
            )}
          </div>

          <p className="text-sm text-slate-600 mb-2">Tambah hemat pakai promo</p>

          {appliedPromo ? (
            <div className="flex items-center justify-between bg-success-50 border border-success-100 rounded-lg px-4 py-3 mb-1">
              <div className="flex items-center gap-2 text-success-700 text-sm font-semibold">
                <Check size={16} />
                Kode {appliedPromo.promo.code} diterapkan
              </div>
              <button
                onClick={handleRemovePromo}
                className="text-xs text-slate-400 hover:text-danger-600 font-medium"
              >
                Hapus
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mb-1">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Kode promo"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-500"
                />
              </div>
              <button
                onClick={handleApplyPromo}
                disabled={validating || !promoCode.trim()}
                className="bg-brand-600 text-white font-semibold px-5 rounded-lg hover:bg-brand-700 disabled:opacity-50 text-sm flex items-center gap-1.5"
              >
                {validating && <Loader2 size={14} className="animate-spin" />}
                Terapkan
              </button>
            </div>
          )}
          {promoError && <p className="text-xs text-danger-600 mb-4">{promoError}</p>}
          {!promoError && <div className="mb-4" />}

          <p className="text-xs text-slate-400 mb-6">
            Pembayaran diproses aman melalui Midtrans — mendukung QRIS, transfer virtual account, dan e-wallet.
          </p>

          <button
            onClick={() => onConfirm(appliedPromo ? promoCode.trim() : null)}
            disabled={confirming}
            className="w-full bg-brand-700 text-white font-bold py-3.5 rounded-lg hover:bg-brand-800 disabled:opacity-50 transition"
          >
            {confirming ? 'Memproses...' : 'Beli Paket Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
}
