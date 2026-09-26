import React from 'react';
import { X, Lightbulb, Keyboard, CheckCircle, Sparkles } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-panel-elevated" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close Help">
          <X size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Lightbulb size={20} color="var(--accent-sakura)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>How to Use KanaFocus</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.45rem', borderRadius: 'var(--radius-xs)', background: 'var(--accent-wisteria-soft)', color: 'var(--accent-wisteria)', flexShrink: 0 }}>
              <CheckCircle size={16} />
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.15rem' }}>1. Select Your Characters</strong>
              Pick rows or individual kana in the <strong>Select</strong> tab, or test your handwriting in the <strong>Draw Test</strong> tab. Use presets to quickly choose vowels, the first 15, or full sets.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.45rem', borderRadius: 'var(--radius-xs)', background: 'var(--accent-sakura-soft)', color: 'var(--accent-sakura)', flexShrink: 0 }}>
              <Keyboard size={16} />
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.15rem' }}>2. Type the Romaji</strong>
              During practice, type the romaji reading. The app automatically advances when you get it right — no need to press Enter!
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.45rem', borderRadius: 'var(--radius-xs)', background: 'var(--accent-matcha-soft)', color: 'var(--accent-matcha)', flexShrink: 0 }}>
              <Sparkles size={16} />
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.15rem' }}>3. Learn from Mistakes</strong>
              If you don't know a character, press <span className="keyboard-badge">Space</span> to reveal the answer with a helpful mnemonic hint. Keep practicing until they stick!
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <div style={{ padding: '0.45rem', borderRadius: 'var(--radius-xs)', background: 'var(--accent-gold-soft)', color: 'var(--accent-gold)', flexShrink: 0 }}>
              <Lightbulb size={16} />
            </div>
            <div>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '0.15rem' }}>4. Try Different Fonts</strong>
              Challenge yourself with Gothic, Mincho, Handwritten, or Calligraphy fonts in Settings so you can recognize kana in any style.
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1.75rem', textAlign: 'right' }}>
          <button className="btn-start-practice-prominent" onClick={onClose}>
            Got it, let's go! 🌸
          </button>
        </div>
      </div>
    </div>
  );
};
