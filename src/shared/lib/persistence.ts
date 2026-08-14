export interface StoredDecision<T extends string> {
  recordId: string;
  decision: T;
  reviewedAt: string;
  schemaVersion: number;
}

export function loadDecisions<T extends string>(key: string, allowed: readonly T[]): Map<string, StoredDecision<T>> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Map();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Map();
    const decisions = parsed.filter((value): value is StoredDecision<T> => {
      if (!value || typeof value !== 'object') return false;
      const candidate = value as Partial<StoredDecision<T>>;
      return typeof candidate.recordId === 'string'
        && typeof candidate.reviewedAt === 'string'
        && typeof candidate.schemaVersion === 'number'
        && allowed.includes(candidate.decision as T);
    });
    return new Map(decisions.map(decision => [decision.recordId, decision]));
  } catch {
    return new Map();
  }
}

export function saveDecisions<T extends string>(key: string, decisions: Map<string, StoredDecision<T>>): boolean {
  try {
    localStorage.setItem(key, JSON.stringify([...decisions.values()]));
    return true;
  } catch {
    return false;
  }
}

export function loadPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key) as T | null;
    return value && allowed.includes(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function savePreference(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Preferences are an enhancement; storage failures must not break review.
  }
}

export function loadSessionJson<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

export function saveSessionJson(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Session continuity is optional when browser storage is unavailable.
  }
}
