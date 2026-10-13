export interface AlumniItem {
  id: number;
  nis: string;
  nisn?: string | null;
  name: string;
  lastClassroom: string;
  entryYear: string;
  graduationYear: string;
  phoneNumber?: string | null;
  address?: string | null;
  status: 'Lulus';
  graduatedAt: string;
}

export const ALUMNI_STORAGE_KEY = 'sekolah_pintar_data_alumni';

export const INITIAL_ALUMNI: AlumniItem[] = [
  {
    id: 1,
    nis: '20231201',
    nisn: '0059123401',
    name: 'Fajar Nugroho',
    lastClassroom: 'XII-IPA 1',
    entryYear: '2023',
    graduationYear: '2026',
    phoneNumber: '081234567895',
    address: 'Jl. Cempaka No. 8, Jakarta Timur',
    status: 'Lulus',
    graduatedAt: '2026-06-15T09:00:00Z',
  },
  {
    id: 2,
    nis: '20231202',
    nisn: '0059123402',
    name: 'Sekar Arum',
    lastClassroom: 'XII-IPS 1',
    entryYear: '2023',
    graduationYear: '2026',
    phoneNumber: '081234567896',
    address: 'Jl. Pahlawan No. 20, Semarang',
    status: 'Lulus',
    graduatedAt: '2026-06-15T09:00:00Z',
  },
  {
    id: 3,
    nis: '20221201',
    nisn: '0049123403',
    name: 'Taufik Hidayat',
    lastClassroom: 'XII-IPA 1',
    entryYear: '2022',
    graduationYear: '2025',
    phoneNumber: '081234567897',
    address: 'Jl. Pemuda No. 12, Semarang',
    status: 'Lulus',
    graduatedAt: '2025-06-20T10:00:00Z',
  },
];

export function getAlumniList(): AlumniItem[] {
  if (typeof window === 'undefined') {
    return INITIAL_ALUMNI;
  }
  try {
    const raw = localStorage.getItem(ALUMNI_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    localStorage.setItem(ALUMNI_STORAGE_KEY, JSON.stringify(INITIAL_ALUMNI));
    return INITIAL_ALUMNI;
  } catch {
    return INITIAL_ALUMNI;
  }
}

export function saveAlumniList(items: AlumniItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ALUMNI_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('alumni-updated'));
  } catch {
    // Handled
  }
}

export function addAlumni(
  item: Omit<AlumniItem, 'id' | 'graduatedAt' | 'status'> & { id?: number; graduatedAt?: string; status?: 'Lulus' }
): AlumniItem {
  const current = getAlumniList();
  const nextId = item.id || (current.length > 0 ? Math.max(...current.map((a) => a.id)) + 1 : 1);
  const newAlumni: AlumniItem = {
    ...item,
    id: nextId,
    status: 'Lulus',
    graduatedAt: item.graduatedAt || new Date().toISOString(),
  };
  const filteredCurrent = current.filter((a) => a.nis !== item.nis);
  const updated = [newAlumni, ...filteredCurrent];
  saveAlumniList(updated);
  return newAlumni;
}

export function deleteAlumni(id: number): void {
  const current = getAlumniList();
  const updated = current.filter((a) => a.id !== id);
  saveAlumniList(updated);
}
