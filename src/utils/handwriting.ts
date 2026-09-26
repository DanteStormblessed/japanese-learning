/**
 * Japanese Symbol Handwriting Recognition Engine
 *
 * Evaluates the entire completed symbol (not stroke-by-stroke).
 * Uses Google Input Tools handwriting service with stroke normalization,
 * candidate filtering, and canvas visual comparison.
 */

export interface Point {
  x: number;
  y: number;
  time: number;
}

export type Stroke = Point[];

export interface VerificationResult {
  isCorrect: boolean;
  recognizedAs: string;
  candidates: string[];
  expectedChar: string;
  feedback: string;
  rank?: number;
}

/**
 * Normalizes strokes so drawings are centered and scaled for Google's model.
 */
function normalizeStrokes(strokes: Stroke[], targetSize: number = 300) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const stroke of strokes) {
    for (const p of stroke) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }

  const w = Math.max(maxX - minX, 1);
  const h = Math.max(maxY - minY, 1);
  const scale = (targetSize * 0.75) / Math.max(w, h);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const targetCenter = targetSize / 2;

  return strokes.map((stroke) => {
    const xs: number[] = [];
    const ys: number[] = [];
    const ts: number[] = [];
    stroke.forEach((p) => {
      xs.push(Math.round(targetCenter + (p.x - cx) * scale));
      ys.push(Math.round(targetCenter + (p.y - cy) * scale));
      ts.push(Math.round(p.time));
    });
    return [xs, ys, ts];
  });
}

/**
 * Call Google Input Tools handwriting recognition service.
 */
async function recognizeStrokesOnline(strokes: Stroke[]): Promise<string[]> {
  if (strokes.length === 0) return [];

  const normalized = normalizeStrokes(strokes, 300);

  const payload = {
    options: 'enable_pre_space',
    requests: [
      {
        writing_guide: {
          writing_area_width: 300,
          writing_area_height: 300,
        },
        ink: normalized,
        language: 'ja',
      },
    ],
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(
      'https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!response.ok) return [];

    const data = await response.json();
    if (data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1]) {
      return data[1][0][1].filter(Boolean);
    }
    return [];
  } catch {
    clearTimeout(timeoutId);
    return [];
  }
}

/**
 * Visual template pixel comparison fallback
 */
function visualTemplateMatch(strokes: Stroke[], expectedChar: string): boolean {
  if (typeof document === 'undefined' || strokes.length === 0) return false;

  try {
    const size = 64;
    // User drawing canvas
    const c1 = document.createElement('canvas');
    c1.width = size;
    c1.height = size;
    const ctx1 = c1.getContext('2d');
    if (!ctx1) return false;

    // Expected char canvas
    const c2 = document.createElement('canvas');
    c2.width = size;
    c2.height = size;
    const ctx2 = c2.getContext('2d');
    if (!ctx2) return false;

    // Draw expected char centered
    ctx2.fillStyle = '#000';
    ctx2.font = `${Math.round(size * 0.75)}px sans-serif`;
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillText(expectedChar, size / 2, size / 2 + 2);

    // Draw user strokes scaled to 64x64
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const stroke of strokes) {
      for (const p of stroke) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }
    }
    const w = Math.max(maxX - minX, 1);
    const h = Math.max(maxY - minY, 1);
    const scale = (size * 0.75) / Math.max(w, h);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    ctx1.strokeStyle = '#000';
    ctx1.lineWidth = 4;
    ctx1.lineCap = 'round';
    ctx1.lineJoin = 'round';

    for (const stroke of strokes) {
      if (stroke.length === 0) continue;
      ctx1.beginPath();
      const startX = size / 2 + (stroke[0].x - cx) * scale;
      const startY = size / 2 + (stroke[0].y - cy) * scale;
      ctx1.moveTo(startX, startY);
      for (let i = 1; i < stroke.length; i++) {
        const x = size / 2 + (stroke[i].x - cx) * scale;
        const y = size / 2 + (stroke[i].y - cy) * scale;
        ctx1.lineTo(x, y);
      }
      ctx1.stroke();
    }

    // Compare pixels
    const imgData1 = ctx1.getImageData(0, 0, size, size).data;
    const imgData2 = ctx2.getImageData(0, 0, size, size).data;

    let overlap = 0;
    let totalDrawn = 0;
    for (let i = 3; i < imgData1.length; i += 4) {
      const a1 = imgData1[i] > 30;
      const a2 = imgData2[i] > 30;
      if (a1) totalDrawn++;
      if (a1 && a2) overlap++;
    }

    const similarity = totalDrawn > 0 ? overlap / totalDrawn : 0;
    return similarity > 0.45;
  } catch {
    return false;
  }
}

/**
 * Rigorously verifies the user's completed handwritten symbol.
 * Does NOT restrict stroke count or require stroke-by-stroke entry.
 */
export async function verifyKanaDrawing(
  strokes: Stroke[],
  expectedChar: string,
  options: { strictMode?: boolean } = {}
): Promise<VerificationResult> {
  const { strictMode = true } = options;

  if (strokes.length === 0) {
    return {
      isCorrect: false,
      recognizedAs: 'None',
      candidates: [],
      expectedChar,
      feedback: 'Please draw the character on the canvas before checking.',
    };
  }

  // 1. Google Handwriting Recognition
  const candidates = await recognizeStrokesOnline(strokes);

  // Check for Japanese characters among candidates
  const isKanaOrKanji = (str: string) =>
    /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(str);

  const japaneseCandidates = candidates.filter(isKanaOrKanji);

  // Top detected Japanese character (or top raw candidate)
  const topJapanese = japaneseCandidates[0] || candidates[0] || 'Unknown';

  // Check if expected character is matched in candidates
  const matchIndex = candidates.findIndex((c) => c === expectedChar || c.startsWith(expectedChar));
  const japaneseMatchIndex = japaneseCandidates.findIndex(
    (c) => c === expectedChar || c.startsWith(expectedChar)
  );

  // In strict mode: must be in top 3 Japanese candidates or top 5 raw candidates
  // In relaxed mode: must be in top 6 Japanese candidates or top 8 raw candidates
  const maxRank = strictMode ? 3 : 6;
  const isGoogleMatch =
    (japaneseMatchIndex !== -1 && japaneseMatchIndex < maxRank) ||
    (matchIndex !== -1 && matchIndex < (strictMode ? 5 : 8));

  // 2. Visual template match as fallback / reinforcement
  const isVisualMatch = visualTemplateMatch(strokes, expectedChar);

  const isCorrect = isGoogleMatch || isVisualMatch;

  let feedback = '';
  if (isCorrect) {
    feedback = `Excellent! Recognized correctly as 「${expectedChar}」.`;
  } else {
    feedback = `Not quite. Your drawing was detected as 「${topJapanese}」 instead of 「${expectedChar}」.`;
  }

  return {
    isCorrect,
    recognizedAs: topJapanese,
    candidates: candidates.slice(0, 5),
    expectedChar,
    feedback,
    rank: matchIndex !== -1 ? matchIndex + 1 : undefined,
  };
}
