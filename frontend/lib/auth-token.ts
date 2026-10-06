const TOKEN_STORAGE_KEY = 'sekolah_pintar_auth_token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  // Simpan juga di cookie agar bisa diakses middleware Next.js
  document.cookie = `${TOKEN_STORAGE_KEY}=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
}

export function removeAuthToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  document.cookie = `${TOKEN_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax`;
}
