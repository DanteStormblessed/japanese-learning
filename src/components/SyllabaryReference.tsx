import React, { useState, useMemo } from 'react';
import {
  ALL_CHARACTERS,
  getGridRows,
  getCombinationRows,
  HIRAGANA_CHARACTERS,
  KATAKANA_CHARACTERS,
} from '../data/kanaData';
import type { ScriptType, KanaCategory } from '../types/kana';
import { Search, Check, Play, Sparkles, X as XIcon, Filter } from 'lucide-react';

interface SyllabaryReferenceProps {
  selectedIds: string[];
  onToggleId: (id: string) => void;
  onSelectMultiple: (ids: string[], append?: boolean) => void;
  onClearAll: () => void;
  onStartPractice: () => void;
  fontClass: string;
}

export const SyllabaryReference: React.FC<SyllabaryReferenceProps> = ({
  selectedIds,
  onToggleId,
  onSelectMultiple,
  onClearAll,
  onStartPractice,
  fontClass,
}) => {
  const [activeScript, setActiveScript] = useState<ScriptType>('hiragana');
  const [searchQuery, setSearchQuery] = useState('');

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const scriptChars = useMemo(() => {
    return activeScript === 'hiragana' ? HIRAGANA_CHARACTERS : KATAKANA_CHARACTERS;
  }, [activeScript]);

  // Get organized rows for each category
  const basicRows = useMemo(() => getGridRows(activeScript, 'basic'), [activeScript]);
  const dakutenRows = useMemo(() => getGridRows(activeScript, 'dakuten'), [activeScript]);
  const handakutenRows = useMemo(() => getGridRows(activeScript, 'handakuten'), [activeScript]);
  const combinationRows = useMemo(() => getCombinationRows(activeScript), [activeScript]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { basic: 0, dakuten: 0, handakuten: 0, combination: 0 };
    for (const id of selectedIds) {
      const char = ALL_CHARACTERS.find(c => c.id === id);
      if (char && char.script === activeScript) {
        counts[char.category] = (counts[char.category] || 0) + 1;
      }
    }
    return counts;
  }, [selectedIds, activeScript]);

  // Search filter
  const isSearching = searchQuery.trim() !== '';

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    const q = searchQuery.trim().toLowerCase();
    return ALL_CHARACTERS.filter((kana) => {
      const matchRomaji = kana.romaji.toLowerCase().includes(q);
      const matchChar = kana.character.includes(q);
      const matchAlternatives = kana.alternatives.some(a => a.toLowerCase().includes(q));
      return matchRomaji || matchChar || matchAlternatives;
    });
  }, [searchQuery, isSearching]);

  // Select all of a category
  const handleSelectCategory = (category: KanaCategory) => {
    const categoryIds = scriptChars.filter(c => c.category === category).map(c => c.id);
    const combined = Array.from(new Set([...selectedIds, ...categoryIds]));
    onSelectMultiple(combined, false);
  };

  // Deselect all of a category
  const handleDeselectCategory = (category: KanaCategory) => {
    const categoryIdSet = new Set(scriptChars.filter(c => c.category === category).map(c => c.id));
    const remaining = selectedIds.filter(id => !categoryIdSet.has(id));
    onSelectMultiple(remaining, false);
  };

  // Column headers for basic/dakuten/handakuten grids
  const columnHeaders = ['a', 'i', 'u', 'e', 'o'];
  const combinationColumnHeaders = ['ya', 'yu', 'yo'];

  // Toggle an entire row
  const handleToggleRow = (rowCharIds: string[]) => {
    const validIds = rowCharIds.filter(Boolean);
    const allSelected = validIds.every(id => selectedSet.has(id));
    if (allSelected) {
      const remaining = selectedIds.filter(id => !validIds.includes(id));
      onSelectMultiple(remaining, false);
    } else {
      const toAdd = validIds.filter(id => !selectedSet.has(id));
      onSelectMultiple([...selectedIds, ...toAdd], false);
    }
  };

  // Render a kana table grid section
  const renderGrid = (
    title: string,
    category: KanaCategory,
    rows: ReturnType<typeof getGridRows>,
    colHeaders: string[]
  ) => {
    const totalInCategory = scriptChars.filter(c => c.category === category).length;
    const selectedInCategory = categoryCounts[category];
    const allSelected = totalInCategory > 0 && selectedInCategory === totalInCategory;

    return (
      <div className="syllabary-section">
        <div className="syllabary-section-title">
          <span>{title}</span>
          <span className="syllabary-section-badge">
            {selectedInCategory}/{totalInCategory}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.35rem' }}>
            <button
              className="btn-secondary"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
              onClick={() => allSelected ? handleDeselectCategory(category) : handleSelectCategory(category)}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>

        <div className="syllabary-grid">
          {/* Column headers */}
          <div className="syllabary-row">
            <div className="syllabary-row-label" />
            {colHeaders.map(h => (
              <div key={h} className="syllabary-col-header">{h}</div>
            ))}
          </div>

          {/* Rows */}
          {rows.map((row) => {
            const validChars = row.characters.filter((c): c is NonNullable<typeof c> => c !== null);
            const rowCharIds = validChars.map(c => c.id);
            const isAllRowSelected = rowCharIds.length > 0 && rowCharIds.every(id => selectedSet.has(id));

            return (
              <div key={row.groupId} className="syllabary-row">
                <button
                  className="syllabary-row-label"
                  onClick={() => handleToggleRow(rowCharIds)}
                  title={`Toggle ${row.label}`}
                  style={{
                    cursor: 'pointer',
                    color: isAllRowSelected ? 'var(--accent-wisteria)' : 'var(--text-muted)',
                    fontWeight: isAllRowSelected ? 800 : 700,
                  }}
                >
                  {row.label.split(' ')[0].replace('-row', '').replace('-', '')}
                </button>

                {row.characters.map((kana, idx) => {
                  if (!kana) {
                    return <div key={`empty-${row.groupId}-${idx}`} className="syllabary-cell empty" />;
                  }

                  const isSelected = selectedSet.has(kana.id);

                  return (
                    <div
                      key={kana.id}
                      className={`syllabary-cell ${isSelected ? 'selected' : ''}`}
                      onClick={() => onToggleId(kana.id)}
                      title={`${kana.character} (${kana.romaji})${kana.mnemonic ? ` — ${kana.mnemonic}` : ''}`}
                    >
                      <div className="syllabary-cell-check" />
                      <span className={`syllabary-cell-char ${fontClass}`}>{kana.character}</span>
                      <span className="syllabary-cell-romaji">{kana.romaji}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="syllabary-reference-page">
      {/* Page Header */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.3rem', color: 'var(--text-highlight)' }}>
          {activeScript === 'hiragana' ? 'ひらがな' : 'カタカナ'}{' '}
          <span style={{ fontFamily: 'var(--font-ui)' }}>
            {activeScript === 'hiragana' ? 'Hiragana' : 'Katakana'} Chart
          </span>
        </h2>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Tap any character to add it to your practice queue. Tap row labels to select entire rows.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="glass-panel" style={{ padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Script toggle + Search */}
          <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
            <div className="script-segmented-control">
              <button
                className={`script-tab-btn ${activeScript === 'hiragana' ? 'active' : ''}`}
                onClick={() => setActiveScript('hiragana')}
              >
                ひらがな
              </button>
              <button
                className={`script-tab-btn ${activeScript === 'katakana' ? 'active' : ''}`}
                onClick={() => setActiveScript('katakana')}
              >
                カタカナ
              </button>
            </div>

            <div className="search-input-box" style={{ flex: 1, minWidth: '160px', maxWidth: '280px' }}>
              <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search kana..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ color: 'var(--text-muted)', padding: '2px', flexShrink: 0 }}
                >
                  <XIcon size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <strong style={{ color: 'var(--text-primary)' }}>{selectedIds.length}</strong> selected
            </span>

            <button
              className="btn-clear-prominent"
              onClick={onClearAll}
              disabled={selectedIds.length === 0}
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
            >
              Clear
            </button>

            <button
              className="btn-start-practice-prominent"
              onClick={onStartPractice}
              disabled={selectedIds.length === 0}
              style={{ padding: '0.5rem 1.15rem', fontSize: '0.84rem' }}
            >
              <Play size={14} fill="currentColor" />
              <span>Practice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Results View */}
      {isSearching ? (
        <div>
          <div style={{ marginBottom: '0.75rem', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            <Filter size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.35rem' }} />
            Found <strong style={{ color: 'var(--text-primary)' }}>{searchResults.length}</strong> matches for "{searchQuery}"
          </div>

          {searchResults.length === 0 ? (
            <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🔍</p>
              <p>No kana found matching your search.</p>
            </div>
          ) : (
            <div className="vocab-cards-grid">
              {searchResults.map((kana) => {
                const isSelected = selectedSet.has(kana.id);
                return (
                  <div
                    key={kana.id}
                    className={`vocab-detail-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => onToggleId(kana.id)}
                    title={`${kana.character} (${kana.romaji})`}
                  >
                    <div className="vocab-card-checkbox">
                      {isSelected && <Check size={10} strokeWidth={3} />}
                    </div>
                    <div className={`vocab-card-char ${fontClass}`}>{kana.character}</div>
                    <div className="vocab-card-romaji">{kana.romaji}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
                      <span style={{ color: kana.script === 'hiragana' ? 'var(--accent-sakura)' : 'var(--accent-wisteria)' }}>
                        {kana.script === 'hiragana' ? 'Hira' : 'Kata'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Normal grid view organized by category */
        <div>
          {renderGrid(
            'Basic (Gojūon)',
            'basic',
            basicRows,
            columnHeaders
          )}
          {renderGrid(
            'Voiced (Dakuten)',
            'dakuten',
            dakutenRows,
            columnHeaders
          )}
          {renderGrid(
            'Semi-Voiced (Handakuten)',
            'handakuten',
            handakutenRows,
            columnHeaders
          )}
          {renderGrid(
            'Combinations (Yōon)',
            'combination',
            combinationRows,
            combinationColumnHeaders
          )}
        </div>
      )}

      {/* Floating Bottom Practice Bar */}
      {selectedIds.length > 0 && (
        <div
          style={{
            position: 'sticky',
            bottom: '1rem',
            marginTop: '1.5rem',
            padding: '0.85rem 1.25rem',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 100,
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} color="var(--accent-wisteria)" />
            <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
              <strong>{selectedIds.length}</strong> characters ready to practice
            </span>
          </div>

          <button className="btn-start-practice-prominent" onClick={onStartPractice}>
            <Play size={15} fill="currentColor" />
            <span>Start Practice</span>
          </button>
        </div>
      )}
    </div>
  );
};
