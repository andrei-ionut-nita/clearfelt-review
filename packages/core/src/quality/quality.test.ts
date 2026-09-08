import { describe, expect, it } from 'vitest';
import { ADVERSARIAL_CASES, makeQualityCleanReview } from '../testing/adversarial.ts';
import { makeOutcomeAssessment, makeRecommendation, makeValidReview } from '../testing/factory.ts';
import { makeWorkedExample } from '../testing/worked-example.ts';
import { formatIssues, validateReview } from '../validate/index.ts';
import { checkContract } from './contract.ts';
import { evaluateQuality, formatQualityReport } from './index.ts';
import { genericPhrasesIn, similarity, statesAFailureCondition } from './text.ts';

describe('the clean base', () => {
  it('validates', () => {
    expect(formatIssues(validateReview(makeQualityCleanReview()).errors)).toBe('');
  });

  it('answers all ten contract questions', () => {
    const report = checkContract(makeQualityCleanReview());
    const unanswered = report.recommendations.flatMap((r) => r.unanswered);
    expect(unanswered).toEqual([]);
  });

  it('trips no quality check', () => {
    // Every adversarial case is a mutation of this run. If the base itself
    // produced findings, each case would inherit them and no case would be
    // proving anything about the rule it names.
    const report = evaluateQuality(makeQualityCleanReview());
    expect(report.findings.map((f) => f.code)).toEqual([]);
    expect(report.ok).toBe(true);
  });
});

describe('adversarial fixtures', () => {
  for (const testCase of ADVERSARIAL_CASES) {
    describe(testCase.name, () => {
      const review = testCase.build();

      it('is a valid review, so quality is what catches it', () => {
        // The point of these fixtures: structurally impeccable, not fit to act
        // on. A fixture that failed validation would prove nothing about
        // quality evaluation, because nothing renders from an invalid run.
        expect(formatIssues(validateReview(review).errors)).toBe('');
      });

      it(`trips ${testCase.expect}, and only that`, () => {
        const codes = evaluateQuality(review).findings.map((f) => f.code);
        expect(codes).toEqual([testCase.expect]);
      });

      if (testCase.contract_incomplete) {
        it('also leaves the output contract unanswered', () => {
          expect(checkContract(review).ok).toBe(false);
        });
      } else {
        it('still answers the output contract, which is why the check is needed', () => {
          // The uncomfortable half of Phase 2: a run can answer all ten
          // questions and still not be worth acting on.
          expect(checkContract(review).ok).toBe(true);
        });
      }
    });
  }

  it('covers every distinct check code the implementation can emit', () => {
    const expected = new Set(ADVERSARIAL_CASES.map((c) => c.expect));
    const emitted = new Set<string>();
    for (const testCase of ADVERSARIAL_CASES) {
      for (const finding of evaluateQuality(testCase.build()).findings) emitted.add(finding.code);
    }
    expect([...emitted].sort()).toEqual([...expected].sort());
  });
});

describe('the output contract', () => {
  it('does not pass a run with no recommendations off as good', () => {
    const report = checkContract(makeValidReview({ recommendations: [], actions: [] }));
    expect(report.total).toBe(0);
    expect(
      formatQualityReport(evaluateQuality(makeValidReview({ recommendations: [], actions: [] }))),
    ).toContain('nothing to test');
  });

  it('fails a recommendation whose evidence chain stops before a source', () => {
    const review = makeQualityCleanReview();
    review.findings = review.findings.map((f) => ({ ...f, evidence_ids: [] }));
    // Deliberately not run through validate: this shape is an integrity error
    // as well, and the point here is what the contract says about it.
    const contract = checkContract(review).recommendations[0];
    expect(contract?.unanswered).toContain('what_evidence');
  });

  it('fails a recommendation that names no place to change', () => {
    const review = makeQualityCleanReview();
    review.actions = [];
    const contract = checkContract(review).recommendations[0];
    expect(contract?.unanswered).toEqual(['where_it_changes']);
  });

  it('reports what is missing, not merely that something is', () => {
    const review = makeQualityCleanReview();
    review.recommendations = [makeRecommendation({ why_it_matters: '' })];
    const answer = checkContract(review).recommendations[0]?.answers.find(
      (a) => a.key === 'why_it_matters',
    );
    expect(answer?.detail).toBe('why_it_matters is empty');
  });
});

