import { describe, expect, it } from 'vitest';
import {
  makeAction,
  makeComparison,
  makeEvidence,
  makeFeedback,
  makeFinding,
  makeObservation,
  makeRecommendation,
  makeSource,
  makeUserAssertion,
  makeValidReview,
} from '../testing/factory.ts';
import type { Issue } from './fields.ts';
import { validateReview } from './index.ts';

/** Asserts a specific rule fired, so a test cannot pass on an unrelated error. */
function codes(issues: readonly Issue[]): string[] {
  return issues.map((i) => i.code);
}

describe('the baseline fixture', () => {
  it('validates cleanly', () => {
    // Every test below breaks one thing in this fixture. If the baseline itself
    // stopped validating, all of those tests would pass for the wrong reason.
    const result = validateReview(makeValidReview());
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });
});

describe('evidence discipline', () => {
  it('rejects a finding with no evidence', () => {
    const review = makeValidReview({ findings: [makeFinding({ evidence_ids: [] })] });
    expect(codes(validateReview(review).errors)).toContain('field.non_empty');
  });

  it('rejects evidence with no observation', () => {
    const review = makeValidReview({ evidence: [makeEvidence({ observation_ids: [] })] });
    expect(codes(validateReview(review).errors)).toContain('field.non_empty');
  });

  it('rejects a recommendation with no finding', () => {
    const review = makeValidReview({ recommendations: [makeRecommendation({ finding_ids: [] })] });
    expect(codes(validateReview(review).errors)).toContain('field.non_empty');
  });

  it('rejects evidence that both supports and contradicts one finding', () => {
    const review = makeValidReview({
      evidence: [makeEvidence({ supports: ['F-0001'], contradicts: ['F-0001'] })],
    });
    expect(codes(validateReview(review).errors)).toContain('evidence.supports_and_contradicts');
  });
});

describe('referential integrity', () => {
  it('rejects a reference to an id that does not exist', () => {
    const review = makeValidReview({ findings: [makeFinding({ evidence_ids: ['E-9999'] })] });
    const result = validateReview(review);
    expect(codes(result.errors)).toContain('ref.missing');
  });

  it('rejects a reference pointing into the wrong collection', () => {
    // F-0001 exists, but evidence_ids must name evidence. Without this check a
    // traceability walk silently dead-ends on the wrong kind of entity.
    const review = makeValidReview({ findings: [makeFinding({ evidence_ids: ['F-0001'] })] });
    expect(codes(validateReview(review).errors)).toContain('ref.wrong_collection');
  });

  it('rejects duplicate ids within a collection', () => {
    const review = makeValidReview({ findings: [makeFinding(), makeFinding()] });
    expect(codes(validateReview(review).errors)).toContain('id.duplicate');
  });

  it('rejects an id carrying the wrong prefix for its collection', () => {
    const review = makeValidReview({
      findings: [makeFinding({ id: 'X-0001' })],
      evidence: [makeEvidence({ supports: [] })],
    });
    expect(codes(validateReview(review).errors)).toContain('id.wrong_prefix');
  });
});

describe('provenance', () => {
  it('rejects a fetched source with no snapshot', () => {
    // A fetched source with nothing stored cannot be reproduced or checked,
    // which is the only guard available against a fabricated retrieval.
    const review = makeValidReview({
      sources: [makeSource({ snapshot_path: undefined, content_hash: undefined })],
    });
    expect(codes(validateReview(review).errors)).toContain('field.string');
  });

  it('rejects a derived source that does not name its origin', () => {
    const review = makeValidReview({
      sources: [makeSource({ independence: { type: 'republished' } })],
    });
    expect(codes(validateReview(review).errors)).toContain('source.independence_missing_origin');
  });

  it('warns when corroboration comes from a non-independent source', () => {
    const review = makeValidReview({
      sources: [
        makeSource(),
        makeSource({
          id: 'S-0002',
          independence: { type: 'republished', of_source_id: 'S-0001' },
        }),
      ],
      observations: [makeObservation(), makeObservation({ id: 'OBS-0002', source_id: 'S-0002' })],
      evidence: [
        makeEvidence({ supports: ['F-0001'], corroborated_by: ['E-0002'] }),
        makeEvidence({ id: 'E-0002', observation_ids: ['OBS-0002'], source_ids: ['S-0002'] }),
      ],
    });
    const result = validateReview(review);
    expect(codes(result.issues)).toContain('evidence.corroboration_not_independent');
    // A warning, not an error: the run is still renderable, but the claim that
    // two sources agree is not one the model will endorse.
    expect(codes(result.errors)).not.toContain('evidence.corroboration_not_independent');
  });
});

