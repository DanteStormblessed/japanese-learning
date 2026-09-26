export type ScriptType = 'hiragana' | 'katakana';

export type KanaCategory = 'basic' | 'dakuten' | 'handakuten' | 'combination';

export interface KanaCharacter {
  id: string; // e.g. "h-ka", "k-sa", "h-kya"
  script: ScriptType;
  character: string; // e.g. "あ", "ア"
  romaji: string; // Primary romaji e.g. "ka"
  alternatives: string[]; // Acceptable typing variants e.g. ["ka"]
  category: KanaCategory;
  rowGroup: string; // e.g. "k", "s", "t", "dakuten-g", "comb-ky"
  rowLabel: string; // e.g. "K-row (か/カ)", "Dakuten G (が/ガ)"
  mnemonic?: string; // Short memory aid/hint
}

export interface KanaRow {
  groupId: string;
  label: string;
  category: KanaCategory;
  characters: (KanaCharacter | null)[]; // 5 slots for standard columns (a, i, u, e, o) or 3 for yōon (ya, yu, yo)
}

export interface PracticeStats {
  totalAttempts: number;
  correctAttempts: number;
  currentStreak: number;
  bestStreak: number;
  characterStats: Record<string, { attempts: number; correct: number; lastPracticed: number }>;
}

export type JapaneseFontFamily = 
  | 'sans' // Noto Sans JP
  | 'serif' // Shippori Mincho
  | 'maru' // Zen Maru Gothic
  | 'brush' // Yuji Boku
  | 'random'; // Randomize on each card

export type PracticeMode = 'type' | 'multiple-choice' | 'flashcard';
