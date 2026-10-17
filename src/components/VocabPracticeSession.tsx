import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { VocabPracticeMode, VocabWord } from '../types/vocab';
import { getUnitRomaji, getWordRomaji, isCorrectReading, splitKanaUnits } from '../utils/kanaWords';
import { matchKanaAgainstTarget, type Stroke, type VectorMatchResult } from '../utils/strokeMatcher';
import { playWordAudio, stopKanaAudio } from '../utils/audio';
import { playCelebration } from '../utils/celebration';
import { KanaDrawPad } from './KanaDrawPad';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  RotateCcw,
  Trash2,
  Unlock,
  Volume2,
  X,
} from 'lucide-react';

interface VocabPracticeSessionProps {
  words: VocabWord[];
  mode: VocabPracticeMode;
  fontClass: string;
  onRestart: (words: VocabWord[]) => void;
  onExit: () => void;
}

interface WordResult {
  word: VocabWord;
  correct: boolean;
}

type UnitStatus = 'pending' | 'ok' | 'retry' | 'missed';

/** Reading, meaning and kanji reference shown once a word is answered. */
const WordReveal: React.FC<{ word: VocabWord; fontClass: string }> = ({ word, fontClass }) => (
  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'center' }}>
    <div className={fontClass} style={{ fontSize: '2.4rem', fontWeight: 600, color: 'var(--text-highlight)', lineHeight: 1.2 }}>
      {word.kana}
    </div>
    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-sakura)' }}>{getWordRomaji(word)}</div>
    <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{word.meaning}</div>
    {word.kanji && (
      <div className="word-kanji-tag" title="Kanji are not covered by KanaFocus — study them separately.">
        Usually written in kanji: <span className="kanji-glyph">{word.kanji}</span>
        <span>(learn kanji separately)</span>
      </div>
    )}
    {word.note && <div className="word-card-note" style={{ maxWidth: '420px' }}>💡 {word.note}</div>}
  </div>
);