describe('absence observations', () => {
  it('rejects an absence observation that does not say where it looked', () => {
    // "No pricing found" is defensible only with the scope searched. Without it
    // the observation collapses into "they do not publish pricing".
    const review = makeValidReview({
      observations: [makeObservation({ observation_type: 'absence', search_scope: [] })],
    });
    expect(codes(validateReview(review).errors)).toContain('observation.absence_without_scope');
  });

  it('rejects a multi-page absence that does not name the sources scanned', () => {
    // An absence found by checking five pages, attributed to whichever page
    // happened to be first, credits one source with work done across all of
    // them and makes the evidence look thinner than it is. Surfaced by the
    // first real run against a live site.
    const review = makeValidReview({
      observations: [
        makeObservation({
          observation_type: 'absence',
          statement: 'No named endorsement appears anywhere.',
          search_scope: ['/', '/about', '/writing'],
        }),
      ],
    });
    expect(codes(validateReview(review).errors)).toContain(
      'observation.absence_without_scanned_sources',
    );
  });

  it('accepts a multi-page absence that names them', () => {
    const review = makeValidReview({
      sources: [makeSource(), makeSource({ id: 'S-0002', url: 'https://example.com/about' })],
      observations: [
        makeObservation({
          observation_type: 'absence',
          statement: 'No named endorsement appears anywhere.',
          search_scope: ['/', '/about'],
          scanned_source_ids: ['S-0001', 'S-0002'],
        }),
      ],
    });
    expect(validateReview(review).errors).toEqual([]);
  });

  it('accepts an absence observation carrying its search scope', () => {
    const review = makeValidReview({
      observations: [
        makeObservation({
          observation_type: 'absence',
          statement: 'No pricing information found.',
          search_scope: ['/pricing'],
        }),
      ],
    });
    expect(validateReview(review).errors).toEqual([]);
  });
});

describe('user assertions are not evidence', () => {
  it('rejects a finding resting entirely on user supplied sources', () => {
    // The contamination this system exists to prevent: the user's own belief
    // laundered into a finding and handed back as though it were research.
    const review = makeValidReview({
      sources: [
        makeSource({
          retrieval_method: 'user_supplied',
          snapshot_path: undefined,
          content_hash: undefined,
        }),
      ],
      user_assertions: [makeUserAssertion()],
    });
    expect(codes(validateReview(review).errors)).toContain('finding.rests_only_on_user_assertion');
  });

  it('rejects an assertion marked corroborated only by user supplied sources', () => {
    const review = makeValidReview({
      sources: [
        makeSource({
          retrieval_method: 'user_supplied',
          snapshot_path: undefined,
          content_hash: undefined,
        }),
      ],
      user_assertions: [makeUserAssertion({ status: 'corroborated', evidence_ids: ['E-0001'] })],
    });
    expect(codes(validateReview(review).errors)).toContain('assertion.corroborated_by_itself');
  });

  it('requires a user proposed comparison to name the assertion it came from', () => {
    const review = makeValidReview({
      comparisons: [makeComparison({ proposed_by: 'user', entity_id: 'ENT-0001' })],
    });
    expect(codes(validateReview(review).errors)).toContain('field.string');
  });
});

describe('feedback acknowledgment', () => {
  it('requires a reason on an acknowledge entry', () => {
    // A boolean-shaped acknowledgment defeats the point: see feedback.ts.
    const review = makeValidReview({
      feedback: [
        makeFeedback({ id: 'FB-0001', target_id: 'F-0001' }),
        makeFeedback({
          id: 'FB-0002',
          target_id: 'FB-0001',
          type: 'acknowledge',
          reason: undefined,
        }),
      ],
    });
    expect(codes(validateReview(review).errors)).toContain('field.string');
  });

  it('rejects an acknowledge entry that targets something other than a feedback entry', () => {
    // F-0001 exists in the baseline fixture, but an acknowledgment is feedback
    // about feedback: it must name another Feedback entry, not any entity.
    const review = makeValidReview({
      feedback: [
        makeFeedback({
          id: 'FB-0001',
          target_id: 'F-0001',
          type: 'acknowledge',
          reason: 'Still stands.',
        }),
      ],
    });
    expect(codes(validateReview(review).errors)).toContain('ref.wrong_collection');
  });

  it('accepts an acknowledge entry naming a real feedback id with a real reason', () => {
    const review = makeValidReview({
      feedback: [
        makeFeedback({ id: 'FB-0001', target_id: 'F-0001' }),
        makeFeedback({
          id: 'FB-0002',
          target_id: 'FB-0001',
          type: 'acknowledge',
          reason: 'Still not a competitor; nothing changed since last run.',
        }),
      ],
    });
    expect(validateReview(review).errors).toEqual([]);
  });
});

