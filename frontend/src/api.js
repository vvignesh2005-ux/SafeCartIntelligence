export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';

export function normalizeQuery(value) {
  return String(value || '').trim();
}

export function getRecentSearches(storageKey = 'sci_recent_searches') {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(term, storageKey = 'sci_recent_searches') {
  const clean = normalizeQuery(term);
  if (!clean) return getRecentSearches(storageKey);
  try {
    const existing = getRecentSearches(storageKey).filter(
      (item) => item.toLowerCase() !== clean.toLowerCase()
    );
    const updated = [clean, ...existing].slice(0, 6);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    return updated;
  } catch {
    return [clean];
  }
}

export function getComplaintHistory() {
  try {
    const raw = localStorage.getItem('sci_complaint_history');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveComplaintHistory(entry) {
  try {
    const existing = getComplaintHistory();
    const updated = [entry, ...existing].slice(0, 10);
    localStorage.setItem('sci_complaint_history', JSON.stringify(updated));
    return updated;
  } catch {
    return [entry];
  }
}