import React from 'react';
import type { PracticeStats } from '../types/kana';
import { CHARACTER_MAP } from '../data/kanaData';
import { X, Award, Flame, Target, BarChart2, RotateCcw, PlusCircle } from 'lucide-react';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PracticeStats;
  onResetStats: () => void;
  onAddWeakKanaToPractice: (ids: string[]) => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onResetStats,
  onAddWeakKanaToPractice,
}) => {
  if (!isOpen) return null;

  const totalAttempts = stats.totalAttempts;
  const correctAttempts = stats.correctAttempts;
  const overallAccuracy = totalAttempts > 0
    ? Math.round((correctAttempts / totalAttempts) * 100)
    : 0;

  // Find kana with lowest accuracy or mistakes
  const weakKanaList = Object.entries(stats.characterStats)
    .map(([id, item]) => {
      const kana = CHARACTER_MAP.get(id);
      const acc = item.attempts > 0 ? Math.round((item.correct / item.attempts) * 100) : 100;
      return {
        id,
        kana,
        attempts: item.attempts,
        correct: item.correct,
        accuracy: acc,
        missed: item.attempts - item.correct,
      };
    })
    .filter(item => item.kana && item.missed > 0)
    .sort((a, b) => b.missed - a.missed || a.accuracy - b.accuracy)
    .slice(0, 10);

  const handleQueueWeak = () => {
    const ids = weakKanaList.map(w => w.id);
    onAddWeakKanaToPractice(ids);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-panel-elevated" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close Modal">
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
          <BarChart2 size={24} color="var(--accent-wisteria)" />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Your Progress</h2>
        </div>

        {/* 4 Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.75rem' }}>
          <div className="stat-metric-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
              <Target size={14} />
              <span className="stat-metric-label">Accuracy</span>
            </div>
            <div className="stat-metric-number" style={{ color: overallAccuracy >= 80 ? 'var(--accent-matcha)' : 'var(--text-primary)' }}>
              {overallAccuracy}%
            </div>
          </div>

          <div className="stat-metric-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-gold)' }}>
              <Flame size={14} />
              <span className="stat-metric-label">Best Streak</span>
            </div>
            <div className="stat-metric-number" style={{ color: 'var(--accent-gold)' }}>
              {stats.bestStreak}
            </div>
          </div>

          <div className="stat-metric-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
              <Award size={14} />
              <span className="stat-metric-label">Total Answers</span>
            </div>
            <div className="stat-metric-number">
              {totalAttempts}
            </div>
          </div>

          <div className="stat-metric-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
              <Flame size={14} />
              <span className="stat-metric-label">Current Streak</span>
            </div>
            <div className="stat-metric-number">
              {stats.currentStreak}
            </div>
          </div>
        </div>

        {/* Characters Needing Review */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Needs More Practice</h3>
            {weakKanaList.length > 0 && (
              <button
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: 'var(--accent-wisteria)' }}
                onClick={handleQueueWeak}
              >
                <PlusCircle size={13} />
                <span>Drill These {weakKanaList.length}</span>
              </button>
            )}
          </div>

          {weakKanaList.length === 0 ? (
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '4px', textAlign: 'center' }}>
              {totalAttempts === 0
                ? '🌱 No practice history yet. Start a drill to track your progress!'
                : '🎉 Amazing! No weak characters right now. Keep it up!'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '200px', overflowY: 'auto' }}>
              {weakKanaList.map(({ id, kana, missed, accuracy }) => (
                <div
                  key={id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.9rem',
                    borderRadius: '4px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 700 }}>{kana?.character}</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{kana?.romaji}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{kana?.script}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-persimmon)' }}>
                      {missed} miss{missed > 1 ? 'es' : ''}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {accuracy}% accuracy
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reset button */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn-outline-danger"
            style={{ fontSize: '0.82rem' }}
            onClick={() => {
              if (confirm('Are you sure you want to reset all practice statistics?')) {
                onResetStats();
              }
            }}
          >
            <RotateCcw size={14} />
            <span>Reset Stats</span>
          </button>
        </div>
      </div>
    </div>
  );
};
