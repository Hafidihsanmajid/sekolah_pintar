export type SystemRole = 'super_admin' | 'admin_tu' | 'kepala_sekolah';

export interface MenuConfig {
  key: string;
  label: string;
  description: string;
  subMenus?: string[];
}

export const SYSTEM_MENUS: MenuConfig[] = [
  {
    key: 'master_data',
    label: 'Master Data',
    description: 'Akses data siswa, kelas & tahun ajaran, dan tarif pembayaran',
    subMenus: ['Data Siswa', 'Kelas & Tahun Ajaran', 'Tarif Pembayaran'],
  },
  {
    key: 'transaksi',
    label: 'Transaksi Pembayaran',
    description: 'Akses kasir pembayaran SPP/biaya dan riwayat transaksi',
    subMenus: ['Kasir Pembayaran', 'Riwayat Transaksi'],
  },
  {
    key: 'keuangan',
    label: 'Keuangan',
    description: 'Akses input kas keluar, laporan uang masuk, dan laporan uang keluar',
    subMenus: ['Input Uang Keluar', 'Laporan Uang Masuk', 'Laporan Uang Keluar'],
  },
  {
    key: 'pengaturan',
    label: 'Pengaturan Sistem',
    description: 'Akses konfigurasi profil sekolah dan utilitas identitas instansi',
    subMenus: ['Profil Sekolah', 'Keamanan & Sandi'],
  },
];

export const ROLE_DEFINITIONS: Record<
  SystemRole,
  { label: string; description: string; badgeVariant: 'paid' | 'info' | 'neutral' }
> = {
  super_admin: {
    label: 'Super Administrator',
    description: 'Memiliki kendali penuh seluruh modul, manajemen hak akses, dan pembatalan void.',
    badgeVariant: 'paid',
  },
  admin_tu: {
    label: 'Admin Tata Usaha',
    description: 'Staf pelaksana administrasi data siswa, tarif pembayaran, dan penerimaan kas kasir.',
    badgeVariant: 'info',
  },
  kepala_sekolah: {
    label: 'Kepala Sekolah',
    description: 'Pimpinan sekolah dengan akses pemantauan laporan penerimaan dan pengeluaran.',
    badgeVariant: 'neutral',
  },
};

export const DEFAULT_ROLE_PERMISSIONS: Record<SystemRole, string[]> = {
  super_admin: ['master_data', 'transaksi', 'keuangan', 'pengaturan'],
  admin_tu: ['master_data', 'transaksi'], // Contoh: role admin tata usaha hanya bisa akses menu master data dan transaksi pembayaran
  kepala_sekolah: ['transaksi', 'keuangan'],
};

export const STORAGE_PERMISSIONS_KEY = 'sekolah_pintar_role_permissions';

export function getRolePermissions(): Record<SystemRole, string[]> {
  if (typeof window === 'undefined') {
    return DEFAULT_ROLE_PERMISSIONS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_PERMISSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          super_admin: Array.isArray(parsed.super_admin)
            ? parsed.super_admin
            : DEFAULT_ROLE_PERMISSIONS.super_admin,
          admin_tu: Array.isArray(parsed.admin_tu)
            ? parsed.admin_tu
            : DEFAULT_ROLE_PERMISSIONS.admin_tu,
          kepala_sekolah: Array.isArray(parsed.kepala_sekolah)
            ? parsed.kepala_sekolah
            : DEFAULT_ROLE_PERMISSIONS.kepala_sekolah,
        };
      }
    }
  } catch {
    // Fallback
  }
  return DEFAULT_ROLE_PERMISSIONS;
}

export function saveRolePermissions(permissions: Record<SystemRole, string[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PERMISSIONS_KEY, JSON.stringify(permissions));
    window.dispatchEvent(new Event('role-permissions-updated'));
  } catch {
    // Ignored
  }
}
