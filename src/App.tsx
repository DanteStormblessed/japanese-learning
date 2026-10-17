import React, { useState, useEffect } from 'react';
import { Header, type AppTab } from './components/Header';
import { KanaSelector } from './components/KanaSelector';
import { DrawTestView } from './components/DrawTestView';
import { PracticeView } from './components/PracticeView';
import { VocabularyView } from './components/VocabularyView';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { HelpModal } from './components/HelpModal';
import {
  loadSelectedIds,
  saveSelectedIds,
  loadStats,
  saveStats,
  loadSettings,
  saveSettings,
  loadTheme,
  saveTheme,
} from './utils/storage';
import type { AppSettings } from './utils/storage';
import type { JapaneseFontFamily, PracticeStats } from './types/kana';

export const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<AppTab>('selector');

  // Core application state
  const [selectedIds, setSelectedIds] = useState<string[]>(loadSelectedIds);
  const [stats, setStats] = useState<PracticeStats>(loadStats);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [theme, setTheme] = useState<'dark' | 'light'>(loadTheme);

  // Modals
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Sync theme with DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  // Save settings
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Save selected IDs to localStorage
  useEffect(() => {
    saveSelectedIds(selectedIds);
  }, [selectedIds]);

  // Save stats to localStorage
  const handleUpdateStats = (newStats: PracticeStats) => {
    setStats(newStats);
    saveStats(newStats);
  };

  const handleResetStats = () => {
    const emptyStats: PracticeStats = {
      totalAttempts: 0,
      correctAttempts: 0,
      currentStreak: 0,
      bestStreak: 0,
      characterStats: {},
    };
    setStats(emptyStats);
    saveStats(emptyStats);
  };

  // Selection handlers
  const handleToggleId = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectMultiple = (ids: string[], append: boolean = false) => {
    if (append) {
      setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
    } else {
      setSelectedIds(ids);
    }
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  const handleStartPractice = () => {
    if (selectedIds.length === 0) return;
    setActiveTab('practice');
  };

  const handleAddWeakKanaToPractice = (ids: string[]) => {
    setSelectedIds(prev => Array.from(new Set([...prev, ...ids])));
    setActiveTab('practice');
  };

  // Font class mapping
  const getFontClass = (font: JapaneseFontFamily) => {
    switch (font) {
      case 'serif':
        return 'font-serif-jp';
      case 'maru':
        return 'font-maru-jp';
      case 'brush':
        return 'font-brush-jp';
      case 'sans':
      default:
        return 'font-sans-jp';
    }
  };

  const activeFontClass = getFontClass(settings.font);

  return (
    <div className="app-container">
      {/* Navigation & Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCount={selectedIds.length}
        currentStreak={stats.currentStreak}
        theme={theme}
        setTheme={setTheme}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Screen Content */}
      <main style={{ flex: 1 }}>
        {activeTab === 'selector' && (
          <KanaSelector
            selectedIds={selectedIds}
            onToggleId={handleToggleId}
            onSelectMultiple={handleSelectMultiple}
            onClearAll={handleClearAll}
            onStartPractice={handleStartPractice}
            fontClass={activeFontClass}
          />
        )}

        {activeTab === 'draw' && (
          <DrawTestView
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
            fontClass={activeFontClass}
            onGoToSelector={() => setActiveTab('selector')}
          />
        )}

        {activeTab === 'vocab' && <VocabularyView fontClass={activeFontClass} />}

        {activeTab === 'practice' && (
          <PracticeView
            selectedIds={selectedIds}
            stats={stats}
            onUpdateStats={handleUpdateStats}
            onFinishPractice={() => setActiveTab('selector')}
            currentFont={settings.font}
            onFontChange={(f) => setSettings(s => ({ ...s, font: f }))}
            practiceMode={settings.practiceMode}
            onModeChange={(m) => setSettings(s => ({ ...s, practiceMode: m }))}
          />
        )}
      </main>

      {/* Modals */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        onResetStats={handleResetStats}
        onAddWeakKanaToPractice={handleAddWeakKanaToPractice}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* Footer */}
      <footer style={{ marginTop: '2.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <p><strong>KanaFocus</strong> — Master Japanese Hiragana & Katakana with ease 🌸</p>
      </footer>
    </div>
  );
};

export default App;
