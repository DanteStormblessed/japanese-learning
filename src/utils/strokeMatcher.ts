/**
 * Vector Stroke Matching & Calligraphy Verification Engine
 *
 * Implements target-based geometric stroke evaluation using official KanjiVG
 * vector definitions (the standard used by Duolingo and Skritter).
 *
 * Evaluates:
 * 1. Stroke shape and curvature via Dynamic Time Warping (DTW)
 * 2. Stroke order & stroke count verification
 * 3. Stroke start/end direction & vector alignment
 * 4. Point-cloud silhouette similarity ($P recognizer metric)
 * 5. Nearest candidate identification when drawing is incorrect
 *
 * 100% offline, 0 ms latency, no external API dependence.
 */

import { KANJIVG_KANA } from '../data/kanjivgKana';

export interface Point2D {
  x: number;
  y: number;
  time?: number;
}

export type Stroke = Point2D[];

export interface StrokeEvaluation {
  strokeIndex: number;          // 1-based index (1, 2, 3...)
  matchedTargetStroke: number;  // 1-based target stroke it corresponds to
  score: number;                // 0 - 100%
  isCorrectDirection: boolean;  // Start-to-end direction correct
  isReversed: boolean;          // True if drawn backwards
  shapeSimilarity: number;      // 0 - 100%
  feedback: string;
}

export interface VectorMatchResult {
  isCorrect: boolean;
  score: number;                // 0 - 100%
  expectedStrokeCount: number;
  actualStrokeCount: number;
  strokeEvaluations: StrokeEvaluation[];
  feedback: string;
  recognizedAs: string;
  closestCandidates: { char: string; similarity: number }[];
  referenceStrokes: Stroke[];   // Normalized reference strokes (0..100)
  userStrokesNormalized: Stroke[]; // Normalized user strokes (0..100)
}

// Number of sample points per stroke for uniform comparison
const RESAMPLE_POINTS = 32;

/**
 * Parses an SVG path data string (from KanjiVG) into a continuous polyline.
 */
export function parseSvgPathToPolyline(d: string): Point2D[] {
  const commandRegex = /([a-df-z])([^a-df-z]*)/gi;
  let currentX = 0;
  let currentY = 0;
  const rawPoints: Point2D[] = [];

  let match: RegExpExecArray | null;
  while ((match = commandRegex.exec(d)) !== null) {
    const cmd = match[1];
    const argsStr = match[2].trim();
    const numRegex = /[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g;
    const nums: number[] = [];
    let numMatch: RegExpExecArray | null;
    while ((numMatch = numRegex.exec(argsStr)) !== null) {
      nums.push(parseFloat(numMatch[0]));
    }

    const isRel = cmd === cmd.toLowerCase();
    const type = cmd.toUpperCase();

    if (type === 'M') {
      for (let i = 0; i < nums.length; i += 2) {
        const x = isRel ? currentX + nums[i] : nums[i];
        const y = isRel ? currentY + nums[i + 1] : nums[i + 1];
        currentX = x;
        currentY = y;
        rawPoints.push({ x, y });
      }
    } else if (type === 'C') {
      for (let i = 0; i < nums.length; i += 6) {
        const p0x = currentX;
        const p0y = currentY;
        const p1x = isRel ? currentX + nums[i] : nums[i];
        const p1y = isRel ? currentY + nums[i + 1] : nums[i + 1];
        const p2x = isRel ? currentX + nums[i + 2] : nums[i + 2];
        const p2y = isRel ? currentY + nums[i + 3] : nums[i + 3];
        const p3x = isRel ? currentX + nums[i + 4] : nums[i + 4];
        const p3y = isRel ? currentY + nums[i + 5] : nums[i + 5];

        const steps = 12;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const mt = 1 - t;
          const bx =
            mt * mt * mt * p0x +
            3 * mt * mt * t * p1x +
            3 * mt * t * t * p2x +
            t * t * t * p3x;
          const by =
            mt * mt * mt * p0y +
            3 * mt * mt * t * p1y +
            3 * mt * t * t * p2y +
            t * t * t * p3y;
          rawPoints.push({ x: bx, y: by });
        }
        currentX = p3x;
        currentY = p3y;
      }
    } else if (type === 'S') {
      for (let i = 0; i < nums.length; i += 4) {
        const p0x = currentX;
        const p0y = currentY;
        const p2x = isRel ? currentX + nums[i] : nums[i];
        const p2y = isRel ? currentY + nums[i + 1] : nums[i + 1];
        const p3x = isRel ? currentX + nums[i + 2] : nums[i + 2];
        const p3y = isRel ? currentY + nums[i + 3] : nums[i + 3];
        const p1x = p0x;
        const p1y = p0y;

        const steps = 10;
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          const mt = 1 - t;
          const bx =
            mt * mt * mt * p0x +
            3 * mt * mt * t * p1x +
            3 * mt * t * t * p2x +
            t * t * t * p3x;
          const by =
            mt * mt * mt * p0y +
            3 * mt * mt * t * p1y +
            3 * mt * t * t * p2y +
            t * t * t * p3y;
          rawPoints.push({ x: bx, y: by });
        }
        currentX = p3x;
        currentY = p3y;
      }
    } else if (type === 'L') {
      for (let i = 0; i < nums.length; i += 2) {
        const x = isRel ? currentX + nums[i] : nums[i];
        const y = isRel ? currentY + nums[i + 1] : nums[i + 1];
        currentX = x;
        currentY = y;
        rawPoints.push({ x, y });
      }
    } else if (type === 'H') {
      for (let i = 0; i < nums.length; i++) {
        currentX = isRel ? currentX + nums[i] : nums[i];
        rawPoints.push({ x: currentX, y: currentY });
      }
    } else if (type === 'V') {
      for (let i = 0; i < nums.length; i++) {
        currentY = isRel ? currentY + nums[i] : nums[i];
        rawPoints.push({ x: currentX, y: currentY });
      }
    }
  }

  return rawPoints;
}

