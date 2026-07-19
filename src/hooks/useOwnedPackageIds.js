import { useState, useEffect } from 'react';
import { packageService } from '../services/packageService';

// Satu sumber kebenaran untuk "paket apa saja yang sudah dimiliki user" —
// dipakai di semua halaman yang menampilkan katalog paket (Beranda,
// Packages.jsx, PackageDetail's related packages) supaya paket yang sudah
// dibeli konsisten tidak muncul di mana pun, bukan cuma di satu halaman.
//
// PENTING: hanya enrollment yang `is_active` (backend: status 'active' DAN
// belum lewat end_date) yang dianggap "dimiliki". Enrollment dengan status
// pending/expired (transaksi gagal/kedaluwarsa) TIDAK dihitung, supaya
// paketnya tetap muncul di katalog dan bisa dibeli ulang.
export function useOwnedPackageIds() {
  const [ownedPackageIds, setOwnedPackageIds] = useState(new Set());
  const [loadingOwned, setLoadingOwned] = useState(true);

  useEffect(() => {
    let active = true;
    packageService
      .listMyPackages()
      .then((owned) => {
        if (!active) return;
        const activeIds = owned
          .filter((o) => o.is_active)
          .map((o) => o.package.id);
        setOwnedPackageIds(new Set(activeIds));
      })
      .catch(() => {
        if (active) setOwnedPackageIds(new Set()); // gagal diam-diam, jangan blokir katalog
      })
      .finally(() => {
        if (active) setLoadingOwned(false);
      });
    return () => { active = false; };
  }, []);

  return { ownedPackageIds, loadingOwned };
}
