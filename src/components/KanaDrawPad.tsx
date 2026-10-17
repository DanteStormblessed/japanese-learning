import React, { useCallback, useEffect, useRef } from 'react';
import { type Stroke, renderKanjiVgGuide } from '../utils/strokeMatcher';

interface KanaDrawPadProps {
  strokes: Stroke[];
  onStrokesChange: React.Dispatch<React.SetStateAction<Stroke[]>>;
  guideChar?: string | null; // Render the KanjiVG stroke guide for this kana when set
  disabled?: boolean;
  resolution?: number; // Internal canvas size in px (display size is responsive)
  maxWidth?: number;
  placeholder?: string;
}

const getInkColor = () =>
  document.documentElement.getAttribute('data-theme') !== 'light' ? '#efe6dc' : '#2b2320';

/**
 * Square handwriting canvas with Genkōyōshi guidelines and an optional stroke guide.
 * Strokes are controlled by the parent so it can verify, undo or clear them.
 */
export const KanaDrawPad: React.FC<KanaDrawPadProps> = ({
  strokes,
  onStrokesChange,
  guideChar,
  disabled = false,
  resolution = 400,
  maxWidth = 400,
  placeholder = 'Draw here ✍️',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<Stroke>([]);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const { width, height } = canvas;

    ctx.clearRect(0, 0, width, height);

    // Practice paper guidelines
    ctx.save();
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(140, 110, 100, 0.22)';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(140, 110, 100, 0.1)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();
    ctx.restore();

    if (guideChar) {
      renderKanjiVgGuide(canvas, guideChar, {
        strokeColor: 'rgba(235, 110, 130, 0.42)',
        lineWidth: 6,
        showNumbers: true,
      });
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = getInkColor();
    ctx.fillStyle = ctx.strokeStyle;
    for (const stroke of strokes) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      if (stroke.length === 1) {
        ctx.arc(stroke[0].x, stroke[0].y, 4, 0, Math.PI * 2);
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
  }, [strokes, guideChar]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const point = { ...getCanvasCoords(e), time: Date.now() };
    currentStrokeRef.current = [point];
    onStrokesChange((prev) => [...prev, [point]]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const point = { ...getCanvasCoords(e), time: Date.now() };
    const stroke = currentStrokeRef.current;
    stroke.push(point);

    // Draw the new segment directly to avoid re-render lag
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx && stroke.length >= 2) {
      const p1 = stroke[stroke.length - 2];
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 8;
      ctx.strokeStyle = getInkColor();
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      ctx.restore();
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
    if (currentStrokeRef.current.length > 0) {
      const finalStroke = [...currentStrokeRef.current];
      onStrokesChange((prev) => {
        if (prev.length === 0) return [finalStroke];
        const updated = [...prev];
        updated[updated.length - 1] = finalStroke;
        return updated;
      });
    }
    currentStrokeRef.current = [];
  };

  return (
    <div
      style={{
        position: 'relative',
        width: `min(${maxWidth}px, 100%)`,
        aspectRatio: '1 / 1',
        background: 'var(--bg-card)',
        borderRadius: '4px',
        border: '1px solid var(--border-medium)',
        touchAction: 'none',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        width={resolution}
        height={resolution}
        style={{ width: '100%', height: '100%', display: 'block', cursor: disabled ? 'default' : 'crosshair' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      {strokes.length === 0 && !guideChar && (
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
          {placeholder}
        </div>
      )}
    </div>
  );
};
