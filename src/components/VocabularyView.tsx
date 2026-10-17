import React, { useEffect, useMemo, useState } from 'react';
import type { VocabCategory, VocabPracticeMode, VocabWord } from '../types/vocab';
import { VOCABULARY, VOCAB_CATEGORIES, VOCAB_CATEGORY_LABELS } from '../data/vocabularyData';
import { getUnitRomaji, getWordRomaji, getWordScript, splitKanaUnits } from '../utils/kanaWords';
import { playWordAudio, stopKanaAudio } from '../utils/audio';
import { VocabPracticeSession } from './VocabPracticeSession';
import { BookOpen, Info, Keyboard, PenTool, Play, Volume2 } from 'lucide-react';

interface VocabularyViewProps {
  fontClass: string;
}

type ScriptFilter = 'all' | 'hiragana' | 'katakana';

const ROUND_SIZES = [10, 20, 0]; // 0 = all words

const matchesScript = (word: VocabWord, filter: ScriptFilter) =>
  filter === 'all' || getWordScript(word.kana) === filter;

export const KanjiNotice: React.FC = () => (
  <div className="kanji-notice" role="note">
    <Info size={16} color="var(--accent-gold)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
    <div>
      <strong style={{ color: 'var(--text-primary)' }}>Kana only.</strong> Many of these words are normally written
      with kanji. KanaFocus teaches hiragana and katakana, so every word is shown and practiced in kana; the usual
      kanji spelling appears only as a reference. Kanji should be learned separately.
    </div>
  </div>
);