describe('text primitives', () => {
  it('treats a reordered clause as the same instruction', () => {
    // Order-insensitive on purpose: a check keyed on containment would be
    // evaded by moving a clause, and the reasoning layer writing this JSON is
    // exactly the kind of author that moves clauses.
    expect(
      similarity(
        'Lead the homepage hero with economics.',
        'On the homepage, the hero should lead with economics.',
      ),
    ).toBeGreaterThan(0.7);
  });

  it('does not pretend to stem across word families', () => {
    // "rewrite" and "rewritten" are one idea and two terms to this code. The
    // limitation is recorded here rather than papered over, because a reader
    // tuning SAME_TEXT needs to know the scores run low, not high.
    expect(similarity('Rewrite the hero.', 'The hero, rewritten.')).toBeLessThan(0.7);
  });

  it('does not treat two different instructions as the same', () => {
    expect(
      similarity(
        'Rewrite the hero to lead with economics.',
        'Publish a named client endorsement on the advisory page.',
      ),
    ).toBeLessThan(0.2);
  });

  it('knows a success statement is not a failure condition', () => {
    expect(statesAFailureCondition('Qualified enquiries rise over the quarter.')).toBe(false);
    expect(statesAFailureCondition('No change in qualified enquiries after eight weeks.')).toBe(
      true,
    );
  });

  describe('generic phrase detection', () => {
    it('still catches the phrase verbatim', () => {
      // The cheap case a literal list always caught, unaffected by adding a
      // fuzzy path alongside it.
      expect(genericPhrasesIn('We will improve messaging across the site.')).toContain(
        'improve messaging',
      );
    });

    it('catches a paraphrase a literal substring match would miss', () => {
      // "strengthen the client's brand" is not a substring of "strengthen
      // the brand": the possessive breaks contiguity, and no entry in
      // GENERIC_PHRASES matches literally. It is the same generic advice
      // in different words, which is exactly what Phase 3 found the
      // literal list structurally cannot see.
      expect(
        genericPhrasesIn("We should strengthen the client's brand across every channel."),
      ).toContain('strengthen the brand');
    });

    it('catches reordering and inflection, not just insertion', () => {
      expect(
        genericPhrasesIn('The brand has been strengthened considerably this quarter.'),
      ).toContain('strengthen the brand');
    });

    it('does not flag a specific recommendation that merely shares a word', () => {
      // "optimise" and "improve" are different words to the stemmer, and
      // sharing only one of a phrase's two content terms scores well below
      // GENERIC_PHRASE_THRESHOLD. A false positive here would be worse than
      // a missed one: it reports as a defect, not a caution.
      expect(
        genericPhrasesIn(
          'Optimise the checkout flow by removing the account-creation step before payment.',
        ),
      ).toEqual([]);
    });

    it('does not flag an unrelated recommendation that names no generic advice at all', () => {
      expect(
        genericPhrasesIn(
          'Add two named client case studies to the work page, each with a measured result.',
        ),
      ).toEqual([]);
    });
  });
});

describe('checkOutcomeAssessments', () => {
  it('cautions on a failed, falsifier-held assessment with no superseding recommendation', () => {
    const review = makeValidReview({
      outcome_assessments: [makeOutcomeAssessment({ verdict: 'failed', falsifier_held: true })],
    });
    const report = evaluateQuality(review);
    expect(report.defects).toEqual([]);
    expect(report.cautions.map((c) => c.code)).toContain(
      'outcome_assessment.failed_without_followup',
    );
  });

  it('does not fire when a recommendation in this run supersedes the assessed one', () => {
    const review = makeValidReview({
      recommendations: [
        makeRecommendation(),
        makeRecommendation({ id: 'R-0002', supersedes: 'R-0001' }),
      ],
      outcome_assessments: [makeOutcomeAssessment({ verdict: 'failed', falsifier_held: true })],
    });
    const report = evaluateQuality(review);
    expect(report.findings.map((f) => f.code)).not.toContain(
      'outcome_assessment.failed_without_followup',
    );
  });

  it('does not fire on an achieved verdict', () => {
    const review = makeValidReview({
      outcome_assessments: [makeOutcomeAssessment({ verdict: 'achieved', falsifier_held: false })],
    });
    const report = evaluateQuality(review);
    expect(report.findings.map((f) => f.code)).not.toContain(
      'outcome_assessment.failed_without_followup',
    );
  });
});

describe('the worked example', () => {
  it('is honest about its own uncertainty rather than clean', () => {
    // The fixture deliberately carries an inferred finding on an unvalidated
    // assumption. Quality should say so as a caution and not as a defect: the
    // run is doing the right thing by declaring it.
    const report = evaluateQuality(makeWorkedExample());
    expect(report.defects).toEqual([]);
    expect(report.cautions.map((c) => c.code)).toContain(
      'recommendation.rests_on_unvalidated_assumption',
    );
  });
});
