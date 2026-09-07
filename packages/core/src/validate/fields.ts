/**
 * Field checking helpers.
 *
 * No schema library, matching the rest of the clearfelt family. That convention
 * was checked rather than defaulted to: unlike the siblings, this project's JSON
 * is written by a reasoning layer and is genuinely untrusted input. But a schema
 * library only solves field shape, which is the easy half. The half that catches
 * broken intelligence is referential integrity, which has to be hand written
 * either way, and hand written checks can name the offending entity id. See
 * docs/decisions/0002-hand-written-validators.md.
 *
 * Every helper pushes onto an issue list rather than throwing, so one pass
 * reports every problem in a run instead of the first one.
 */

export type Severity = 'error' | 'warning';

export interface Issue {
  severity: Severity;
  /** Stable machine-readable code, so a test can assert a specific rule fired. */
  code: string;
  collection: string;
  id?: string;
  field?: string;
  message: string;
}

export interface Ctx {
  collection: string;
  id?: string;
  issues: Issue[];
}

export function ctxFor(collection: string, id: string | undefined, issues: Issue[]): Ctx {
  return { collection, id, issues };
}

export function addIssue(
  ctx: Ctx,
  severity: Severity,
  code: string,
  field: string | undefined,
  message: string,
): void {
  ctx.issues.push({ severity, code, collection: ctx.collection, id: ctx.id, field, message });
}

export function error(ctx: Ctx, code: string, field: string | undefined, message: string): void {
  addIssue(ctx, 'error', code, field, message);
}

export function warn(ctx: Ctx, code: string, field: string | undefined, message: string): void {
  addIssue(ctx, 'warning', code, field, message);
}

/** A loose record view of an unknown value, for reading candidate fields. */
export type Rec = Record<string, unknown>;

export function isRecord(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function requireString(ctx: Ctx, obj: Rec, field: string): void {
  const value = obj[field];
  if (typeof value !== 'string' || value.trim() === '') {
    error(ctx, 'field.string', field, `${field} must be a non-empty string`);
  }
}

export function optionalString(ctx: Ctx, obj: Rec, field: string): void {
  const value = obj[field];
  if (value === undefined || value === null) return;
  if (typeof value !== 'string') {
    error(ctx, 'field.string', field, `${field} must be a string when present`);
  }
}

export function requireNumber(ctx: Ctx, obj: Rec, field: string): void {
  const value = obj[field];
  if (typeof value !== 'number' || Number.isNaN(value)) {
    error(ctx, 'field.number', field, `${field} must be a number`);
  }
}

export function requireBoolean(ctx: Ctx, obj: Rec, field: string): void {
  if (typeof obj[field] !== 'boolean') {
    error(ctx, 'field.boolean', field, `${field} must be a boolean`);
  }
}

export function requireEnum<T extends string>(
  ctx: Ctx,
  obj: Rec,
  field: string,
  allowed: readonly T[],
): void {
  const value = obj[field];
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    error(ctx, 'field.enum', field, `${field} must be one of: ${allowed.join(', ')}`);
  }
}

export function optionalEnum<T extends string>(
  ctx: Ctx,
  obj: Rec,
  field: string,
  allowed: readonly T[],
): void {
  const value = obj[field];
  if (value === undefined || value === null) return;
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    error(ctx, 'field.enum', field, `${field} must be one of: ${allowed.join(', ')} when present`);
  }
}

export function requireStringArray(ctx: Ctx, obj: Rec, field: string): void {
  const value = obj[field];
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
    error(ctx, 'field.string_array', field, `${field} must be an array of strings`);
  }
}

export function optionalStringArray(ctx: Ctx, obj: Rec, field: string): void {
  const value = obj[field];
  if (value === undefined || value === null) return;
  requireStringArray(ctx, obj, field);
}

/**
 * An array of ids that must not be empty.
 *
 * This is where evidence discipline becomes mechanical. A finding with no
 * evidence, or a recommendation with no finding, is a collapsed layer: spec
 * section 5 forbids it, and requiring a non-empty reference list is how the
 * collapse fails to validate instead of quietly shipping.
 */
export function requireNonEmptyIdArray(ctx: Ctx, obj: Rec, field: string): void {
  const value = obj[field];
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
    error(ctx, 'field.string_array', field, `${field} must be an array of ids`);
    return;
  }
  if (value.length === 0) {
    error(ctx, 'field.non_empty', field, `${field} must reference at least one id`);
  }
}

export function requireIsoDate(ctx: Ctx, obj: Rec, field: string): void {
  const value = obj[field];
  if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) {
    error(ctx, 'field.date', field, `${field} must be an ISO 8601 date-time string`);
  }
}

export function optionalIsoDate(ctx: Ctx, obj: Rec, field: string): void {
  const value = obj[field];
  if (value === undefined || value === null) return;
  requireIsoDate(ctx, obj, field);
}

export function requireObject(ctx: Ctx, obj: Rec, field: string): Rec | null {
  const value = obj[field];
  if (!isRecord(value)) {
    error(ctx, 'field.object', field, `${field} must be an object`);
    return null;
  }
  return value;
}

export function errorsOnly(issues: readonly Issue[]): Issue[] {
  return issues.filter((i) => i.severity === 'error');
}

export function formatIssue(issue: Issue): string {
  const where = issue.id ? `${issue.collection}/${issue.id}` : issue.collection;
  const field = issue.field ? ` [${issue.field}]` : '';
  return `${issue.severity.toUpperCase()} ${issue.code} ${where}${field}: ${issue.message}`;
}