/**
 * Resamples any polyline into N equidistant points using arc-length parameterization.
 */
export function resampleStroke(points: Point2D[], n: number = RESAMPLE_POINTS): Point2D[] {
  if (points.length <= 1) {
    if (points.length === 1) return Array(n).fill({ ...points[0] });
    return [];
  }

  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    totalLength += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }

  if (totalLength === 0) {
    return Array(n).fill({ ...points[0] });
  }

  const interval = totalLength / (n - 1);
  const result: Point2D[] = [{ ...points[0] }];
  let currentDist = 0;
  let targetDist = interval;

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1];
    const p2 = points[i];
    const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);

    while (currentDist + segLen >= targetDist && result.length < n) {
      const t = (targetDist - currentDist) / (segLen || 1);
      result.push({
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y),
      });
      targetDist += interval;
    }
    currentDist += segLen;
  }

  while (result.length < n) {
    result.push({ ...points[points.length - 1] });
  }

  return result;
}

/**
 * Canonical normalization: centers and scales strokes to a standard [0, 100] x [0, 100] canvas,
 * preserving aspect ratio.
 */
export function normalizeStrokes(strokes: Stroke[], targetSize = 100): Stroke[] {
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

  if (minX === Infinity) return [];

  const w = Math.max(maxX - minX, 1);
  const h = Math.max(maxY - minY, 1);
  const maxDim = Math.max(w, h);
  const scale = (targetSize * 0.8) / maxDim;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const targetCenter = targetSize / 2;

  return strokes.map((stroke) =>
    stroke.map((p) => ({
      x: targetCenter + (p.x - cx) * scale,
      y: targetCenter + (p.y - cy) * scale,
    }))
  );
}

// Cache for parsed & normalized reference strokes
const referenceStrokeCache = new Map<string, Stroke[]>();

/**
 * Get canonical normalized reference strokes for a given character from KanjiVG data.
 */
export function getReferenceStrokes(char: string): Stroke[] {
  if (referenceStrokeCache.has(char)) {
    return referenceStrokeCache.get(char)!;
  }

  // Handle single character
  const single = KANJIVG_KANA[char];
  if (single) {
    const rawStrokes = single.paths.map((p) =>
      resampleStroke(parseSvgPathToPolyline(p), RESAMPLE_POINTS)
    );
    const normalized = normalizeStrokes(rawStrokes, 100);
    referenceStrokeCache.set(char, normalized);
    return normalized;
  }

  // Handle combination character (e.g. "きゃ" -> "き" + "ゃ")
  if (char.length === 2 && KANJIVG_KANA[char[0]] && KANJIVG_KANA[char[1]]) {
    const baseEntry = KANJIVG_KANA[char[0]];
    const smallEntry = KANJIVG_KANA[char[1]];

    const baseStrokes = baseEntry.paths.map((p) =>
      resampleStroke(parseSvgPathToPolyline(p), RESAMPLE_POINTS).map((pt) => ({
        x: pt.x * 0.7,
        y: pt.y * 0.85,
      }))
    );
    const smallStrokes = smallEntry.paths.map((p) =>
      resampleStroke(parseSvgPathToPolyline(p), RESAMPLE_POINTS).map((pt) => ({
        x: 48 + pt.x * 0.48,
        y: 40 + pt.y * 0.48,
      }))
    );

    const combined = normalizeStrokes([...baseStrokes, ...smallStrokes], 100);
    referenceStrokeCache.set(char, combined);
    return combined;
  }

  return [];
}

