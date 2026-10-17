import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { KanaCharacter, ScriptType, KanaCategory } from '../types/kana';
import {
  ALL_CHARACTERS,
  HIRAGANA_CHARACTERS,
  KATAKANA_CHARACTERS,
  getGridRows,
  getCombinationRows,
} from '../data/kanaData';
import {
  type Stroke,
  matchKanaAgainstTarget,
  renderKanjiVgGuide,
  getReferenceStrokes,
  type VectorMatchResult,
} from '../utils/strokeMatcher';
import { playKanaAudio, stopKanaAudio, getKanaVolume, setKanaVolume } from '../utils/audio';
import { playCelebration } from '../utils/celebration';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  PenTool,
  HelpCircle,
  Flame,
  Lock,
  Unlock,
} from 'lucide-react';

interface DrawTestViewProps {
  selectedIds: string[];
  onSelectedIdsChange: React.Dispatch<React.SetStateAction<string[]>>;
  fontClass: string;
  onGoToSelector: () => void;
}

export const DrawTestView: React.FC<DrawTestViewProps> = ({
  selectedIds: drawSelectedIds,
  onSelectedIdsChange: setDrawSelectedIds,
  fontClass,
}) => {
  // Navigation between Selection stage and Active Drawing stage
  const [viewStage, setViewStage] = useState<'select' | 'drawing'>('select');

  // Character selection is shared with the Practice selector (owned by App)

  // Selector controls inside Draw Test
  const [activeScript, setActiveScript] = useState<ScriptType>('hiragana');
  const [activeCategory, setActiveCategory] = useState<KanaCategory>('basic');

  // Drawing test settings
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(() => getKanaVolume());
  // Guide is shown for the current card only, unless locked to persist across cards
  const [showGhostGuide, setShowGhostGuide] = useState<boolean>(false);
  const [isGuideLocked, setIsGuideLocked] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const playedCardKeyRef = useRef<string | null>(null);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setAudioVolume(val);
    setKanaVolume(val);
  };

  // Drawing session queue & metrics
  const [testPool, setTestPool] = useState<KanaCharacter[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [sessionCorrect, setSessionCorrect] = useState<number>(0);
  const [sessionMistakes, setSessionMistakes] = useState<number>(0);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [bestStreak, setBestStreak] = useState<number>(0);
  const [isRoundFinished, setIsRoundFinished] = useState<boolean>(false);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<Stroke>([]);

  // Verification state
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<VectorMatchResult | null>(null);
  const [showMnemonic, setShowMnemonic] = useState<boolean>(false);

  const drawSelectedSet = useMemo(() => new Set(drawSelectedIds), [drawSelectedIds]);

  // Lookup map
  const charLookup = useMemo(() => {
    return new Map(ALL_CHARACTERS.map((c) => [c.id, c]));
  }, []);

  // Compute selected count per category
  const categoryCounts = useMemo(() => {
    const counts = { basic: 0, dakuten: 0, handakuten: 0, combination: 0 };
    for (const id of drawSelectedIds) {
      const char = charLookup.get(id);
      if (char && char.script === activeScript) {
        counts[char.category] = (counts[char.category] || 0) + 1;
      }
    }
    return counts;
  }, [drawSelectedIds, activeScript, charLookup]);

  // Grid rows for selector
  const rows = useMemo(() => {
    return activeCategory === 'combination'
      ? getCombinationRows(activeScript)
      : getGridRows(activeScript, activeCategory);
  }, [activeScript, activeCategory]);

  // Toggle single kana in selection
  const handleToggleId = (id: string) => {
    setDrawSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Toggle entire row
  const handleToggleRow = (rowCharIds: string[]) => {
    const validIds = rowCharIds.filter(Boolean);
    const allSelected = validIds.every((id) => drawSelectedSet.has(id));
    if (allSelected) {
      setDrawSelectedIds((prev) => prev.filter((id) => !validIds.includes(id)));
    } else {
      const toAdd = validIds.filter((id) => !drawSelectedSet.has(id));
      setDrawSelectedIds((prev) => [...prev, ...toAdd]);
    }
  };

  // Presets
  const applyPreset = (presetType: string) => {
    const scriptChars = activeScript === 'hiragana' ? HIRAGANA_CHARACTERS : KATAKANA_CHARACTERS;
    let targetIds: string[] = [];

    switch (presetType) {
      case 'vowels':
        targetIds = scriptChars.filter((c) => c.rowGroup === 'vowel').map((c) => c.id);
        break;
      case 'first15':
        targetIds = scriptChars.filter((c) => ['vowel', 'k', 's'].includes(c.rowGroup)).map((c) => c.id);
        break;
      case 'basicAll':
        targetIds = scriptChars.filter((c) => c.category === 'basic').map((c) => c.id);
        break;
      case 'dakutenAll':
        targetIds = scriptChars.filter((c) => c.category === 'dakuten' || c.category === 'handakuten').map((c) => c.id);
        break;
      case 'comboAll':
        targetIds = scriptChars.filter((c) => c.category === 'combination').map((c) => c.id);
        break;
      case 'allScript':
        targetIds = scriptChars.map((c) => c.id);
        break;
      default:
        break;
    }

    setDrawSelectedIds((prev) => Array.from(new Set([...prev, ...targetIds])));
  };

  // Start Drawing Test session
  const startDrawingTest = () => {
    if (drawSelectedIds.length === 0) return;
    stopKanaAudio();
    setIsPlayingAudio(false);
    playedCardKeyRef.current = null;

    const pool = drawSelectedIds
      .map((id) => charLookup.get(id))
      .filter((c): c is KanaCharacter => Boolean(c));

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setTestPool(shuffled);
    setCurrentIndex(0);
    setSessionCorrect(0);
    setSessionMistakes(0);
    setCurrentStreak(0);
    setIsRoundFinished(false);
    setStrokes([]);
    setVerificationResult(null);
    setShowMnemonic(false);
    setShowGhostGuide(isGuideLocked);
    setViewStage('drawing');
  };

  const currentKana = testPool[currentIndex] || testPool[0];

  const targetStrokeCount = useMemo(() => {
    if (!currentKana) return 0;
    return getReferenceStrokes(currentKana.character).length;
  }, [currentKana]);

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopKanaAudio();
    };
  }, []);

  // Safe manual audio toggle (play or stop)
  const handleToggleAudio = useCallback(async () => {
    if (!currentKana) return;
    if (isPlayingAudio) {
      stopKanaAudio();
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      await playKanaAudio(currentKana.character);
      setIsPlayingAudio(false);
    }
  }, [currentKana, isPlayingAudio]);

  // Auto-play audio ONLY when card changes and autoPlayAudio is enabled
  useEffect(() => {
    if (viewStage !== 'drawing' || !currentKana || isRoundFinished) {
      stopKanaAudio();
      playedCardKeyRef.current = null;
      return;
    }

    if (autoPlayAudio) {
      const cardKey = `${currentIndex}-${currentKana.id}`;
      if (playedCardKeyRef.current !== cardKey) {
        playedCardKeyRef.current = cardKey;
        const timer = setTimeout(() => {
          setIsPlayingAudio(true);
          playKanaAudio(currentKana.character).finally(() => {
            setIsPlayingAudio(false);
          });
        }, 200);
        return () => {
          clearTimeout(timer);
          stopKanaAudio();
        };
      }
    } else {
      playedCardKeyRef.current = null;
    }
  }, [currentIndex, currentKana, autoPlayAudio, viewStage, isRoundFinished]);

  // Canvas Redraw Logic
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Traditional Genkoyoshi / Japanese practice paper guidelines
    ctx.save();
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(140, 110, 100, 0.22)';

    // Center horizontal
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Center vertical
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Subtle diagonal cross
    ctx.strokeStyle = 'rgba(140, 110, 100, 0.1)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();

    ctx.restore();

    // Authentic KanjiVG calligraphy ghost guide with stroke numbers.
    // Always revealed after checking so the user can compare against the reference.
    if ((showGhostGuide || verificationResult) && currentKana) {
      renderKanjiVgGuide(canvas, currentKana.character, {
        strokeColor: 'rgba(235, 110, 130, 0.42)',
        lineWidth: 6,
        showNumbers: true,
      });
    }

    // Draw user strokes
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 8;
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    ctx.strokeStyle = isDark ? '#efe6dc' : '#2b2320';

    for (const stroke of strokes) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      if (stroke.length === 1) {
        ctx.arc(stroke[0].x, stroke[0].y, 4, 0, Math.PI * 2);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.fill();
      } else {
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [strokes, showGhostGuide, verificationResult, currentKana]);

  useEffect(() => {
    if (viewStage === 'drawing') {
      redrawCanvas();
    }
  }, [redrawCanvas, viewStage]);

  // Pointer event handlers for drawing
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isVerifying || verificationResult?.isCorrect) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;

    const coords = getCanvasCoords(e);
    const newPoint = { x: coords.x, y: coords.y, time: Date.now() };
    currentStrokeRef.current = [newPoint];

    setStrokes((prev) => [...prev, [newPoint]]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const coords = getCanvasCoords(e);
    const newPoint = { x: coords.x, y: coords.y, time: Date.now() };

    currentStrokeRef.current.push(newPoint);

    // Direct draw to avoid lag
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const len = currentStrokeRef.current.length;
        if (len >= 2) {
          const p1 = currentStrokeRef.current[len - 2];
          const p2 = currentStrokeRef.current[len - 1];
          ctx.save();
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 8;
          const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
          ctx.strokeStyle = isDark ? '#efe6dc' : '#2b2320';
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Save final stroke array to React state
    if (currentStrokeRef.current.length > 0) {
      const finalStroke = [...currentStrokeRef.current];
      setStrokes((prev) => {
        if (prev.length === 0) return [finalStroke];
        const updated = [...prev];
        updated[updated.length - 1] = finalStroke;
        return updated;
      });
    }
    currentStrokeRef.current = [];
  };

  // Undo last stroke
  const handleUndo = () => {
    if (strokes.length === 0 || isVerifying) return;
    setStrokes((prev) => prev.slice(0, -1));
    setVerificationResult(null);
  };

  // Clear canvas (manual only — never automatic)
  const handleClear = () => {
    setStrokes([]);
    setVerificationResult(null);
  };

  // Check the completed drawing using Vector Stroke Matching & KanjiVG DTW
  const handleVerify = useCallback(() => {
    if (!currentKana || strokes.length === 0 || isVerifying) return;

    setIsVerifying(true);
    setVerificationResult(null);

    // Vector stroke evaluation against target KanjiVG character (instant, 0ms latency)
    const result = matchKanaAgainstTarget(strokes, currentKana.character, {
      strictOrder: true,
      thresholdScore: 62,
    });

    setIsVerifying(false);
    setVerificationResult(result);

    if (result.isCorrect) {
      const nextStreak = currentStreak + 1;
      setCurrentStreak(nextStreak);
      setBestStreak((prev) => Math.max(prev, nextStreak));
      setSessionCorrect((prev) => prev + 1);
    } else {
      setCurrentStreak(0);
      setSessionMistakes((prev) => prev + 1);
    }
  }, [currentKana, strokes, isVerifying, currentStreak]);

  // Advance to next card
  const handleNext = useCallback(() => {
    stopKanaAudio();
    setIsPlayingAudio(false);
    if (currentIndex + 1 >= testPool.length) {
      const totalAnswers = sessionCorrect + sessionMistakes;
      const acc = totalAnswers > 0 ? Math.round((sessionCorrect / totalAnswers) * 100) : 100;
      setIsRoundFinished(true);
      playCelebration(acc);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setStrokes([]);
      setVerificationResult(null);
      setShowMnemonic(false);
      setShowGhostGuide(isGuideLocked);
    }
  }, [currentIndex, testPool.length, sessionCorrect, sessionMistakes, isGuideLocked]);

  const handleToggleGuide = () => {
    if (showGhostGuide) {
      setShowGhostGuide(false);
      setIsGuideLocked(false);
    } else {
      setShowGhostGuide(true);
    }
  };

  const handleToggleGuideLock = () => {
    const nextLocked = !isGuideLocked;
    setIsGuideLocked(nextLocked);
    if (nextLocked) setShowGhostGuide(true);
  };

  // Keyboard shortcut for Enter/Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewStage !== 'drawing') return;
      if (e.key === 'Enter') {
        e.preventDefault();
        if (verificationResult?.isCorrect) {
          handleNext();
        } else if (strokes.length > 0 && !isVerifying) {
          handleVerify();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewStage, verificationResult, strokes.length, isVerifying, handleNext, handleVerify]);

  // ==========================================
  // STAGE 1: ALPHABET & KANA SELECTION SCREEN (identical to selector)
  // ==========================================
  if (viewStage === 'select') {
    return (
      <div className="selector-page">
        {/* TOP TOOLBAR */}
        <div className="glass-panel selector-top-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div className="script-segmented-control">
              <button
                className={`script-tab-btn ${activeScript === 'hiragana' ? 'active' : ''}`}
                onClick={() => setActiveScript('hiragana')}
              >
                ひらがな Hiragana
              </button>
              <button
                className={`script-tab-btn ${activeScript === 'katakana' ? 'active' : ''}`}
                onClick={() => setActiveScript('katakana')}
              >
                カタカナ Katakana
              </button>
            </div>

            <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.94rem' }}>{drawSelectedIds.length}</strong> selected
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              className="btn-clear-prominent"
              onClick={() => setDrawSelectedIds([])}
              disabled={drawSelectedIds.length === 0}
              title="Deselect all characters"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>

            <button
              className="btn-start-practice-prominent"
              onClick={startDrawingTest}
              disabled={drawSelectedIds.length === 0}
            >
              <PenTool size={16} />
              <span>Start Draw Test ({drawSelectedIds.length})</span>
            </button>
          </div>
        </div>

        {/* CATEGORY TABS + PRESETS */}
        <div className="selector-middle-bar">
          <div className="category-tab-strip">
            <button
              className={`category-tab-item ${activeCategory === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveCategory('basic')}
            >
              <span>Basic (Gojūon)</span>
              <span className={`tab-badge-count ${categoryCounts.basic > 0 ? 'has-items' : ''}`}>
                {categoryCounts.basic}
              </span>
            </button>

            <button
              className={`category-tab-item ${activeCategory === 'dakuten' ? 'active' : ''}`}
              onClick={() => setActiveCategory('dakuten')}
            >
              <span>Voiced (Dakuten)</span>
              <span className={`tab-badge-count ${categoryCounts.dakuten > 0 ? 'has-items' : ''}`}>
                {categoryCounts.dakuten}
              </span>
            </button>

            <button
              className={`category-tab-item ${activeCategory === 'handakuten' ? 'active' : ''}`}
              onClick={() => setActiveCategory('handakuten')}
            >
              <span>Semi-Voiced</span>
              <span className={`tab-badge-count ${categoryCounts.handakuten > 0 ? 'has-items' : ''}`}>
                {categoryCounts.handakuten}
              </span>
            </button>

            <button
              className={`category-tab-item ${activeCategory === 'combination' ? 'active' : ''}`}
              onClick={() => setActiveCategory('combination')}
            >
              <span>Combos (Yōon)</span>
              <span className={`tab-badge-count ${categoryCounts.combination > 0 ? 'has-items' : ''}`}>
                {categoryCounts.combination}
              </span>
            </button>
          </div>

          <div className="presets-group">
            <button
              className="btn-secondary"
              onClick={() => applyPreset('vowels')}
              title="Add a, i, u, e, o"
            >
              + Vowels
            </button>
            <button
              className="btn-secondary"
              onClick={() => applyPreset('first15')}
              title="Add a, ka, sa rows"
            >
              + First 15
            </button>

            <select
              className="btn-secondary"
              style={{ outline: 'none', cursor: 'pointer' }}
              onChange={(e) => {
                if (e.target.value) {
                  applyPreset(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
            >
              <option value="" disabled>More ▾</option>
              <option value="basicAll">+ All Basic</option>
              <option value="dakutenAll">+ All Dakuten</option>
              <option value="comboAll">+ All Combos</option>
              <option value="allScript">+ Everything</option>
            </select>
          </div>
        </div>

        {/* KANA GRID */}
        <div className="glass-panel compact-grid-card">
          <div className="kana-grid-container-compact">
            {rows.map((row) => {
              const validChars = row.characters.filter((c): c is NonNullable<typeof c> => c !== null);
              const rowCharIds = validChars.map((c) => c.id);
              const isAllSelected = rowCharIds.length > 0 && rowCharIds.every((id) => drawSelectedSet.has(id));
              const hasSomeSelected = rowCharIds.some((id) => drawSelectedSet.has(id));

              return (
                <div key={row.groupId} className="kana-grid-row-compact">
                  <button
                    className={`row-label-button-compact ${isAllSelected ? 'all-active' : ''}`}
                    onClick={() => handleToggleRow(rowCharIds)}
                    title={`Toggle all ${row.label}`}
                  >
                    <span>{row.label}</span>
                    <span style={{ fontSize: '0.68rem', opacity: isAllSelected || hasSomeSelected ? 1 : 0.4 }}>
                      {isAllSelected ? '✓' : hasSomeSelected ? '•' : '+'}
                    </span>
                  </button>

                  <div className="row-cells-compact">
                    {row.characters.map((kana, idx) => {
                      if (!kana) {
                        return <div key={`empty-${idx}`} className="kana-tile-compact empty" />;
                      }

                      const isSelected = drawSelectedSet.has(kana.id);

                      return (
                        <div
                          key={kana.id}
                          className={`kana-tile-compact ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleId(kana.id)}
                          title={`${kana.character} (${kana.romaji})`}
                        >
                          <div className="kana-check-dot" />
                          <span className={`kana-char-compact ${fontClass}`}>{kana.character}</span>
                          <span className="kana-romaji-compact">{kana.romaji}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM STATUS */}
        <div className="selected-fixed-status-bar">
          <span>
            💡 {drawSelectedIds.length === 0 ? 'Select characters above to start draw test.' : `${drawSelectedIds.length} characters in your draw test queue.`}
          </span>
          {drawSelectedIds.length > 0 && (
            <button
              onClick={startDrawingTest}
              style={{ color: 'var(--accent-sakura)', fontWeight: 700, fontSize: '0.82rem' }}
            >
              Start draw test →
            </button>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // STAGE 2: DRAWING CANVAS TEST SCREEN
  // ==========================================
  const totalCards = testPool.length;
  const progressPercent = totalCards > 0 ? Math.round((currentIndex / totalCards) * 100) : 0;
  const accuracy = sessionCorrect + sessionMistakes > 0
    ? Math.round((sessionCorrect / (sessionCorrect + sessionMistakes)) * 100)
    : 100;

  return (
    <div className="draw-test-page" style={{ maxWidth: '960px', margin: '0 auto' }}>
      {/* Top Bar: Back to Selection & Metrics */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <button
          className="btn-secondary"
          onClick={() => {
            stopKanaAudio();
            setIsPlayingAudio(false);
            setViewStage('select');
          }}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.82rem', gap: '0.4rem' }}
        >
          <ArrowLeft size={14} />
          <span>Change Characters</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem' }}>
          {currentStreak > 0 && (
            <div className="streak-pill" title={`${currentStreak} correct in a row`}>
              <Flame size={13} />
              <span>{currentStreak} streak</span>
            </div>
          )}

          <div style={{ color: 'var(--text-muted)' }}>
            Card <strong>{currentIndex + 1}</strong> of {totalCards}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Round Finished Summary */}
      {isRoundFinished ? (
        <div className="glass-panel" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🌸</div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-highlight)' }}>
            Drawing Test Complete!
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            You drew <strong>{totalCards}</strong> characters with <strong>{accuracy}%</strong> accuracy.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-matcha)' }}>
                {sessionCorrect}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Correct</div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-persimmon)' }}>
                {sessionMistakes}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mistakes</div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                {bestStreak}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Best Streak</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
            <button className="btn-start-practice-prominent" onClick={startDrawingTest}>
              <RotateCcw size={15} />
              <span>Practice Again</span>
            </button>
            <button className="btn-secondary" onClick={() => setViewStage('select')}>
              Select Different Characters
            </button>
          </div>
        </div>
      ) : (
        /* Active Drawing Exercise */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          {/* Prompt Box */}
          <div
            className="glass-panel"
            style={{
              width: '100%',
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
                {currentKana.script === 'hiragana' ? 'Hiragana (ひらがな)' : 'Katakana (カタカナ)'}
              </div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-highlight)' }}>
                {currentKana.romaji}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className={`btn-secondary ${isPlayingAudio ? 'active' : ''}`}
                onClick={handleToggleAudio}
                title={isPlayingAudio ? 'Stop audio playback' : 'Listen to Japanese pronunciation'}
                style={{
                  padding: '0.5rem 0.9rem',
                  fontSize: '0.82rem',
                  gap: '0.4rem',
                  color: isPlayingAudio ? 'var(--accent-sakura)' : undefined,
                  borderColor: isPlayingAudio ? 'var(--accent-sakura)' : undefined,
                }}
              >
                <Volume2 size={16} />
                <span>{isPlayingAudio ? 'Stop' : 'Listen'}</span>
              </button>

              <button
                className={`btn-secondary ${autoPlayAudio ? 'active' : ''}`}
                onClick={() => setAutoPlayAudio((prev) => !prev)}
                title={autoPlayAudio ? 'Auto-play sound is ON (click to turn OFF)' : 'Auto-play sound is OFF (click to turn ON)'}
                style={{
                  padding: '0.5rem 0.8rem',
                  fontSize: '0.82rem',
                  gap: '0.35rem',
                  color: autoPlayAudio ? 'var(--accent-sakura)' : undefined,
                  borderColor: autoPlayAudio ? 'var(--accent-sakura)' : undefined,
                }}
              >
                <span>{autoPlayAudio ? '🔊 Auto: ON' : '🔈 Auto: OFF'}</span>
              </button>

              {/* Volume Slider Control */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.4rem 0.65rem',
                  background: 'var(--bg-secondary)',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)',
                }}
                title={`Volume: ${Math.round(audioVolume * 100)}%`}
              >
                {audioVolume === 0 ? (
                  <VolumeX size={15} color="var(--text-muted)" />
                ) : (
                  <Volume2 size={15} color="var(--accent-sakura)" />
                )}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioVolume}
                  onChange={handleVolumeChange}
                  style={{
                    width: '65px',
                    height: '4px',
                    cursor: 'pointer',
                    accentColor: 'var(--accent-sakura)',
                  }}
                  aria-label="Adjust voice volume"
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: '28px', textAlign: 'right' }}>
                  {Math.round(audioVolume * 100)}%
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  className={`btn-secondary ${showGhostGuide ? 'active' : ''}`}
                  onClick={handleToggleGuide}
                  title={showGhostGuide ? 'Hide outline guide' : 'Show outline guide for this character'}
                  style={{
                    padding: '0.5rem 0.9rem',
                    fontSize: '0.82rem',
                    gap: '0.4rem',
                    color: showGhostGuide ? 'var(--accent-sakura)' : undefined,
                    borderColor: showGhostGuide ? 'var(--accent-sakura)' : undefined,
                  }}
                >
                  {showGhostGuide ? <EyeOff size={15} /> : <Eye size={15} />}
                  <span>{showGhostGuide ? 'Hide Guide' : 'Show Guide'}</span>
                </button>

                <button
                  className={`btn-secondary ${isGuideLocked ? 'active' : ''}`}
                  onClick={handleToggleGuideLock}
                  title={isGuideLocked ? 'Guide locked: shown on every character (click to unlock)' : 'Lock guide so it stays visible on every character'}
                  aria-label={isGuideLocked ? 'Unlock guide' : 'Lock guide'}
                  aria-pressed={isGuideLocked}
                  style={{
                    padding: '0.5rem 0.65rem',
                    color: isGuideLocked ? 'var(--accent-sakura)' : undefined,
                    borderColor: isGuideLocked ? 'var(--accent-sakura)' : undefined,
                  }}
                >
                  {isGuideLocked ? <Lock size={15} /> : <Unlock size={15} />}
                </button>
              </div>

              {currentKana.mnemonic && (
                <button
                  className={`btn-secondary ${showMnemonic ? 'active' : ''}`}
                  onClick={() => setShowMnemonic((prev) => !prev)}
                  title={showMnemonic ? 'Hide memory hint' : 'Show memory hint'}
                  aria-label={showMnemonic ? 'Hide memory hint' : 'Show memory hint'}
                  aria-pressed={showMnemonic}
                  style={{
                    padding: '0.5rem 0.65rem',
                    color: showMnemonic ? 'var(--accent-gold)' : undefined,
                    borderColor: showMnemonic ? 'var(--accent-gold)' : undefined,
                  }}
                >
                  <HelpCircle size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Side-by-Side Drawing Workspace: Canvas on Left, Feedback/Guidance on Right */}
          <div
            className="draw-workspace"
            style={{
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'flex-start',
              justifyContent: 'center',
              flexWrap: 'wrap',
              width: '100%',
            }}
          >
            {/* Left Column: Canvas and Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: 'min(440px, 100%)', flexShrink: 0 }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '1 / 1',
                  background: 'var(--bg-card)',
                  borderRadius: '4px',
                  border: '1px solid var(--border-medium)',
                  boxShadow: 'none',
                  touchAction: 'none',
                  userSelect: 'none',
                  overflow: 'hidden',
                }}
              >
                <canvas
                  ref={canvasRef}
                  width={440}
                  height={440}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    cursor: 'crosshair',
                  }}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                />

                {/* Empty canvas drawing helper text */}
                {strokes.length === 0 && !isVerifying && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.85rem',
                      opacity: 0.6,
                    }}
                  >
                    Draw the symbol here ✍️
                  </div>
                )}
              </div>

              {/* Canvas Action Controls */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  width: '100%',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    className="btn-secondary"
                    onClick={handleUndo}
                    disabled={strokes.length === 0 || isVerifying}
                    title="Undo last stroke"
                    aria-label="Undo last stroke"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
                  >
                    <RotateCcw size={14} />
                  </button>

                  <button
                    className="btn-secondary"
                    onClick={handleClear}
                    disabled={strokes.length === 0 || isVerifying}
                    title="Clear canvas"
                    aria-label="Clear canvas"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.8rem' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    className={verificationResult ? 'btn-secondary' : 'btn-start-practice-prominent'}
                    onClick={handleVerify}
                    disabled={strokes.length === 0 || isVerifying || verificationResult?.isCorrect}
                    style={{ padding: '0.45rem 1.1rem', fontSize: '0.84rem' }}
                  >
                    {isVerifying ? (
                      <span>Checking...</span>
                    ) : (
                      <>
                        <Check size={15} />
                        <span>{verificationResult && !verificationResult.isCorrect ? 'Check Again' : 'Check Drawing'}</span>
                      </>
                    )}
                  </button>

                  <button
                    className={verificationResult ? 'btn-start-practice-prominent' : 'btn-secondary'}
                    onClick={handleNext}
                    disabled={!verificationResult}
                    title={verificationResult ? 'Next character (Enter)' : 'Check your drawing first'}
                    style={{ padding: '0.45rem 0.95rem', fontSize: '0.84rem' }}
                  >
                    <span>Next</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Feedback or Calligraphy Guidelines Panel */}
            <div style={{ flex: '1 1 280px', maxWidth: '460px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {verificationResult ? (
                /* Active Verification Feedback Panel */
                <div
                  className="glass-panel"
                  style={{
                    width: '100%',
                    padding: '1.25rem',
                    borderLeft: `4px solid ${
                      verificationResult.isCorrect ? 'var(--accent-matcha)' : 'var(--accent-persimmon)'
                    }`,
                    animation: 'fadeIn 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '4px',
                          background: verificationResult.isCorrect ? 'var(--accent-matcha)' : 'var(--accent-persimmon)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {verificationResult.isCorrect ? <Check size={17} strokeWidth={3} /> : <X size={17} strokeWidth={3} />}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: '1rem',
                              color: verificationResult.isCorrect ? 'var(--accent-matcha)' : 'var(--accent-persimmon)',
                            }}
                          >
                            {verificationResult.isCorrect ? 'Accurate Calligraphy!' : 'Needs Adjustment'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '3px',
                              background: verificationResult.isCorrect
                                ? 'rgba(92, 138, 102, 0.15)'
                                : 'rgba(217, 85, 75, 0.15)',
                              color: verificationResult.isCorrect ? 'var(--accent-matcha)' : 'var(--accent-persimmon)',
                            }}
                          >
                            {verificationResult.score}% match
                          </span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Strokes: {verificationResult.actualStrokeCount} drawn / {verificationResult.expectedStrokeCount} expected
                        </div>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                    {verificationResult.feedback}
                  </p>

                  {/* Stroke-by-stroke evaluation breakdown */}
                  {verificationResult.strokeEvaluations.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.75rem' }}>
                      {verificationResult.strokeEvaluations.map((evalItem) => (
                        <div
                          key={`eval-${evalItem.strokeIndex}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.35rem 0.6rem',
                            background: 'var(--bg-secondary)',
                            borderRadius: '3px',
                            fontSize: '0.78rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span
                              style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: evalItem.isReversed
                                ? 'var(--accent-persimmon)'
                                : evalItem.score >= 70
                                ? 'var(--accent-matcha)'
                                : 'var(--accent-gold)',
                                color: '#fff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                              }}
                            >
                              {evalItem.strokeIndex}
                            </span>
                            <span style={{ color: 'var(--text-primary)' }}>{evalItem.feedback}</span>
                          </div>
                          <span
                            style={{
                              fontWeight: 700,
                              color: evalItem.isReversed ? 'var(--accent-persimmon)' : 'var(--text-muted)',
                            }}
                          >
                            {evalItem.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Side-by-side comparison when incorrect */}
                  {!verificationResult.isCorrect && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        background: 'var(--bg-secondary)',
                        padding: '0.85rem',
                        borderRadius: '4px',
                        marginTop: '0.5rem',
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                          Closest match:
                        </div>
                        <div
                          style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent-persimmon)' }}
                          className={fontClass}
                        >
                          {verificationResult.recognizedAs || '?'}
                        </div>
                      </div>

                      <div style={{ height: '36px', width: '1px', background: 'var(--border-medium)' }} />

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                          Expected ({currentKana.romaji}):
                        </div>
                        <div
                          style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--accent-sakura)' }}
                          className={fontClass}
                        >
                          {currentKana.character}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Compact Calligraphy Guidelines (Before Verification) */
                <div
                  className="glass-panel"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem',
                    borderLeft: '4px solid var(--accent-sakura)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <PenTool size={14} color="var(--accent-sakura)" />
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      Calligraphy Guidelines
                    </span>
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '0.1rem 0.45rem',
                        borderRadius: '3px',
                        background: 'var(--bg-secondary)',
                        color: 'var(--accent-sakura)',
                      }}
                    >
                      {targetStrokeCount} {targetStrokeCount === 1 ? 'stroke' : 'strokes'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                    Top-to-bottom, left-to-right. Use <strong>Show Guide</strong> for stroke paths, then <strong>Check Drawing</strong>.
                  </div>
                </div>
              )}

              {showMnemonic && currentKana.mnemonic && (
                <div
                  style={{
                    background: 'var(--accent-gold-soft)',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    borderLeft: '3px solid var(--accent-gold)',
                    animation: 'fadeIn 0.2s ease',
                  }}
                >
                  💡 <strong>Memory Tip:</strong> {currentKana.mnemonic}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