describe('recommendations', () => {
  it('rejects an authored priority', () => {
    // priority is computed from impact, effort, confidence and urgency. An
    // authored one lets the reasoning layer assert a P0 it has not earned.
    const rec = { ...makeRecommendation(), priority: 'P0' };
    const review = makeValidReview({ recommendations: [rec] });
    expect(codes(validateReview(review).errors)).toContain('recommendation.authored_priority');
  });

  it('rejects a recommendation with no falsifier', () => {
    const rec = makeRecommendation();
    const review = makeValidReview({
      recommendations: [{ ...rec, measurement: { ...rec.measurement, falsifier: '' } }],
    });
    expect(codes(validateReview(review).errors)).toContain('field.string');
  });
});

describe('actions and the change tree', () => {
  it('rejects an action with nowhere to land', () => {
    const review = makeValidReview({ actions: [makeAction({ affected_assets: [] })] });
    expect(codes(validateReview(review).errors)).toContain('action.no_affected_assets');
  });

  it('rejects an edit that does not point at an asset we established exists', () => {
    const review = makeValidReview({
      actions: [makeAction({ affected_assets: [{ operation: 'edit', target: 'hero' }] })],
    });
    expect(codes(validateReview(review).errors)).toContain('action.change_without_asset');
  });

  it('rejects a new asset with no proposal', () => {
    const review = makeValidReview({
      actions: [makeAction({ affected_assets: [{ operation: 'new' }] })],
    });
    expect(codes(validateReview(review).errors)).toContain('action.new_without_proposal');
  });
});

describe('lifecycle consistency', () => {
  it('rejects recommendations in a run whose findings gate was never approved', () => {
    const review = makeValidReview();
    review.run.approved_gates = {
      scope: '2026-09-07T12:00:00.000Z',
      research_plan: '2026-09-07T12:00:00.000Z',
    };
    expect(codes(validateReview(review).errors)).toContain(
      'lifecycle.recommendations_before_findings',
    );
  });
});

describe('research questions', () => {
  it('requires a closed question to say why it closed', () => {
    const review = makeValidReview({
      research_questions: [
        {
          id: 'RQ-0001',
          question: 'How is the entity positioned?',
          module: 'positioning',
          state: 'INSUFFICIENT_EVIDENCE',
          evidence_ids: [],
          source_ids: [],
          priority: 1,
        },
      ],
    });
    expect(codes(validateReview(review).errors)).toContain('field.enum');
  });

  it('requires a partially answered question to say why research stopped', () => {
    // The easiest state to walk away from: something was found, the question is
    // not closed, and with no reason a reader cannot tell whether more was
    // available. Found while building the quality checks, where it first showed
    // up as a defect in this project's own worked example.
    const review = makeValidReview({
      research_questions: [
        {
          id: 'RQ-0001',
          question: 'What proof of impact is publicly visible?',
          module: 'credibility',
          state: 'PARTIALLY_ANSWERED',
          evidence_ids: [],
          source_ids: [],
          priority: 1,
        },
      ],
    });
    expect(codes(validateReview(review).errors)).toContain('field.enum');
  });

  it('accepts a question still in progress with no stop reason', () => {
    const review = makeValidReview({
      research_questions: [
        {
          id: 'RQ-0001',
          question: 'What proof of impact is publicly visible?',
          module: 'credibility',
          state: 'SEARCHING',
          evidence_ids: [],
          source_ids: [],
          priority: 1,
        },
      ],
    });
    expect(codes(validateReview(review).errors)).not.toContain('field.enum');
  });
});
