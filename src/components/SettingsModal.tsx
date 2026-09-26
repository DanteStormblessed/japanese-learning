import React from 'react';
import type { AppSettings } from '../utils/storage';
import type { JapaneseFontFamily, PracticeMode } from '../types/kana';
import { X, Settings, Check, HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { getKanaVolume, setKanaVolume } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [volume, setVolume] = React.useState<number>(() => getKanaVolume());

  if (!isOpen) return null;

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setKanaVolume(val);
  };

  const fontOptions: { id: JapaneseFontFamily; label: string; desc: string }[] = [
    { id: 'sans', label: 'Gothic (Noto Sans)', desc: 'Clean, modern digital sans-serif' },
    { id: 'serif', label: 'Mincho (Shippori)', desc: 'Elegant book serif with brush contrast' },
    { id: 'maru', label: 'Maru (Rounded)', desc: 'Friendly rounded handwritten style' },
    { id: 'brush', label: 'Yuji Boku (Brush)', desc: 'Traditional Japanese ink calligraphy' },
    { id: 'random', label: 'Random Fonts', desc: 'Switches fonts so you recognize kana in any style' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-panel-elevated" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close Settings">
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
          <Settings size={22} color="var(--accent-wisteria)" />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Settings</h2>
        </div>

        {/* Font Selection */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
            Japanese Typeface
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {fontOptions.map(font => (
              <div
                key={font.id}
                onClick={() => onUpdateSettings({ ...settings, font: font.id })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '4px',
                  background: settings.font === font.id ? 'var(--accent-wisteria-soft)' : 'var(--bg-secondary)',
                  border: `1px solid ${settings.font === font.id ? 'var(--accent-wisteria-border)' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{font.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{font.desc}</div>
                </div>
                {settings.font === font.id && <Check size={16} color="var(--accent-wisteria)" strokeWidth={3} />}
              </div>
            ))}
          </div>
        </div>

        {/* Practice Mode */}
        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.6rem', color: 'var(--text-primary)' }}>
            Default Practice Mode
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {(['type', 'multiple-choice', 'flashcard'] as PracticeMode[]).map((mode) => (
              <button
                key={mode}
                className="btn-secondary"
                style={{
                  padding: '0.65rem 0.4rem',
                  fontSize: '0.82rem',
                  borderRadius: '4px',
                  background: settings.practiceMode === mode ? 'var(--accent-wisteria)' : 'var(--bg-secondary)',
                  color: settings.practiceMode === mode ? '#fff' : 'var(--text-primary)',
                  fontWeight: settings.practiceMode === mode ? 700 : 600,
                  border: 'none',
                }}
                onClick={() => onUpdateSettings({ ...settings, practiceMode: mode })}
              >
                {mode === 'type' ? 'Typing' : mode === 'multiple-choice' ? 'Multiple Choice' : 'Flashcard'}
              </button>
            ))}
          </div>
        </div>

        {/* Pronunciation Volume */}
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Pronunciation Volume
            </label>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-wisteria)' }}>
              {Math.round(volume * 100)}%
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.7rem 0.9rem',
              borderRadius: '4px',
              background: 'var(--bg-secondary)',
            }}
          >
            {volume === 0 ? (
              <VolumeX size={18} color="var(--text-muted)" />
            ) : (
              <Volume2 size={18} color="var(--accent-wisteria)" />
            )}
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              style={{
                flex: 1,
                cursor: 'pointer',
                accentColor: 'var(--accent-wisteria)',
              }}
              aria-label="Adjust voice volume"
            />
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem', fontWeight: 700, fontSize: '0.84rem' }}>
            <HelpCircle size={14} color="var(--accent-wisteria)" />
            <span>Keyboard Shortcuts</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div><span className="keyboard-badge">Type Romaji</span> Auto-submits when correct</div>
            <div><span className="keyboard-badge">Space</span> or <span className="keyboard-badge">Esc</span> Reveal answer / Skip</div>
            <div><span className="keyboard-badge">Enter</span> Next character after review</div>
          </div>
        </div>
      </div>
    </div>
  );
};
