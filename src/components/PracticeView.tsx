import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { KanaCharacter, JapaneseFontFamily, PracticeMode, PracticeStats } from '../types/kana';
import { CHARACTER_MAP } from '../data/kanaData';
import { playCelebration } from '../utils/celebration';
import {
  Check,
  X,
  ArrowRight,
  Flame,
  Type,
  ListOrdered,
  Eye,
  Clock,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface PracticeViewProps {
  selectedIds: string[];
  stats: PracticeStats;
  onUpdateStats: (newStats: PracticeStats) => void;
  onFinishPractice: () => void;
  currentFont: JapaneseFontFamily;
  onFontChange: (f: JapaneseFontFamily) => void;
  practiceMode: PracticeMode;
  onModeChange: (m: PracticeMode) => void;
}

interface RoundSummary {
  timeString: string;
  mistakes: number;
  accuracy: number;
  totalCards: number;
}

export const PracticeView: React.FC<PracticeViewProps> = ({
  selectedIds,
  stats,
  onUpdateStats,
  onFinishPractice,
  currentFont,
  onFontChange,
  practiceMode,
  onModeChange,
}) => {
  // Candidate pool of characters
  const activePool: KanaCharacter[] = useMemo(() => {
    return selectedIds
      .map(id => CHARACTER_MAP.get(id))
      .filter((c): c is KanaCharacter => Boolean(c));
  }, [selectedIds]);

  // Session state
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [queue, setQueue] = useState<KanaCharacter[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [feedbackState, setFeedbackState] = useState<'neutral' | 'correct' | 'incorrect'>('neutral');
  const [revealed, setRevealed] = useState<boolean>(false);
  const [sessionMistakes, setSessionMistakes] = useState<number>(0);
  const [sessionCorrect, setSessionCorrect] = useState<number>(0);
  const [randomizedFont, setRandomizedFont] = useState<string>('font-sans-jp');

  // Completed round summary notification
  const [roundSummary, setRoundSummary] = useState<RoundSummary | null>(null);

  // Elapsed time state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);

  // Initialize queue
  useEffect(() => {
    if (activePool.length === 0) return;
    const shuffled = [...activePool].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    setCurrentIndex(0);
    setUserInput('');
    setFeedbackState('neutral');
    setRevealed(false);
    setSessionMistakes(0);
    setSessionCorrect(0);
    setElapsedSeconds(0);
    setIsTimerActive(false);
    setRoundSummary(null);
  }, [activePool]);

  // Live timer interval
  useEffect(() => {
    let interval: number | null = null;
    if (isTimerActive) {
      interval = window.setInterval(() => {
        setElapsedSeconds(s => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive]);

  const currentKana = queue[currentIndex] || activePool[0];

  // Font options
  const fontOptions: { id: JapaneseFontFamily; label: string; class: string }[] = [
    { id: 'sans', label: 'Gothic (Sans)', class: 'font-sans-jp' },
    { id: 'serif', label: 'Mincho (Serif)', class: 'font-serif-jp' },
    { id: 'maru', label: 'Handwritten (Maru)', class: 'font-maru-jp' },
    { id: 'brush', label: 'Calligraphy (Brush)', class: 'font-brush-jp' },
    { id: 'random', label: 'Random Fonts', class: '' },
  ];

  useEffect(() => {
    if (currentFont === 'random') {
      const standardFonts = ['font-sans-jp', 'font-serif-jp', 'font-maru-jp', 'font-brush-jp'];
      const picked = standardFonts[Math.floor(Math.random() * standardFonts.length)];
      setRandomizedFont(picked);
    }
  }, [currentKana, currentFont]);

  const activeFontClass = currentFont === 'random'
    ? randomizedFont
    : fontOptions.find(f => f.id === currentFont)?.class || 'font-sans-jp';

  // Format mm:ss
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Always keep input focused
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, feedbackState, roundSummary]);

  // Advance card & handle seamless round cycling
  const advanceCard = useCallback((wasCorrect: boolean, kana: KanaCharacter) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const prevCharStats = stats.characterStats[kana.id] || { attempts: 0, correct: 0, lastPracticed: Date.now() };
    const newStreak = wasCorrect ? stats.currentStreak + 1 : 0;
    const newBest = Math.max(stats.bestStreak, newStreak);

    // Streak milestones are tracked but no mid-practice animation

    const updatedStats: PracticeStats = {
      totalAttempts: stats.totalAttempts + 1,
      correctAttempts: stats.correctAttempts + (wasCorrect ? 1 : 0),
      currentStreak: newStreak,
      bestStreak: newBest,
      characterStats: {
        ...stats.characterStats,
        [kana.id]: {
          attempts: prevCharStats.attempts + 1,
          correct: prevCharStats.correct + (wasCorrect ? 1 : 0),
          lastPracticed: Date.now(),
        },
      },
    };

    onUpdateStats(updatedStats);

    const newMistakes = sessionMistakes + (wasCorrect ? 0 : 1);
    const newCorrect = sessionCorrect + (wasCorrect ? 1 : 0);
    setSessionCorrect(newCorrect);
    setSessionMistakes(newMistakes);

    // Reset card inputs
    setUserInput('');
    setFeedbackState('neutral');
    setRevealed(false);

    // Check if this was the last card of the current round
    if (currentIndex + 1 >= queue.length) {
      const totalAnswers = newCorrect + newMistakes;
      const acc = totalAnswers > 0 ? Math.round((newCorrect / totalAnswers) * 100) : 100;

      setRoundSummary({
        timeString: formatTime(elapsedSeconds),
        mistakes: newMistakes,
        accuracy: acc,
        totalCards: queue.length,
      });

      // Play image-based celebration based on accuracy
      playCelebration(acc);

      // Seamless restart
      const nextRoundShuffled = [...activePool].sort(() => Math.random() - 0.5);
      setQueue(nextRoundShuffled);
      setCurrentIndex(0);
      setSessionMistakes(0);
      setSessionCorrect(0);
      setIsTimerActive(false);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, queue.length, stats, sessionMistakes, sessionCorrect, elapsedSeconds, activePool, onUpdateStats]);

  // Check answer
  const checkAnswer = useCallback((typed: string) => {
    if (!currentKana || feedbackState !== 'neutral') return;

    if (!isTimerActive) {
      setIsTimerActive(true);
      if (roundSummary) {
        setRoundSummary(null);
        setElapsedSeconds(0);
      }
    }

    const normalized = typed.trim().toLowerCase();
    if (!normalized) return;

    const isMatch = currentKana.alternatives.includes(normalized) || currentKana.romaji.toLowerCase() === normalized;

    if (isMatch) {
      setFeedbackState('correct');
      timerRef.current = window.setTimeout(() => {
        advanceCard(true, currentKana);
      }, 350);
    } else {
      setFeedbackState('incorrect');
      setRevealed(true);
    }
  }, [currentKana, feedbackState, isTimerActive, roundSummary, advanceCard]);

  // Typing input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;

    if (!isTimerActive && val.length > 0) {
      setIsTimerActive(true);
      setElapsedSeconds(0);
      setRoundSummary(null);
    }

    setUserInput(val);

    if (feedbackState !== 'neutral') return;

    const cleanVal = val.trim().toLowerCase();
    if (currentKana && (currentKana.alternatives.includes(cleanVal) || currentKana.romaji.toLowerCase() === cleanVal)) {
      checkAnswer(val);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (feedbackState === 'incorrect' || revealed) {
        advanceCard(false, currentKana);
      } else {
        checkAnswer(userInput);
      }
    } else if (e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      if (!revealed) {
        setRevealed(true);
        setFeedbackState('incorrect');
      } else {
        advanceCard(false, currentKana);
      }
    }
  };

  const handleDontKnow = () => {
    if (!currentKana) return;
    if (!revealed) {
      setRevealed(true);
      setFeedbackState('incorrect');
    } else {
      advanceCard(false, currentKana);
    }
  };

  // Multiple choice distractors
  const multipleChoiceOptions = useMemo(() => {
    if (!currentKana || practiceMode !== 'multiple-choice') return [];
    const correctRomaji = currentKana.romaji;
    const others = Array.from(new Set(activePool.map(c => c.romaji)))
      .filter(r => r !== correctRomaji)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return [correctRomaji, ...others].sort(() => Math.random() - 0.5);
  }, [currentKana, activePool, practiceMode]);

  const handleSelectMultipleChoice = (chosenRomaji: string) => {
    if (!currentKana || feedbackState !== 'neutral') return;
    if (!isTimerActive) {
      setIsTimerActive(true);
      setElapsedSeconds(0);
      setRoundSummary(null);
    }

    if (chosenRomaji === currentKana.romaji) {
      setFeedbackState('correct');
      timerRef.current = window.setTimeout(() => {
        advanceCard(true, currentKana);
      }, 350);
    } else {
      setFeedbackState('incorrect');
      setRevealed(true);
    }
  };

  if (activePool.length === 0) {
    return (
      <div className="practice-screen glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📝</div>
        <h3 style={{ marginBottom: '0.5rem' }}>No characters selected</h3>
        <p style={{ margin: '0.8rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Go back to the selector and choose at least one kana to start practicing.
        </p>
        <button className="btn-start-practice-prominent" onClick={onFinishPractice} style={{ marginTop: '0.75rem' }}>
          Go to Character Selector
        </button>
      </div>
    );
  }

  const totalInQueue = queue.length || activePool.length;
  const progressPercent = Math.round(((currentIndex) / totalInQueue) * 100);

  return (
    <div className="practice-screen">
      {/* DASHBOARD */}
      <div className="practice-stats-dashboard glass-panel">
        <div className="practice-top-metrics">
          <div className="metric-pill progress-info">
            <span>Card <strong>{currentIndex + 1}</strong> of {totalInQueue}</span>
            <span style={{ opacity: 0.7 }}>({progressPercent}%)</span>
          </div>

          <div className="metric-pill errors">
            <AlertTriangle size={13} />
            <span>Mistakes: <strong>{sessionMistakes}</strong></span>
          </div>

          <div className="metric-pill timer">
            <Clock size={13} />
            <span><strong>{formatTime(elapsedSeconds)}</strong></span>
          </div>

          {stats.currentStreak > 0 && (
            <div className="streak-pill" style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem' }}>
              <Flame size={13} />
              <span>{stats.currentStreak} streak</span>
            </div>
          )}

          <button
            className="btn-secondary"
            onClick={onFinishPractice}
            style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
          >
            ← Back
          </button>
        </div>

        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Round Complete Banner */}
      {roundSummary && (
        <div className="round-complete-inline-banner" style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem' }}>
            <Sparkles size={16} color="var(--accent-sakura)" />
            <span>
              <strong>Round Complete!</strong>{' '}
              {roundSummary.totalCards} cards in <strong>{roundSummary.timeString}</strong> —{' '}
              <strong>{roundSummary.accuracy}%</strong> accuracy.
              <span style={{ marginLeft: '6px', color: 'var(--text-muted)' }}>
                Keep going! ✨
              </span>
            </span>
          </div>
          <button
            onClick={() => {
              setRoundSummary(null);
              setElapsedSeconds(0);
              setIsTimerActive(true);
            }}
            style={{ color: 'var(--text-muted)', fontSize: '0.82rem', padding: '2px 6px' }}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* PRACTICE CARD */}
      <div className={`practice-card-box glass-panel-elevated ${feedbackState}`}>
        {/* Top: Script Badge & Font */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {currentKana.script === 'hiragana' ? 'Hiragana (ひらがな)' : 'Katakana (カタカナ)'}
          </span>

          <select
            value={currentFont}
            onChange={(e) => onFontChange(e.target.value as JapaneseFontFamily)}
            className="btn-secondary"
            style={{ padding: '0.25rem 0.55rem', fontSize: '0.76rem', outline: 'none' }}
            title="Change Japanese typeface"
          >
            {fontOptions.map(f => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Large Kana Display */}
        <div className={`practice-big-char ${activeFontClass}`}>
          {currentKana.character}
        </div>

        {/* Reserved Feedback Zone - Completely fixed dimensions so the card never expands or shifts */}
        <div
          className="practice-feedback-zone"
          style={{
            height: '56px',
            minHeight: '56px',
            maxHeight: '56px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginBottom: '0.65rem',
            overflow: 'hidden',
          }}
        >
          {feedbackState === 'correct' && (
            <div className="feedback-banner correct" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              <Check size={18} strokeWidth={3} />
              <span>Correct! ({currentKana.romaji})</span>
            </div>
          )}

          {(feedbackState === 'incorrect' || revealed) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
              <div className="feedback-banner incorrect" style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                <X size={16} strokeWidth={3} />
                <span>Answer: </span>
                <strong
                  style={{
                    background: 'var(--accent-persimmon-soft)',
                    padding: '0.15rem 0.65rem',
                    borderRadius: 'var(--radius-xs)',
                    color: 'var(--accent-persimmon)',
                  }}
                >
                  {currentKana.romaji}
                </strong>
              </div>
              {currentKana.mnemonic && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  💡 {currentKana.mnemonic}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Type Mode Input */}
        {practiceMode === 'type' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem', width: '100%' }}>
            <input
              ref={inputRef}
              type="text"
              className={`romaji-input ${feedbackState}`}
              value={userInput}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type romaji..."
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              disabled={feedbackState === 'correct'}
              autoFocus
            />

            <button
              className="btn-secondary"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.86rem', maxWidth: '320px', width: '100%' }}
              onClick={handleDontKnow}
            >
              {revealed ? (
                <>
                  <ArrowRight size={14} />
                  <span>Next Character (Enter)</span>
                </>
              ) : (
                <>
                  <Eye size={14} />
                  <span>Don't Know (Space)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Multiple Choice */}
        {practiceMode === 'multiple-choice' && (
          <div className="mc-options-grid" style={{ marginTop: '0.75rem', maxWidth: '340px' }}>
            {multipleChoiceOptions.map((opt) => (
              <button
                key={opt}
                className="btn-secondary"
                style={{
                  padding: '0.85rem',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  background: feedbackState !== 'neutral' && opt === currentKana.romaji
                    ? 'var(--accent-matcha-soft)'
                    : undefined,
                  borderColor: feedbackState !== 'neutral' && opt === currentKana.romaji
                    ? 'var(--accent-matcha)'
                    : undefined,
                }}
                onClick={() => handleSelectMultipleChoice(opt)}
                disabled={feedbackState !== 'neutral'}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* Flashcard Mode */}
        {practiceMode === 'flashcard' && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
            {!revealed ? (
              <button className="btn-start-practice-prominent" onClick={() => setRevealed(true)}>
                <Eye size={16} />
                <span>Reveal Answer</span>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <button
                  className="btn-clear-prominent"
                  style={{ padding: '0.65rem 1.5rem' }}
                  onClick={() => advanceCard(false, currentKana)}
                >
                  <X size={15} />
                  <span>Missed</span>
                </button>
                <button
                  className="btn-start-practice-prominent"
                  style={{ background: 'var(--accent-matcha)', boxShadow: 'none' }}
                  onClick={() => advanceCard(true, currentKana)}
                >
                  <Check size={15} />
                  <span>Got it!</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          <div>
            Auto-advances on match. Press <span className="keyboard-badge">Space</span> to reveal.
          </div>

          <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-secondary)', padding: '3px', borderRadius: 'var(--radius-xs)' }}>
            {([
              { mode: 'type' as PracticeMode, icon: <Type size={13} />, title: 'Typing' },
              { mode: 'multiple-choice' as PracticeMode, icon: <ListOrdered size={13} />, title: 'Multiple Choice' },
              { mode: 'flashcard' as PracticeMode, icon: <Eye size={13} />, title: 'Flashcard' },
            ]).map(({ mode, icon, title }) => (
              <button
                key={mode}
                onClick={() => onModeChange(mode)}
                style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  background: practiceMode === mode ? 'var(--accent-wisteria)' : 'transparent',
                  color: practiceMode === mode ? '#fff' : 'inherit',
                  fontWeight: practiceMode === mode ? 700 : 400,
                  fontSize: '0.72rem',
                }}
                title={title}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