export const VocabularyView: React.FC<VocabularyViewProps> = ({ fontClass }) => {
  const [section, setSection] = useState<'learn' | 'practice'>('learn');
  const [scriptFilter, setScriptFilter] = useState<ScriptFilter>('all');
  const [activeCategories, setActiveCategories] = useState<VocabCategory[]>([]); // empty = all
  const [practiceMode, setPracticeMode] = useState<VocabPracticeMode>('type');
  const [roundSize, setRoundSize] = useState<number>(10);
  const [sessionWords, setSessionWords] = useState<VocabWord[] | null>(null);
  const [sessionKey, setSessionKey] = useState<number>(0);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    return () => stopKanaAudio();
  }, []);

  const filteredWords = useMemo(
    () =>
      VOCABULARY.filter(
        (word) =>
          matchesScript(word, scriptFilter) &&
          (activeCategories.length === 0 || activeCategories.includes(word.category))
      ),
    [scriptFilter, activeCategories]
  );

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<VocabCategory, number>;
    for (const cat of VOCAB_CATEGORIES) counts[cat] = 0;
    for (const word of VOCABULARY) {
      if (matchesScript(word, scriptFilter)) counts[word.category]++;
    }
    return counts;
  }, [scriptFilter]);

  const toggleCategory = (cat: VocabCategory) => {
    setActiveCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handlePlay = async (word: VocabWord) => {
    if (playingId === word.id) {
      stopKanaAudio();
      setPlayingId(null);
      return;
    }
    setPlayingId(word.id);
    await playWordAudio(word.kana);
    setPlayingId((current) => (current === word.id ? null : current));
  };

  const startPractice = (words: VocabWord[] = filteredWords) => {
    if (words.length === 0) return;
    stopKanaAudio();
    setPlayingId(null);
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setSessionWords(roundSize > 0 ? shuffled.slice(0, roundSize) : shuffled);
    setSessionKey((k) => k + 1);
  };

  // Active practice session takes over the whole tab
  if (sessionWords) {
    return (
      <VocabPracticeSession
        key={sessionKey}
        words={sessionWords}
        mode={practiceMode}
        fontClass={fontClass}
        onRestart={(words) => startPractice(words)}
        onExit={() => setSessionWords(null)}
      />
    );
  }

  return (
    <div className="vocab-page">
      {/* TOP TOOLBAR: Learn / Practice + script filter */}
      <div className="glass-panel selector-top-toolbar">
        <div className="script-segmented-control">
          <button
            className={`script-tab-btn ${section === 'learn' ? 'active' : ''}`}
            onClick={() => setSection('learn')}
          >
            <BookOpen size={14} style={{ verticalAlign: '-2px', marginRight: '0.35rem' }} />
            Learn
          </button>
          <button
            className={`script-tab-btn ${section === 'practice' ? 'active' : ''}`}
            onClick={() => setSection('practice')}
          >
            <Play size={13} fill="currentColor" style={{ verticalAlign: '-2px', marginRight: '0.35rem' }} />
            Practice
          </button>
        </div>

        <div className="script-segmented-control">
          {(['all', 'hiragana', 'katakana'] as ScriptFilter[]).map((script) => (
            <button
              key={script}
              className={`script-tab-btn ${scriptFilter === script ? 'active' : ''}`}
              onClick={() => setScriptFilter(script)}
            >
              {script === 'all' ? 'All' : script === 'hiragana' ? 'ひらがな Hiragana' : 'カタカナ Katakana'}
            </button>
          ))}
        </div>
      </div>

      {/* CATEGORY FILTER */}
      <div className="selector-middle-bar">
        <div className="vocab-category-strip">
          <button
            className={`category-tab-item ${activeCategories.length === 0 ? 'active' : ''}`}
            onClick={() => setActiveCategories([])}
          >
            All topics
          </button>
          {VOCAB_CATEGORIES.filter((cat) => categoryCounts[cat] > 0).map((cat) => (
            <button
              key={cat}
              className={`category-tab-item ${activeCategories.includes(cat) ? 'active' : ''}`}
              onClick={() => toggleCategory(cat)}
              aria-pressed={activeCategories.includes(cat)}
            >
              <span>{VOCAB_CATEGORY_LABELS[cat]}</span>
              <span className="tab-badge-count">{categoryCounts[cat]}</span>
            </button>
          ))}
        </div>
      </div>

      <KanjiNotice />

      {section === 'learn' ? (
        <>
          <div className="word-grid">
            {filteredWords.map((word) => {
              const units = splitKanaUnits(word.kana);
              const unitRomaji = getUnitRomaji(word.kana);
              const isPlaying = playingId === word.id;

              return (
                <div key={word.id} className="word-card">
                  <button
                    className="icon-button word-card-audio"
                    onClick={() => handlePlay(word)}
                    title={isPlaying ? 'Stop' : 'Listen to pronunciation'}
                    aria-label={`Listen to ${word.kana}`}
                    style={{ color: isPlaying ? 'var(--accent-sakura)' : undefined }}
                  >
                    <Volume2 size={15} />
                  </button>

                  <div className={`word-card-kana ${fontClass}`}>{word.kana}</div>
                  <div className="word-card-romaji">{getWordRomaji(word)}</div>
                  <div className="word-card-meaning">{word.meaning}</div>

                  <div className="word-breakdown" aria-label="Kana breakdown">
                    {units.map((unit, i) => (
                      <span key={`${unit}-${i}`} className="word-breakdown-unit">
                        <strong className={fontClass}>{unit}</strong>
                        {unitRomaji[i]}
                      </span>
                    ))}
                  </div>

                  {word.kanji && (
                    <div
                      className="word-kanji-tag"
                      title="Kanji are not covered by KanaFocus — study them separately."
                    >
                      Usually written in kanji: <span className="kanji-glyph">{word.kanji}</span>
                    </div>
                  )}

                  {word.note && <div className="word-card-note">💡 {word.note}</div>}
                </div>
              );
            })}
          </div>

          <div className="selected-fixed-status-bar">
            <span>📚 {filteredWords.length} words in this view.</span>
            {filteredWords.length > 0 && (
              <button
                onClick={() => setSection('practice')}
                style={{ color: 'var(--accent-sakura)', fontWeight: 700, fontSize: '0.82rem' }}
              >
                Practice these words →
              </button>
            )}
          </div>
        </>
      ) : (
        /* PRACTICE SETUP */
        <div className="glass-panel" style={{ padding: '1.5rem', maxWidth: '640px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-highlight)' }}>
            Practice vocabulary
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {([
              { mode: 'type', icon: <Keyboard size={18} />, title: 'Read & type', desc: 'See the word in kana and type its romaji reading.' },
              { mode: 'draw', icon: <PenTool size={18} />, title: 'Draw the word', desc: 'See the meaning and reading, then draw it kana by kana.' },
            ] as const).map((opt) => {
              const active = practiceMode === opt.mode;
              return (
                <button
                  key={opt.mode}
                  onClick={() => setPracticeMode(opt.mode)}
                  aria-pressed={active}
                  style={{
                    display: 'flex',
                    gap: '0.65rem',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    padding: '0.85rem',
                    borderRadius: '6px',
                    border: `1px solid ${active ? 'var(--accent-sakura)' : 'var(--border-medium)'}`,
                    background: active ? 'var(--accent-sakura-soft)' : 'transparent',
                    color: active ? 'var(--accent-sakura)' : 'var(--text-secondary)',
                  }}
                >
                  {opt.icon}
                  <span>
                    <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{opt.title}</strong>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{opt.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Words per round</span>
            <div className="script-segmented-control">
              {ROUND_SIZES.map((size) => (
                <button
                  key={size}
                  className={`script-tab-btn ${roundSize === size ? 'active' : ''}`}
                  onClick={() => setRoundSize(size)}
                >
                  {size === 0 ? `All (${filteredWords.length})` : size}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {filteredWords.length === 0
                ? 'No words match the current filters.'
                : `Words are picked from the ${filteredWords.length} words matching your filters.`}
            </span>
            <button
              className="btn-start-practice-prominent"
              onClick={() => startPractice()}
              disabled={filteredWords.length === 0}
            >
              <Play size={15} fill="currentColor" />
              <span>Start practice</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