/**
 * Dynamic Time Warping (DTW) distance between two curves.
 */
export function computeDTWDistance(c1: Point2D[], c2: Point2D[]): number {
  const n = c1.length;
  const m = c2.length;
  if (n === 0 || m === 0) return 100;

  // Space-optimized 2-row DTW matrix
  let prevRow = new Float32Array(m + 1);
  let currRow = new Float32Array(m + 1);

  for (let j = 1; j <= m; j++) {
    prevRow[j] = Infinity;
  }
  prevRow[0] = 0;

  for (let i = 1; i <= n; i++) {
    currRow[0] = Infinity;
    const p1 = c1[i - 1];
    for (let j = 1; j <= m; j++) {
      const p2 = c2[j - 1];
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      const minPrev = Math.min(prevRow[j], currRow[j - 1], prevRow[j - 1]);
      currRow[j] = dist + minPrev;
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }

  return prevRow[m] / (n + m);
}

/**
 * Point Cloud Distance ($P Recognizer metric).
 * Measures bidirectional minimum Euclidean distance between all points of two multi-stroke clouds.
 */
export function computePointCloudDistance(strokesA: Stroke[], strokesB: Stroke[]): number {
  const ptsA: Point2D[] = strokesA.flat();
  const ptsB: Point2D[] = strokesB.flat();

  if (ptsA.length === 0 || ptsB.length === 0) return 100;

  let sumA = 0;
  for (const p of ptsA) {
    let minD = Infinity;
    for (const q of ptsB) {
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < minD) minD = d;
    }
    sumA += minD;
  }

  let sumB = 0;
  for (const q of ptsB) {
    let minD = Infinity;
    for (const p of ptsA) {
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < minD) minD = d;
    }
    sumB += minD;
  }

  return 0.5 * (sumA / ptsA.length + sumB / ptsB.length);
}

/**
 * Checks stroke direction (start-to-end vector cosine similarity).
 */
function evaluateStrokeDirection(
  userStroke: Point2D[],
  refStroke: Point2D[]
): { isReversed: boolean; angleSimilarity: number } {
  const n = userStroke.length;
  const uStart = userStroke[0];
  const uEnd = userStroke[n - 1];
  const rStart = refStroke[0];
  const rEnd = refStroke[n - 1];

  const uDx = uEnd.x - uStart.x;
  const uDy = uEnd.y - uStart.y;
  const rDx = rEnd.x - rStart.x;
  const rDy = rEnd.y - rStart.y;

  const uLen = Math.hypot(uDx, uDy);
  const rLen = Math.hypot(rDx, rDy);

  if (uLen < 4 || rLen < 4) {
    // Very short stroke (like a dot/ten) - direction is less critical
    return { isReversed: false, angleSimilarity: 1 };
  }

  const dot = (uDx * rDx + uDy * rDy) / (uLen * rLen);

  // Check if reversed endpoints are closer
  const directDist = Math.hypot(uStart.x - rStart.x, uStart.y - rStart.y) + Math.hypot(uEnd.x - rEnd.x, uEnd.y - rEnd.y);
  const reverseDist = Math.hypot(uStart.x - rEnd.x, uStart.y - rEnd.y) + Math.hypot(uEnd.x - rStart.x, uEnd.y - rStart.y);

  const isReversed = dot < -0.35 || reverseDist < directDist * 0.7;
  return { isReversed, angleSimilarity: dot };
}

/**
 * Rigorously matches drawn strokes against the official target KanjiVG character.
 */
