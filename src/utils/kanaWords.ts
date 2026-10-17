/**
 * Helpers for working with whole kana words: splitting them into drawable units,
 * deriving their romaji reading and checking typed answers.
 */
import { ALL_CHARACTERS } from '../data/kanaData';
import type { VocabWord, WordScript } from '../types/vocab';

const SMALL_Y = new Set(['ゃ', 'ゅ', 'ょ', 'ャ', 'ュ', 'ョ']);
const SOKUON = new Set(['っ', 'ッ']);
const LONG_MARK = 'ー';

// Every romaji spelling accepted for each kana (primary first)
const KANA_READINGS = new Map<string, string[]>();
for (const char of ALL_CHARACTERS) {
  if (!KANA_READINGS.has(char.character)) {
    KANA_READINGS.set(char.character, char.alternatives);
  }
}

/**
 * Split a word into the units a learner writes one at a time.
 * Yōon combinations stay together ("きゃ"), everything else is one character.
 */
export function splitKanaUnits(word: string): string[] {
  const units: string[] = [];
  for (const ch of word) {
    const prev = units[units.length - 1];
    if (SMALL_Y.has(ch) && prev && prev.length === 1 && !SOKUON.has(prev)) {
      units[units.length - 1] = prev + ch;
    } else {
      units.push(ch);
    }
  }
  return units;
}

export function getWordScript(word: string): WordScript {
  let hasHira = false;
  let hasKata = false;
  for (const ch of word) {
    const code = ch.charCodeAt(0);
    if (code >= 0x3041 && code <= 0x309f) hasHira = true;
    else if (code >= 0x30a0 && code <= 0x30ff) hasKata = true;
  }
  if (hasHira && hasKata) return 'mixed';
  return hasKata ? 'katakana' : 'hiragana';
}

/** Romaji spellings accepted for the unit at `index`, given its neighbours. */
function unitVariants(units: string[], index: number): string[] {
  const unit = units[index];

  // っ doubles the next consonant: がっこう → gakkou, まっちゃ → matcha / maccha
  if (SOKUON.has(unit)) {
    if (index + 1 >= units.length) return [];
    const doubled = new Set<string>();
    for (const next of unitVariants(units, index + 1)) {
      if (/^[aeiou]/.test(next)) continue;
      doubled.add(next[0]);
      if (next.startsWith('ch')) doubled.add('t');
    }
    return Array.from(doubled);
  }

  // ー lengthens the previous vowel: コーヒー → koohii (also typed "ko-hi-")
  if (unit === LONG_MARK) {
    const prevPrimary = index > 0 ? unitVariants(units, index - 1)[0] ?? '' : '';
    const vowel = prevPrimary.slice(-1);
    return /[aeiou]/.test(vowel) ? [vowel, '-'] : ['-'];
  }

  return KANA_READINGS.get(unit) ?? [];
}

/** Hepburn-style romaji used for display. */
export function getWordRomaji(word: VocabWord): string {
  if (word.readings && word.readings.length > 0) return word.readings[0];
  const units = splitKanaUnits(word.kana);
  return units.map((_, i) => unitVariants(units, i)[0] ?? '').join('');
}

/** Primary romaji for each unit, for labelling draw slots and breakdowns. */
export function getUnitRomaji(word: string): string[] {
  const units = splitKanaUnits(word);
  return units.map((unit, i) => {
    if (SOKUON.has(unit)) return 'small tsu';
    if (unit === LONG_MARK) return 'long vowel';
    return unitVariants(units, i)[0] ?? '?';
  });
}

const MACRONS: Record<string, string[]> = {
  ā: ['aa'],
  ī: ['ii'],
  ū: ['uu'],
  ē: ['ee', 'ei'],
  ō: ['ou', 'oo'],
};

/** Normalized forms of a typed answer (macrons expanded both ways). */
function normalizeInput(input: string): string[] {
  const base = input.toLowerCase().trim().replace(/[\s'’]/g, '');
  let forms = [''];
  for (const ch of base) {
    const options = MACRONS[ch] ?? [ch];
    forms = forms.flatMap((f) => options.map((o) => f + o)).slice(0, 32);
  }
  return forms;
}

function matchesUnits(input: string, units: string[]): boolean {
  const memo = new Map<string, boolean>();
  const walk = (pos: number, idx: number): boolean => {
    if (idx === units.length) return pos === input.length;
    const key = `${pos}:${idx}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;
    let ok = false;
    for (const variant of unitVariants(units, idx)) {
      if (variant && input.startsWith(variant, pos) && walk(pos + variant.length, idx + 1)) {
        ok = true;
        break;
      }
    }
    memo.set(key, ok);
    return ok;
  };
  return walk(0, 0);
}

/** Whether a typed romaji answer is a valid reading of the word. */
export function isCorrectReading(input: string, word: VocabWord): boolean {
  const forms = normalizeInput(input);
  if (forms[0] === '') return false;

  if (word.readings && word.readings.length > 0) {
    return forms.some((f) => word.readings!.includes(f));
  }

  const units = splitKanaUnits(word.kana);
  return forms.some((f) => matchesUnits(f, units));
}
