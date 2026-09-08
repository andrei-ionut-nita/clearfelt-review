import type { Level, Priority, Recommendation, Review } from './model/index.ts';

/**
 * Priority computation.
 *
 * Spec section 25 forbids one arbitrary overall score and requires independent
 * dimensions. Priority is therefore derived here from impact, effort,
 * confidence and urgency, and is deliberately absent from the Recommendation
 * type: an authored priority would let the reasoning layer assert a P0 it has
 * not earned, and no amount of prompt instruction reliably prevents that.
 *
 * The user must be able to understand why something is P0, so every result
 * carries the arithmetic and the caps that produced it.
 */

const POINTS: Record<Level, number> = { low: 1, medium: 2, high: 3 };

/**
 * Weights, stated once so the trade-off is visible and arguable rather than
 * buried. Impact dominates, effort only nudges: a hard change worth making is
 * still worth making, so effort orders work rather than deciding whether it
 * happens.
 */
const WEIGHTS = { impact: 3, urgency: 2, confidence: 2, effort: -1 } as const;

const BANDS: [number, Priority][] = [
  [18, 'P0'],
  [14, 'P1'],
  [9, 'P2'],
];

/**
 * The highest score `scoreOf` can produce: every dimension at its most
 * favourable level. Exported so a renderer can show the score as a
 * proportion of its ceiling without re-deriving the weights itself.
 */
export const MAX_SCORE =
  POINTS.high * WEIGHTS.impact +
  POINTS.high * WEIGHTS.urgency +
  POINTS.high * WEIGHTS.confidence +
  POINTS.low * WEIGHTS.effort;

export interface PriorityResult {
  id: string;
  priority: Priority;
  score: number;
  /** Plain-language account of how the band was reached, including any cap. */
  rationale: string;
  quadrant: Quadrant;
}

/** The spec section 26 opportunity map, as a value rather than a picture. */
export type Quadrant = 'do_now' | 'strategic_bet' | 'quick_win' | 'defer';

export function quadrantFor(impact: Level, effort: Level): Quadrant {
  const highImpact = impact === 'high';
  const highEffort = effort === 'high';
  if (highImpact && !highEffort) return 'do_now';
  if (highImpact && highEffort) return 'strategic_bet';
  if (!highImpact && !highEffort) return 'quick_win';
  return 'defer';
}

export const QUADRANT_LABELS: Record<Quadrant, string> = {
  do_now: 'Do now',
  strategic_bet: 'Strategic bet',
  quick_win: 'Quick win',
  defer: 'Defer',
};

function bandFor(score: number): Priority {
  for (const [threshold, priority] of BANDS) {
    if (score >= threshold) return priority;
  }
  return 'P3';
}

function rank(priority: Priority): number {
  return Number(priority.slice(1));
}

export function scoreOf(
  rec: Pick<Recommendation, 'impact' | 'urgency' | 'confidence' | 'effort'>,
): number {
  const impact = POINTS[rec.impact] ?? 1;
  const urgency = POINTS[rec.urgency] ?? 1;
  const confidence = POINTS[rec.confidence] ?? 1;
  const effort = POINTS[rec.effort] ?? 1;
  return (
    impact * WEIGHTS.impact +
    urgency * WEIGHTS.urgency +
    confidence * WEIGHTS.confidence +
    effort * WEIGHTS.effort
  );
}

/**
 * Caps stop a high score in one dimension carrying a recommendation past a
 * band it has not earned. Low impact should never read as important however
 * urgent it feels, and low confidence should never read as settled.
 */
function applyCaps(
  rec: Pick<Recommendation, 'impact' | 'confidence'>,
  banded: Priority,
): { priority: Priority; cap?: string } {
  let priority = banded;
  let cap: string | undefined;
  if (rec.impact === 'low' && rank(priority) < 2) {
    priority = 'P2';
    cap = 'capped at P2 because impact is low';
  }
  if (rec.confidence === 'low' && rank(priority) < 1) {
    priority = 'P1';
    cap = cap
      ? `${cap}, and capped at P1 because confidence is low`
      : 'capped at P1 because confidence is low';
  }
  return { priority, cap };
}

export function prioritiseOne(rec: Recommendation): PriorityResult {
  const score = scoreOf(rec);
  const banded = bandFor(score);
  const { priority, cap } = applyCaps(rec, banded);
  const parts = [
    `impact ${rec.impact}`,
    `urgency ${rec.urgency}`,
    `confidence ${rec.confidence}`,
    `effort ${rec.effort}`,
  ].join(', ');
  const rationale = cap
    ? `${parts} scores ${score}, which bands as ${banded}, ${cap}`
    : `${parts} scores ${score}, which bands as ${priority}`;
  return { id: rec.id, priority, score, rationale, quadrant: quadrantFor(rec.impact, rec.effort) };
}

/**
 * Sorted most important first: priority band, then score, then id.
 *
 * Sorting by id last makes the order stable across runs, so a rendered report
 * does not reshuffle between two identical inputs and produce a meaningless
 * diff.
 */
export function prioritise(review: Review): PriorityResult[] {
  return review.recommendations
    .map(prioritiseOne)
    .sort(
      (a, b) =>
        rank(a.priority) - rank(b.priority) || b.score - a.score || a.id.localeCompare(b.id),
    );
}

export function priorityMap(review: Review): Map<string, PriorityResult> {
  return new Map(prioritise(review).map((r) => [r.id, r]));
}
