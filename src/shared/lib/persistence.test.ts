import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDecisions, loadPreference, loadSessionJson, saveDecisions, savePreference, saveSessionJson } from './persistence';

describe('guarded browser persistence', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); vi.restoreAllMocks(); });

  it('round-trips validated decisions and ignores unsupported values', () => {
    const source = new Map([['one', { recordId: 'one', decision: 'Shortlisted' as const, reviewedAt: '2026-08-13', schemaVersion: 1 }]]);
    expect(saveDecisions('review', source)).toBe(true);
    expect(loadDecisions('review', ['Shortlisted', 'Not a fit'])).toEqual(source);
    localStorage.setItem('review', JSON.stringify([{ recordId: 'one', decision: 'Unknown', reviewedAt: '', schemaVersion: 1 }]));
    expect(loadDecisions('review', ['Shortlisted', 'Not a fit']).size).toBe(0);
  });

  it('guards preferences and session continuity', () => {
    savePreference('view', 'table');
    expect(loadPreference('view', ['cards', 'table'], 'cards')).toBe('table');
    expect(loadPreference('view', ['cards'], 'cards')).toBe('cards');
    saveSessionJson('session', { search: 'legal' });
    expect(loadSessionJson('session', { search: '' })).toEqual({ search: 'legal' });
    sessionStorage.setItem('bad', '{');
    expect(loadSessionJson('bad', { safe: true })).toEqual({ safe: true });
  });
});