export const VocabPracticeSession: React.FC<VocabPracticeSessionProps> = ({
  words,
  mode,
  fontClass,
  onRestart,
  onExit,
}) => {
  const [index, setIndex] = useState<number>(0);
  const [results, setResults] = useState<WordResult[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Type mode
  const [input, setInput] = useState<string>('');
  const [typeStatus, setTypeStatus] = useState<'neutral' | 'correct' | 'incorrect'>('neutral');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Draw mode
  const [unitIndex, setUnitIndex] = useState<number>(0);
  const [unitStatuses, setUnitStatuses] = useState<UnitStatus[]>(() =>
    splitKanaUnits(words[0]?.kana ?? '').map(() => 'pending')
  );
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [matchResult, setMatchResult] = useState<VectorMatchResult | null>(null);
  const [failedCurrentUnit, setFailedCurrentUnit] = useState<boolean>(false);
  const [isWordDone, setIsWordDone] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [isGuideLocked, setIsGuideLocked] = useState<boolean>(false);

  const word = words[index];
  const units = useMemo(() => (word ? splitKanaUnits(word.kana) : []), [word]);
  const unitRomaji = useMemo(() => (word ? getUnitRomaji(word.kana) : []), [word]);

  useEffect(() => {
    return () => stopKanaAudio();
  }, []);

  useEffect(() => {
    if (mode === 'type') inputRef.current?.focus();
  }, [index, mode]);

  const playWord = useCallback(async () => {
    if (!word) return;
    if (isPlaying) {
      stopKanaAudio();
      setIsPlaying(false);
      return;
    }
    setIsPlaying(true);
    await playWordAudio(word.kana);
    setIsPlaying(false);
  }, [word, isPlaying]);

  const goToNextWord = useCallback(() => {
    stopKanaAudio();
    setIsPlaying(false);
    if (index + 1 >= words.length) {
      const correctCount = results.filter((r) => r.correct).length;
      setIsFinished(true);
      playCelebration(Math.round((correctCount / Math.max(results.length, 1)) * 100));
    } else {
      // Reset per-word state for the next word
      setIndex(index + 1);
      setInput('');
      setTypeStatus('neutral');
      setUnitIndex(0);
      setUnitStatuses(splitKanaUnits(words[index + 1].kana).map(() => 'pending'));
      setStrokes([]);
      setMatchResult(null);
      setFailedCurrentUnit(false);
      setIsWordDone(false);
      setShowGuide(isGuideLocked);
    }
  }, [index, words, results, isGuideLocked]);

  // ---------- Type mode ----------
  const checkTyped = useCallback(
    (giveUp = false) => {
      if (!word || typeStatus !== 'neutral') return;
      if (!giveUp && input.trim() === '') return;
      const correct = !giveUp && isCorrectReading(input, word);
      setTypeStatus(correct ? 'correct' : 'incorrect');
      setResults((prev) => [...prev, { word, correct }]);
      setIsPlaying(true);
      playWordAudio(word.kana).finally(() => setIsPlaying(false));
    },
    [word, input, typeStatus]
  );

  // ---------- Draw mode ----------
  const currentUnit = units[unitIndex];

  const checkDrawing = useCallback(() => {
    if (!currentUnit || strokes.length === 0 || matchResult?.isCorrect) return;
    const result = matchKanaAgainstTarget(strokes, currentUnit, { strictOrder: true, thresholdScore: 62 });
    setMatchResult(result);
    if (result.isCorrect) {
      setUnitStatuses((prev) => prev.map((s, i) => (i === unitIndex ? (failedCurrentUnit ? 'retry' : 'ok') : s)));
    } else {
      setFailedCurrentUnit(true);
    }
  }, [currentUnit, strokes, matchResult, unitIndex, failedCurrentUnit]);

  const goToNextUnit = useCallback(() => {
    if (!matchResult) return;
    const finalStatuses = unitStatuses.map((s, i) =>
      i === unitIndex && !matchResult.isCorrect ? 'missed' : s
    );
    setUnitStatuses(finalStatuses);

    if (unitIndex + 1 < units.length) {
      setUnitIndex((i) => i + 1);
      setStrokes([]);
      setMatchResult(null);
      setFailedCurrentUnit(false);
      setShowGuide(isGuideLocked);
    } else {
      setIsWordDone(true);
      setResults((prev) => [...prev, { word, correct: !finalStatuses.includes('missed') }]);
      setIsPlaying(true);
      playWordAudio(word.kana).finally(() => setIsPlaying(false));
    }
  }, [matchResult, unitStatuses, unitIndex, units.length, isGuideLocked, word]);

  const handleClear = () => {
    setStrokes([]);
    setMatchResult(null);
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
    setMatchResult(null);
  };

  const toggleGuide = () => {
    if (showGuide) {
      setShowGuide(false);
      setIsGuideLocked(false);
    } else {
      setShowGuide(true);
    }
  };

  const toggleGuideLock = () => {
    const nextLocked = !isGuideLocked;
    setIsGuideLocked(nextLocked);
    if (nextLocked) setShowGuide(true);
  };

  // Enter: check / continue
  useEffect(() => {
    if (isFinished) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      if (mode === 'type') {
        if (typeStatus === 'neutral') checkTyped();
        else goToNextWord();
      } else if (isWordDone) {
        goToNextWord();
      } else if (matchResult?.isCorrect) {
        goToNextUnit();
      } else if (strokes.length > 0) {
        checkDrawing();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFinished, mode, typeStatus, isWordDone, matchResult, strokes.length, checkTyped, goToNextWord, goToNextUnit, checkDrawing]);

  // ---------- Summary ----------
  if (isFinished) {
    const correctCount = results.filter((r) => r.correct).length;
    const missed = results.filter((r) => !r.correct).map((r) => r.word);
    const accuracy = Math.round((correctCount / Math.max(results.length, 1)) * 100);

    return (
      <div className="practice-screen">
        <div className="glass-panel" style={{ width: '100%', padding: '2rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🌸</div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-highlight)' }}>
            Vocabulary round complete!
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            <strong>{correctCount}</strong> of <strong>{results.length}</strong> words correct ({accuracy}%).
          </p>

          {missed.length > 0 && (
            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Words to review
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {missed.map((w) => (
                  <div
                    key={w.id}
                    style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', padding: '0.4rem 0.6rem', background: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.85rem' }}
                  >
                    <span className={fontClass} style={{ fontSize: '1.15rem', color: 'var(--text-highlight)' }}>{w.kana}</span>
                    <span style={{ color: 'var(--accent-sakura)', fontWeight: 700 }}>{getWordRomaji(w)}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{w.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button className="btn-start-practice-prominent" onClick={() => onRestart(words)}>
              <RotateCcw size={15} />
              <span>Practice again</span>
            </button>
            {missed.length > 0 && (
              <button className="btn-secondary" onClick={() => onRestart(missed)}>
                Review missed ({missed.length})
              </button>
            )}
            <button className="btn-secondary" onClick={onExit}>
              Back to vocabulary
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!word) return null;

  const correctSoFar = results.filter((r) => r.correct).length;

  return (
    <div className="practice-screen" style={{ maxWidth: '760px' }}>
      {/* Top bar */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={onExit} style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', gap: '0.4rem' }}>
          <ArrowLeft size={14} />
          <span>Exit</span>
        </button>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Word <strong>{index + 1}</strong> of {words.length} · <span style={{ color: 'var(--accent-matcha)' }}>{correctSoFar} correct</span>
        </div>
      </div>
      <div className="progress-bar-track" style={{ marginBottom: '1rem' }}>
        <div className="progress-bar-fill" style={{ width: `${Math.round((index / words.length) * 100)}%` }} />
      </div>

      {mode === 'type' ? (
        /* ---------- READ & TYPE ---------- */
        <div className={`glass-panel practice-card-box ${typeStatus !== 'neutral' ? typeStatus : ''}`} style={{ minHeight: 0, gap: '0.9rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            How do you read this word?
          </div>

          {typeStatus === 'neutral' ? (
            <div className={fontClass} style={{ fontSize: 'clamp(2.6rem, 9vw, 4.2rem)', lineHeight: 1.15, color: 'var(--text-highlight)', textAlign: 'center' }}>
              {word.kana}
            </div>
          ) : (
            <WordReveal word={word} fontClass={fontClass} />
          )}

          <input
            ref={inputRef}
            type="text"
            className={`romaji-input ${typeStatus}`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type romaji..."
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            disabled={typeStatus !== 'neutral'}
            aria-label="Romaji reading"
          />

          {typeStatus !== 'neutral' && (
            <div className={`feedback-banner ${typeStatus}`} style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              {typeStatus === 'correct' ? <Check size={16} /> : <X size={16} />}
              <span>
                {typeStatus === 'correct' ? 'Correct!' : input.trim() ? `Not quite — you typed "${input.trim()}"` : 'Here is the answer'}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn-secondary" onClick={playWord} title="Listen to pronunciation" style={{ gap: '0.4rem' }}>
              <Volume2 size={15} />
              <span>{isPlaying ? 'Stop' : 'Listen'}</span>
            </button>
            {typeStatus === 'neutral' ? (
              <>
                <button className="btn-secondary" onClick={() => checkTyped(true)}>
                  I don't know
                </button>
                <button className="btn-start-practice-prominent" onClick={() => checkTyped()} disabled={input.trim() === ''}>
                  <Check size={15} />
                  <span>Check</span>
                </button>
              </>
            ) : (
              <button className="btn-start-practice-prominent" onClick={goToNextWord}>
                <span>Next</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Press <span className="keyboard-badge">Enter</span> to {typeStatus === 'neutral' ? 'check' : 'continue'}
          </div>
        </div>
      ) : (
        /* ---------- DRAW THE WORD ---------- */
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.85rem', alignItems: 'center' }}>
          <div className="glass-panel" style={{ width: '100%', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Draw the word for
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-highlight)', lineHeight: 1.2 }}>{word.meaning}</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-sakura)' }}>{getWordRomaji(word)}</div>
            </div>
            <button className="btn-secondary" onClick={playWord} title="Listen to pronunciation" style={{ gap: '0.4rem' }}>
              <Volume2 size={15} />
              <span>{isPlaying ? 'Stop' : 'Listen'}</span>
            </button>
          </div>

          {/* Kana slots */}
          <div className="word-slot-row" aria-label="Word progress">
            {units.map((unit, i) => {
              const status = unitStatuses[i] ?? 'pending';
              const isCurrent = !isWordDone && i === unitIndex;
              const revealed = status !== 'pending' || isWordDone;
              return (
                <div key={`${unit}-${i}`} className={`word-slot ${isCurrent ? 'current' : ''} ${status}`}>
                  <span className={`word-slot-char ${fontClass}`}>{revealed ? unit : isCurrent ? '✍️' : '·'}</span>
                  <span className="word-slot-label">{unitRomaji[i]}</span>
                </div>
              );
            })}
          </div>

          {isWordDone ? (
            <div className="glass-panel" style={{ width: '100%', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <WordReveal word={word} fontClass={fontClass} />
              <div className={`feedback-banner ${unitStatuses.includes('missed') ? 'incorrect' : 'correct'}`} style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                {unitStatuses.includes('missed') ? <X size={16} /> : <Check size={16} />}
                <span>
                  {unitStatuses.includes('missed')
                    ? 'Some kana need more practice — review the red ones above.'
                    : unitStatuses.includes('retry')
                    ? 'Word complete (some kana took a retry).'
                    : 'Perfect! Every kana on the first try.'}
                </span>
              </div>
              <button className="btn-start-practice-prominent" onClick={goToNextWord}>
                <span>{index + 1 >= words.length ? 'Finish' : 'Next word'}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <>
              <KanaDrawPad
                strokes={strokes}
                onStrokesChange={setStrokes}
                guideChar={showGuide || matchResult ? currentUnit : null}
                disabled={Boolean(matchResult?.isCorrect)}
                maxWidth={360}
                placeholder={`Draw "${unitRomaji[unitIndex]}" ✍️`}
              />

              <div style={{ width: 'min(360px, 100%)', display: 'flex', justifyContent: 'space-between', gap: '0.4rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button className="btn-secondary" onClick={handleUndo} disabled={strokes.length === 0} title="Undo last stroke" aria-label="Undo last stroke" style={{ padding: '0.45rem 0.6rem' }}>
                    <RotateCcw size={14} />
                  </button>
                  <button className="btn-secondary" onClick={handleClear} disabled={strokes.length === 0} title="Clear canvas" aria-label="Clear canvas" style={{ padding: '0.45rem 0.6rem' }}>
                    <Trash2 size={14} />
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={toggleGuide}
                    title={showGuide ? 'Hide outline guide' : 'Show outline guide for this kana'}
                    aria-label={showGuide ? 'Hide guide' : 'Show guide'}
                    style={{ padding: '0.45rem 0.6rem', color: showGuide ? 'var(--accent-sakura)' : undefined, borderColor: showGuide ? 'var(--accent-sakura)' : undefined }}
                  >
                    {showGuide ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={toggleGuideLock}
                    title={isGuideLocked ? 'Guide locked: shown on every kana (click to unlock)' : 'Lock guide so it stays visible on every kana'}
                    aria-label={isGuideLocked ? 'Unlock guide' : 'Lock guide'}
                    aria-pressed={isGuideLocked}
                    style={{ padding: '0.45rem 0.6rem', color: isGuideLocked ? 'var(--accent-sakura)' : undefined, borderColor: isGuideLocked ? 'var(--accent-sakura)' : undefined }}
                  >
                    {isGuideLocked ? <Lock size={14} /> : <Unlock size={14} />}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button
                    className={matchResult ? 'btn-secondary' : 'btn-start-practice-prominent'}
                    onClick={checkDrawing}
                    disabled={strokes.length === 0 || Boolean(matchResult?.isCorrect)}
                    style={{ padding: '0.45rem 0.9rem', fontSize: '0.84rem' }}
                  >
                    <Check size={15} />
                    <span>{matchResult && !matchResult.isCorrect ? 'Again' : 'Check'}</span>
                  </button>
                  <button
                    className={matchResult ? 'btn-start-practice-prominent' : 'btn-secondary'}
                    onClick={goToNextUnit}
                    disabled={!matchResult}
                    title={matchResult ? 'Next kana (Enter)' : 'Check your drawing first'}
                    style={{ padding: '0.45rem 0.85rem', fontSize: '0.84rem' }}
                  >
                    <span>Next</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {matchResult && (
                <div
                  className="glass-panel"
                  style={{
                    width: 'min(360px, 100%)',
                    padding: '0.65rem 0.85rem',
                    borderLeft: `4px solid ${matchResult.isCorrect ? 'var(--accent-matcha)' : 'var(--accent-persimmon)'}`,
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <strong style={{ color: matchResult.isCorrect ? 'var(--accent-matcha)' : 'var(--accent-persimmon)' }}>
                    {matchResult.isCorrect ? 'Accurate!' : 'Needs adjustment'} · {matchResult.score}% match
                  </strong>
                  <div style={{ marginTop: '0.2rem' }}>{matchResult.feedback}</div>
                  {!matchResult.isCorrect && (
                    <div style={{ marginTop: '0.2rem', color: 'var(--text-muted)' }}>
                      Compare with the guide and try again, or press Next to move on.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
