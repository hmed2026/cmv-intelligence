export const TOKEN_KEY = 'cmv_access_token';
export const REFRESH_KEY = 'cmv_refresh_token';
export const COMPANY_KEY = 'cmv_company_id';
export const USER_KEY = 'cmv_user';

const isBrowser = typeof window !== 'undefined';

export function getToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (!isBrowser) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string): void {
  if (!isBrowser) return;
  localStorage.setItem(REFRESH_KEY, token);
}

export function clearTokens(): void {
  if (!isBrowser) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(COMPANY_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getCompanyId(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(COMPANY_KEY);
}

export function setCompanyId(id: string): void {
  if (!isBrowser) return;
  localStorage.setItem(COMPANY_KEY, id);
}

export function isAuthenticated(): boolean {
  if (!isBrowser) return false;
  const token = getToken();
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}

export function getUserFromStorage(): object | null {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUserInStorage(user: object): void {
  if (!isBrowser) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
