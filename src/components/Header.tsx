import React from 'react';
import { Flame, BarChart2, Settings, PenTool, Play, HelpCircle, BookOpen } from 'lucide-react';

export type AppTab = 'selector' | 'draw' | 'practice' | 'vocab';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  selectedCount: number;
  currentStreak: number;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedCount,
  currentStreak,
  theme,
  setTheme,
  onOpenStats,
  onOpenSettings,
  onOpenHelp,
}) => {
  return (
    <header className="site-header">
      <div className="brand-section" onClick={() => setActiveTab('selector')}>
        <div className="brand-badge">かな</div>
        <div>
          <h1 className="brand-title">KanaFocus</h1>
          <div className="brand-subtitle">Hiragana & Katakana Practice</div>
        </div>
      </div>

      <nav className="header-nav" aria-label="Main Navigation">
        <button
          className={`nav-tab-btn ${activeTab === 'selector' || activeTab === 'practice' ? 'active' : ''}`}
          onClick={() => setActiveTab('selector')}
          title="Practice — Kana recognition and reading drills"
        >
          <Play size={15} fill="currentColor" />
          <span>Practice{selectedCount > 0 ? ` (${selectedCount})` : ''}</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'draw' ? 'active' : ''}`}
          onClick={() => setActiveTab('draw')}
          title="Draw Test — Kana handwriting and drawing practice"
        >
          <PenTool size={15} />
          <span>Draw Test</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === 'vocab' ? 'active' : ''}`}
          onClick={() => setActiveTab('vocab')}
          title="Vocabulary — Learn and practice words written in kana"
        >
          <BookOpen size={15} />
          <span>Vocabulary</span>
        </button>
      </nav>

      <div className="header-actions">
        {currentStreak > 0 && (
          <div className="streak-pill" title={`Current streak: ${currentStreak} correct in a row`}>
            <Flame size={14} />
            <span>{currentStreak}</span>
          </div>
        )}

        <button
          className="icon-button"
          onClick={onOpenHelp}
          title="How to practice"
          aria-label="How to practice"
        >
          <HelpCircle size={16} />
        </button>

        <button
          className="icon-button"
          onClick={onOpenStats}
          title="View Practice Statistics"
          aria-label="View Stats"
        >
          <BarChart2 size={16} />
        </button>

        <button
          className="icon-button"
          onClick={onOpenSettings}
          title="Open Settings"
          aria-label="Settings"
        >
          <Settings size={16} />
        </button>

        <button
          className="icon-button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
};
