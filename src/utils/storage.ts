import type { JapaneseFontFamily, PracticeMode, PracticeStats } from '../types/kana';
import { HIRAGANA_CHARACTERS } from '../data/kanaData';

const STORAGE_KEYS = {
  SELECTED_CHAR_IDS: 'kanaflow_selected_ids_v1',
  STATS: 'kanaflow_stats_v1',
  SETTINGS: 'kanaflow_settings_v1',
  THEME: 'kanaflow_theme_v1',
};

export interface AppSettings {
  font: JapaneseFontFamily;
  soundEffects: boolean;
  autoSpeak: boolean;
  practiceMode: PracticeMode;
  autoAdvanceOnCorrect: boolean;
  showMnemonic: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  font: 'sans',
  soundEffects: false,
  autoSpeak: false,
  practiceMode: 'type',
  autoAdvanceOnCorrect: true,
  showMnemonic: true,
};

export const INITIAL_STATS: PracticeStats = {
  totalAttempts: 0,
  correctAttempts: 0,
  currentStreak: 0,
  bestStreak: 0,
  characterStats: {},
};

// Initial default selection: First 15 basic Hiragana (Vowels, K-row, S-row)
export const DEFAULT_SELECTED_IDS: string[] = HIRAGANA_CHARACTERS
  .slice(0, 15)
  .map(c => c.id);

export function loadSelectedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SELECTED_CHAR_IDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_SELECTED_IDS;
}

export function saveSelectedIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SELECTED_CHAR_IDS, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export function loadStats(): PracticeStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (raw) {
      return { ...INITIAL_STATS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return INITIAL_STATS;
}

export function saveStats(stats: PracticeStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function loadTheme(): 'dark' | 'light' {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    if (raw === 'light' || raw === 'dark') return raw;
  } catch {
    // fallback
  }
  return 'dark'; // Default to dark sakura theme
}

export function saveTheme(theme: 'dark' | 'light'): void {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch {
    // ignore
  }
}
