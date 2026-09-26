import React, { useState, useMemo } from 'react';
import type { ScriptType, KanaCategory } from '../types/kana';
import {
  HIRAGANA_CHARACTERS,
  KATAKANA_CHARACTERS,
  ALL_CHARACTERS,
  getGridRows,
  getCombinationRows,
} from '../data/kanaData';
import { Play, Trash2 } from 'lucide-react';

interface KanaSelectorProps {
  selectedIds: string[];
  onToggleId: (id: string) => void;
  onSelectMultiple: (ids: string[], append?: boolean) => void;
  onClearAll: () => void;
  onStartPractice: () => void;
  fontClass: string;
}

export const KanaSelector: React.FC<KanaSelectorProps> = ({
  selectedIds,
  onToggleId,
  onSelectMultiple,
  onClearAll,
  onStartPractice,
  fontClass,
}) => {
  const [activeScript, setActiveScript] = useState<ScriptType>('hiragana');
  const [activeCategory, setActiveCategory] = useState<KanaCategory>('basic');

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Lookup map
  const charLookup = useMemo(() => {
    return new Map(ALL_CHARACTERS.map(c => [c.id, c]));
  }, []);

  // Compute selected count per category
  const categoryCounts = useMemo(() => {
    const counts = {
      basic: 0,
      dakuten: 0,
      handakuten: 0,
      combination: 0,
    };
    for (const id of selectedIds) {
      const char = charLookup.get(id);
      if (char && char.script === activeScript) {
        counts[char.category] = (counts[char.category] || 0) + 1;
      }
    }
    return counts;
  }, [selectedIds, activeScript, charLookup]);

  // Rows for current selection
  const rows = useMemo(() => {
    return activeCategory === 'combination'
      ? getCombinationRows(activeScript)
      : getGridRows(activeScript, activeCategory);
  }, [activeScript, activeCategory]);

  // Toggle entire row
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

  // Presets handling
  const applyPreset = (presetType: string) => {
    const scriptChars = activeScript === 'hiragana' ? HIRAGANA_CHARACTERS : KATAKANA_CHARACTERS;
    let targetIds: string[] = [];

    switch (presetType) {
      case 'vowels':
        targetIds = scriptChars.filter(c => c.rowGroup === 'vowel').map(c => c.id);
        break;
      case 'first15':
        targetIds = scriptChars.filter(c => ['vowel', 'k', 's'].includes(c.rowGroup)).map(c => c.id);
        break;
      case 'basicAll':
        targetIds = scriptChars.filter(c => c.category === 'basic').map(c => c.id);
        break;
      case 'dakutenAll':
        targetIds = scriptChars.filter(c => c.category === 'dakuten' || c.category === 'handakuten').map(c => c.id);
        break;
      case 'comboAll':
        targetIds = scriptChars.filter(c => c.category === 'combination').map(c => c.id);
        break;
      case 'allScript':
        targetIds = scriptChars.map(c => c.id);
        break;
    }

    onSelectMultiple([...new Set([...selectedIds, ...targetIds])], false);
  };

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
            <strong style={{ color: 'var(--text-primary)', fontSize: '0.94rem' }}>{selectedIds.length}</strong> selected
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            className="btn-clear-prominent"
            onClick={onClearAll}
            disabled={selectedIds.length === 0}
            title="Deselect all characters"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>

          <button
            className="btn-start-practice-prominent"
            onClick={onStartPractice}
            disabled={selectedIds.length === 0}
          >
            <Play size={16} fill="currentColor" />
            <span>Start Practice ({selectedIds.length})</span>
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
            const rowCharIds = validChars.map(c => c.id);
            const isAllSelected = rowCharIds.length > 0 && rowCharIds.every(id => selectedSet.has(id));
            const hasSomeSelected = rowCharIds.some(id => selectedSet.has(id));

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

                    const isSelected = selectedSet.has(kana.id);

                    return (
                      <div
                        key={kana.id}
                        className={`kana-tile-compact ${isSelected ? 'selected' : ''}`}
                        onClick={() => onToggleId(kana.id)}
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
          💡 {selectedIds.length === 0 ? 'Select characters above to start practicing.' : `${selectedIds.length} characters in your practice queue.`}
        </span>
        {selectedIds.length > 0 && (
          <button
            onClick={onStartPractice}
            style={{ color: 'var(--accent-sakura)', fontWeight: 700, fontSize: '0.82rem' }}
          >
            Start drill →
          </button>
        )}
      </div>
    </div>
  );
};
