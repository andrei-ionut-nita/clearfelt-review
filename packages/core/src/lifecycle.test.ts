import { describe, expect, it } from 'vitest';
import {
  LifecycleError,
  assertTransition,
  assertWritable,
  canWrite,
  gateForStage,
  isLegalTransition,
  stageForGate,
  stageThatAllows,
} from './lifecycle.ts';

describe('canWrite', () => {
  it('allows run and feedback in every stage', () => {
    // A user must be able to record a correction without rewinding the run.
    expect(canWrite('complete', 'feedback')).toBe(true);
    expect(canWrite('blocked', 'feedback')).toBe(true);
    expect(canWrite('initialized', 'run')).toBe(true);
  });

  it('refuses findings before the findings stage', () => {
    expect(canWrite('researching', 'findings')).toBe(false);
    expect(canWrite('findings_pending', 'findings')).toBe(true);
  });

  it('refuses recommendations before findings are approved', () => {
    // This is the contamination the gate exists to prevent: a recommendation
    // built on a finding the user has not yet seen or challenged.
    expect(canWrite('findings_pending', 'recommendations')).toBe(false);
    expect(canWrite('recommending', 'recommendations')).toBe(true);
  });

  it('refuses evidence once analysis has begun', () => {
    expect(canWrite('findings_pending', 'evidence')).toBe(false);
  });

  it('writes nothing new once complete', () => {
    expect(canWrite('complete', 'recommendations')).toBe(false);
    expect(canWrite('complete', 'sources')).toBe(false);
  });
});

describe('assertWritable', () => {
  it('throws a LifecycleError naming the stage that would allow the write', () => {
    expect(() => assertWritable('researching', 'recommendations')).toThrow(LifecycleError);
    expect(() => assertWritable('researching', 'recommendations')).toThrow(/recommending/);
  });

  it('stays silent for a legal write', () => {
    expect(() => assertWritable('researching', 'evidence')).not.toThrow();
  });
});

describe('transitions', () => {
  it('advances one step at a time along the happy path', () => {
    expect(isLegalTransition('scope_pending', 'research_plan_pending')).toBe(true);
    expect(isLegalTransition('scope_pending', 'researching')).toBe(false);
  });

  it('never moves backwards', () => {
    expect(isLegalTransition('recommending', 'researching')).toBe(false);
  });

  it('can block from anywhere and resume short of complete', () => {
    expect(isLegalTransition('researching', 'blocked')).toBe(true);
    expect(isLegalTransition('blocked', 'researching')).toBe(true);
    expect(isLegalTransition('blocked', 'complete')).toBe(false);
  });

  it('throws with the legal alternatives listed', () => {
    expect(() => assertTransition('initialized', 'complete')).toThrow(/scope_pending/);
  });
});

describe('gates', () => {
  it('maps stages to gates and back', () => {
    expect(gateForStage('scope_pending')).toBe('scope');
    expect(gateForStage('researching')).toBeNull();
    expect(stageForGate('findings')).toBe('findings_pending');
  });
});

describe('stageThatAllows', () => {
  it('names the first stage a collection may be written in', () => {
    expect(stageThatAllows('sources')).toBe('researching');
    expect(stageThatAllows('feedback')).toBeNull();
  });
});