export function matchKanaAgainstTarget(
  rawUserStrokes: Stroke[],
  targetChar: string,
  options: { strictOrder?: boolean; thresholdScore?: number } = {}
): VectorMatchResult {
  const { strictOrder = true, thresholdScore = 65 } = options;

  const expectedStrokes = getReferenceStrokes(targetChar);
  const expectedCount = expectedStrokes.length;

  // Filter out tiny accidental click dots
  const validUserStrokes = rawUserStrokes.filter((s) => {
    if (s.length < 2) return false;
    let len = 0;
    for (let i = 1; i < s.length; i++) {
      len += Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y);
    }
    return len > 4;
  });

  const actualCount = validUserStrokes.length;

  if (actualCount === 0 || expectedCount === 0) {
    return {
      isCorrect: false,
      score: 0,
      expectedStrokeCount: expectedCount,
      actualStrokeCount: 0,
      strokeEvaluations: [],
      feedback: 'Please draw the character on the canvas before checking.',
      recognizedAs: 'None',
      closestCandidates: [],
      referenceStrokes: expectedStrokes,
      userStrokesNormalized: [],
    };
  }

  // Resample and normalize both sets of strokes
  const resampledUserStrokes = validUserStrokes.map((s) => resampleStroke(s, RESAMPLE_POINTS));
  const userNormalized = normalizeStrokes(resampledUserStrokes, 100);

  // 1. Point Cloud Silhouette Distance ($P Metric)
  const pointCloudDist = computePointCloudDistance(userNormalized, expectedStrokes);
  // Scale 0..30 dist to 100..0 score
  const pointCloudScore = Math.max(0, Math.min(100, Math.round(100 - pointCloudDist * 3.3)));

  // 2. Stroke-by-Stroke Evaluation
  const strokeEvaluations: StrokeEvaluation[] = [];
  const assignedRefIndices = new Set<number>();
  let totalStrokeScore = 0;

  for (let uIdx = 0; uIdx < userNormalized.length; uIdx++) {
    const uStroke = userNormalized[uIdx];

    let bestRefIdx = uIdx < expectedCount ? uIdx : 0;
    let bestDTW = Infinity;
    let bestDirection = { isReversed: false, angleSimilarity: 1 };

    if (strictOrder && uIdx < expectedCount) {
      bestRefIdx = uIdx;
      bestDTW = computeDTWDistance(uStroke, expectedStrokes[bestRefIdx]);
      bestDirection = evaluateStrokeDirection(uStroke, expectedStrokes[bestRefIdx]);
    } else {
      // Find closest unassigned reference stroke
      for (let rIdx = 0; rIdx < expectedCount; rIdx++) {
        const d = computeDTWDistance(uStroke, expectedStrokes[rIdx]);
        if (d < bestDTW) {
          bestDTW = d;
          bestRefIdx = rIdx;
          bestDirection = evaluateStrokeDirection(uStroke, expectedStrokes[rIdx]);
        }
      }
    }
    assignedRefIndices.add(bestRefIdx);

    // Convert DTW distance (typically 0..25) to percentage score
    let strokeScore = Math.max(0, Math.min(100, Math.round(100 - bestDTW * 3.8)));

    if (bestDirection.isReversed) {
      // Penalty for reversed stroke direction
      strokeScore = Math.round(strokeScore * 0.72);
    }

    let feedback = '';
    if (bestDirection.isReversed) {
      feedback = `Stroke ${uIdx + 1} was drawn backwards (reverse direction).`;
    } else if (strokeScore >= 75) {
      feedback = `Stroke ${uIdx + 1}: Excellent stroke curvature and direction (${strokeScore}%).`;
    } else if (strokeScore >= 50) {
      feedback = `Stroke ${uIdx + 1}: Fair resemblance, but slightly displaced or deformed (${strokeScore}%).`;
    } else {
      feedback = `Stroke ${uIdx + 1}: Shape deviated significantly from reference (${strokeScore}%).`;
    }

    strokeEvaluations.push({
      strokeIndex: uIdx + 1,
      matchedTargetStroke: bestRefIdx + 1,
      score: strokeScore,
      isCorrectDirection: !bestDirection.isReversed,
      isReversed: bestDirection.isReversed,
      shapeSimilarity: Math.max(0, Math.min(100, Math.round(100 - bestDTW * 3.8))),
      feedback,
    });

    totalStrokeScore += strokeScore;
  }

  const avgStrokeScore = actualCount > 0 ? totalStrokeScore / actualCount : 0;

  // Stroke count conformity penalty
  const strokeCountDiff = Math.abs(actualCount - expectedCount);
  let strokeCountPenalty = 0;
  if (strokeCountDiff > 0) {
    strokeCountPenalty = Math.min(30, strokeCountDiff * 14);
  }

  // Combined Final Score
  const overallScore = Math.max(
    0,
    Math.min(100, Math.round(avgStrokeScore * 0.55 + pointCloudScore * 0.45 - strokeCountPenalty))
  );

  const isCorrect = overallScore >= thresholdScore;

  // Feedback text formulation
  let mainFeedback = '';
  if (isCorrect) {
    mainFeedback = `Splendid! Accurate KanjiVG match for 「${targetChar}」 with ${overallScore}% precision.`;
  } else if (strokeCountDiff > 0) {
    mainFeedback = `Stroke count mismatch: Expected ${expectedCount} stroke${
      expectedCount > 1 ? 's' : ''
    } for 「${targetChar}」, but you drew ${actualCount}. Score: ${overallScore}%.`;
  } else if (strokeEvaluations.some((e) => e.isReversed)) {
    mainFeedback = `Correct general shape, but one or more strokes were drawn backwards. Score: ${overallScore}%.`;
  } else {
    mainFeedback = `The proportions or curvature differ from official calligraphy for 「${targetChar}」 (${overallScore}% match).`;
  }

  // Find nearest candidate among all KanjiVG kana if score is low
  let recognizedAs = targetChar;
  const closestCandidates: { char: string; similarity: number }[] = [];

  if (!isCorrect) {
    const scores: { char: string; similarity: number }[] = [];
    const allKana = Object.keys(KANJIVG_KANA);

    for (const otherChar of allKana) {
      const otherRef = getReferenceStrokes(otherChar);
      if (otherRef.length === 0) continue;
      const d = computePointCloudDistance(userNormalized, otherRef);
      const sim = Math.max(0, Math.min(100, Math.round(100 - d * 3.3)));
      scores.push({ char: otherChar, similarity: sim });
    }

    scores.sort((a, b) => b.similarity - a.similarity);
    closestCandidates.push(...scores.slice(0, 4));

    if (closestCandidates.length > 0 && closestCandidates[0].char !== targetChar) {
      recognizedAs = closestCandidates[0].char;
      if (closestCandidates[0].similarity > overallScore + 8) {
        mainFeedback = `Detected closer to 「${recognizedAs}」 (${closestCandidates[0].similarity}% match) than 「${targetChar}」 (${overallScore}%).`;
      }
    }
  }

  return {
    isCorrect,
    score: overallScore,
    expectedStrokeCount: expectedCount,
    actualStrokeCount: actualCount,
    strokeEvaluations,
    feedback: mainFeedback,
    recognizedAs,
    closestCandidates,
    referenceStrokes: expectedStrokes,
    userStrokesNormalized: userNormalized,
  };
}

