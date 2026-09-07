/**
 * Public surface of @clearfelt-review/core.
 *
 * The model and the deterministic derivations are exported; the CLI is not,
 * because it is a shell around these and importing it would invite a second
 * caller with different error handling.
 */

export * from './model/index.ts';
export * from './ids.ts';
export * from './lifecycle.ts';
export * from './store.ts';
export * from './validate/index.ts';
export * from './quality/index.ts';
export * from './prioritise.ts';
export * from './change-tree.ts';
export * from './comparison-synthesis.ts';
export * from './diff.ts';
export * from './modules/registry.ts';
export * from './coverage.ts';
export * from './trace.ts';
