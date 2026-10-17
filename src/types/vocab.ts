import type { ScriptType } from './kana';

export type VocabCategory =
  | 'greetings'
  | 'food'
  | 'animals'
  | 'people'
  | 'body'
  | 'nature'
  | 'describing'
  | 'numbers'
  | 'daily'
  | 'verbs'
  | 'loanwords';

export interface VocabWord {
  id: string;
  kana: string; // Word written in kana, e.g. "みず"
  meaning: string; // English definition
  category: VocabCategory;
  kanji?: string; // Usual written form when kanji are normally used (reference only)
  readings?: string[]; // Explicit romaji when it can't be derived from the kana (e.g. particle は = "wa")
  note?: string; // Usage or pronunciation tip
}

export type VocabPracticeMode = 'type' | 'draw';

export type WordScript = ScriptType | 'mixed';