/**
 * Draws the official KanjiVG reference strokes on a canvas as a ghost guide
 * with stroke numbers (①, ②, ③) and subtle direction arrows.
 */
export function renderKanjiVgGuide(
  canvas: HTMLCanvasElement,
  char: string,
  options: {
    strokeColor?: string;
    lineWidth?: number;
    showNumbers?: boolean;
  } = {}
) {
  const {
    strokeColor = 'rgba(235, 110, 130, 0.45)',
    lineWidth = 4,
    showNumbers = true,
  } = options;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const strokes = getReferenceStrokes(char);
  if (strokes.length === 0) return;

  const scale = canvas.width / 100;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeColor;

  strokes.forEach((stroke, idx) => {
    if (stroke.length === 0) return;

    // Draw the curve
    ctx.beginPath();
    ctx.moveTo(stroke[0].x * scale, stroke[0].y * scale);
    for (let i = 1; i < stroke.length; i++) {
      ctx.lineTo(stroke[i].x * scale, stroke[i].y * scale);
    }
    ctx.stroke();

    // Draw stroke start number badge: ①, ②, ③
    if (showNumbers) {
      const startPt = stroke[0];
      const radius = 10;
      const bx = startPt.x * scale;
      const by = startPt.y * scale;

      ctx.save();
      ctx.fillStyle = 'var(--accent-sakura)';
      ctx.beginPath();
      ctx.arc(bx, by, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(idx + 1), bx, by);
      ctx.restore();
    }
  });

  ctx.restore();
}
