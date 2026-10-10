export type SystemRole = string;

export interface RoleInfo {
  key: string;
  label: string;
  description: string;
  badgeVariant: 'paid' | 'info' | 'neutral' | 'void';
  isSystem?: boolean;
}

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

export const DEFAULT_ROLE_DEFINITIONS: Record<string, RoleInfo> = {
  super_admin: {
    key: 'super_admin',
    label: 'Super Administrator',
    description: 'Memiliki kendali penuh seluruh modul, manajemen hak akses, dan pembatalan void.',
    badgeVariant: 'paid',
    isSystem: true,
  },
  admin_tu: {
    key: 'admin_tu',
    label: 'Admin Tata Usaha',
    description: 'Staf pelaksana administrasi data siswa, tarif pembayaran, dan penerimaan kas kasir.',
    badgeVariant: 'info',
    isSystem: true,
  },
  kepala_sekolah: {
    key: 'kepala_sekolah',
    label: 'Kepala Sekolah',
    description: 'Pimpinan sekolah dengan akses pemantauan laporan penerimaan dan pengeluaran.',
    badgeVariant: 'neutral',
    isSystem: true,
  },
};

export const ROLE_DEFINITIONS = DEFAULT_ROLE_DEFINITIONS;

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['master_data', 'transaksi', 'keuangan', 'pengaturan'],
  admin_tu: ['master_data', 'transaksi'], // Contoh: role admin tata usaha hanya bisa akses menu master data dan transaksi pembayaran
  kepala_sekolah: ['transaksi', 'keuangan'],
};

export const STORAGE_ROLES_KEY = 'sekolah_pintar_roles';
export const STORAGE_PERMISSIONS_KEY = 'sekolah_pintar_role_permissions';

export function getRoles(): Record<string, RoleInfo> {
  if (typeof window === 'undefined') {
    return DEFAULT_ROLE_DEFINITIONS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_ROLES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_ROLE_DEFINITIONS,
          ...parsed,
        };
      }
    }
  } catch {
    // Fallback
  }
  return DEFAULT_ROLE_DEFINITIONS;
}

export function saveRoles(roles: Record<string, RoleInfo>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_ROLES_KEY, JSON.stringify(roles));
    window.dispatchEvent(new Event('roles-updated'));
  } catch {
    // Ignored
  }
}

export function getRolePermissions(): Record<string, string[]> {
  if (typeof window === 'undefined') {
    return DEFAULT_ROLE_PERMISSIONS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_PERMISSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          ...DEFAULT_ROLE_PERMISSIONS,
          ...parsed,
        };
      }
    }
  } catch {
    // Fallback
  }
  return DEFAULT_ROLE_PERMISSIONS;
}

export function saveRolePermissions(permissions: Record<string, string[]>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PERMISSIONS_KEY, JSON.stringify(permissions));
    window.dispatchEvent(new Event('role-permissions-updated'));
  } catch {
    // Ignored
  }
}
