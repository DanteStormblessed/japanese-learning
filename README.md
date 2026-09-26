# KanaFlow — Japanese Hiragana & Katakana Mastery

A web application built with **React**, **TypeScript**, and **Vite**, inspired by [RealKana](https://realkana.com/). Designed specifically for mastering the Japanese alphabet (**Hiragana** & **Katakana**, no Kanji) through rapid recall drills, customizable character selection, and authentic typography.

---

## ✨ Features

1. **Focused Alphabet Learning (No Kanji)**:
   - Full coverage of **Hiragana (104 characters)** and **Katakana (104 characters)**.
   - Includes **Basic (Gojūon)**, **Voiced (Dakuten)**, **Semi-Voiced (Handakuten)**, and **Combinations (Yōon)**.

2. **RealKana-Inspired Grid Selector**:
   - Tab between **Hiragana (ひらがな)** and **Katakana (カタカナ)**.
   - Click any row header (e.g., *K-row*, *S-row*, *Kya Combos*) to toggle an entire group at once.
   - Toggle individual kana tiles with visual indicators and audio previews.
   - Quick presets: *Vowels (a, i, u, e, o)*, *First 15*, *All Basic*, *Dakuten & Handakuten*, *Combinations*, *Select All*, and *Clear All*.

3. **Complete Syllabary Reference & Selection**:
   - The dedicated **"All Syllabary"** view lets you browse every character in the Japanese alphabet.
   - Full search by **Romaji**, **Kana character**, or mnemonic hint.
   - Filter by script (*Hiragana / Katakana*), category (*Basic / Dakuten / Combo*), or selection state.
   - Bulk select/deselect filtered sets.
   - Audio speaker buttons to hear native Japanese voice pronunciations.
   - Visual mnemonics to accelerate character memorization.

4. **Authentic Japanese Typefaces**:
   - Learn to recognize kana across different real-world font styles:
     - **Gothic (Noto Sans JP)** — Clean modern sans-serif.
     - **Mincho (Shippori Mincho)** — Classic literary book serif.
     - **Maru (Zen Maru Gothic)** — Rounded handwritten style.
     - **Brush (Yuji Boku)** — Traditional ink calligraphy brush.
     - **Randomize Fonts** — Randomly changes fonts per card to build robust visual recognition.

5. **Fluid Practice Drills & Keyboard Support**:
   - **Real Kana Instant Flow**: Type the Romaji and it automatically advances upon matching.
   - **Alternative Spelling Support**: Handles Hepburn and Kunrei-shiki variants (`shi`/`si`, `tsu`/`tu`, `chi`/`ti`, `fu`/`hu`, `ji`/`zi`, `wo`/`o`, `n`/`nn`, etc.).
   - Visual flash and Web Audio synthesizer chimes for instant feedback.
   - Immediate answer revelation and review re-insertion if missed.
   - Alternate modes: **Typing Drill**, **Multiple Choice Quiz**, and **Flashcard Flip**.

6. **Statistics & Persistence**:
   - Persistent `localStorage` tracking for your selected kana, streaks, accuracy %, and practice history.
   - Intelligent review queue identifying your weakest characters.
   - Dark mode & Light mode support.

---

## ⌨️ Keyboard Shortcuts (Practice Mode)

| Key | Action |
| --- | --- |
| **Type letters** | Type romaji; auto-advances instantly on correct match |
| **Space** or **Escape** | Reveal answer ("Don't Know") |
| **Enter** | Advance to next character after review |

---

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Run local development server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production build
```bash
npm run build
```

---

## 📁 Project Architecture

- `src/data/kanaData.ts` — Comprehensive dataset of 208 Hiragana and Katakana characters, categories, row groupings, mnemonics, and romaji variants.
- `src/types/kana.ts` — TypeScript definitions for characters, categories, practice stats, fonts, and modes.
- `src/utils/audio.ts` — Web Audio synthesizer (positive chime, buzzer, celebration arpeggios) & Japanese speech synthesis.
- `src/utils/storage.ts` — LocalStorage persistence for user selection, stats, theme, and settings.
- `src/components/Header.tsx` — App navigation, streak counter, sound toggle, theme toggle, and modal buttons.
- `src/components/KanaSelector.tsx` — RealKana-style interactive grid selector with row controls and quick presets.
- `src/components/SyllabaryReference.tsx` — Full syllabary catalogue with search, multi-filters, audio playback, and drill selection.
- `src/components/PracticeView.tsx` — Drill testing view with instant typing validation, audio, font selector, and review queue.
- `src/components/StatsModal.tsx` — Session metrics, accuracy rate, streak records, and weak-character drill queue.
- `src/components/SettingsModal.tsx` — Japanese font preferences, sound toggles, and shortcut guide.
- `src/index.css` — Modern Japanese aesthetic with dark/light themes, glassmorphism, and responsive styling.
