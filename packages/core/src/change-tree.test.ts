import { describe, expect, it } from 'vitest';
import { buildChangeTree, findNode, renderChangeTreeAscii } from './change-tree.ts';
import { makeAction, makeAsset, makeRecommendation, makeValidReview } from './testing/factory.ts';

describe('buildChangeTree', () => {
  it('derives a website tree from an action targeting a page section', () => {
    const tree = buildChangeTree(makeValidReview());
    expect(tree.roots).toHaveLength(1);
    const root = tree.roots[0];
    expect(root?.label).toBe('WEBSITE');
    // '/' becomes 'index' so the node has something to render.
    expect(root?.children[0]?.label).toBe('index');
    expect(root?.children[0]?.children[0]?.label).toBe('hero');
    expect(root?.children[0]?.children[0]?.operation).toBe('edit');
  });

  it('carries the traceability chain onto every node', () => {
    // Spec section 29: selecting a node must expose the action, recommendation,
    // finding and evidence behind it. Without this the tree is decoration.
    const tree = buildChangeTree(makeValidReview());
    const leaf = findNode(tree, 'WEBSITE/index/hero');
    expect(leaf?.action_ids).toEqual(['A-0001']);
    expect(leaf?.recommendation_ids).toEqual(['R-0001']);
    expect(leaf?.finding_ids).toEqual(['F-0001']);
    expect(leaf?.evidence_ids).toEqual(['E-0001']);
  });

  it('rolls descendant traceability up to ancestors', () => {
    const tree = buildChangeTree(makeValidReview());
    expect(findNode(tree, 'WEBSITE')?.evidence_ids).toEqual(['E-0001']);
  });

  it('works for a subject that is not a website', () => {
    // A tree that only renders pages is a website auditor with extra steps.
    const review = makeValidReview({
      assets: [makeAsset({ id: 'AST-0002', type: 'positioning', path: 'Executive narrative' })],
      actions: [
        makeAction({
          affected_assets: [{ asset_id: 'AST-0002', operation: 'edit' }],
        }),
      ],
    });
    const tree = buildChangeTree(review);
    expect(tree.roots[0]?.label).toBe('POSITIONING');
    expect(tree.roots[0]?.children[0]?.label).toBe('Executive narrative');
  });

  it('places a proposed new asset without needing it to exist first', () => {
    const review = makeValidReview({
      actions: [
        makeAction({
          affected_assets: [
            { operation: 'new', proposed: { type: 'website_page', path: '/advisory' } },
          ],
        }),
      ],
    });
    const tree = buildChangeTree(review);
    expect(findNode(tree, 'WEBSITE/advisory')?.operation).toBe('new');
  });

  it('groups several asset types into separate roots', () => {
    const review = makeValidReview({
      assets: [makeAsset(), makeAsset({ id: 'AST-0002', type: 'positioning', path: 'Narrative' })],
      recommendations: [makeRecommendation()],
      actions: [
        makeAction(),
        makeAction({
          id: 'A-0002',
          affected_assets: [{ asset_id: 'AST-0002', operation: 'edit' }],
        }),
      ],
    });
    const tree = buildChangeTree(review);
    expect(tree.roots.map((r) => r.label)).toEqual(['POSITIONING', 'WEBSITE']);
  });

  it('drops an action pointing at an asset that does not exist', () => {
    // validate rejects this first. Reaching here means validation was skipped,
    // and dropping the node beats inventing a plausible looking one.
    const review = makeValidReview({
      actions: [makeAction({ affected_assets: [{ asset_id: 'AST-9999', operation: 'edit' }] })],
    });
    expect(buildChangeTree(review).roots).toEqual([]);
  });

  it('is stable across rebuilds', () => {
    const review = makeValidReview();
    expect(JSON.stringify(buildChangeTree(review))).toBe(JSON.stringify(buildChangeTree(review)));
  });
});

describe('renderChangeTreeAscii', () => {
  it('renders the spec section 28 shape', () => {
    const output = renderChangeTreeAscii(buildChangeTree(makeValidReview()));
    expect(output).toBe(['WEBSITE/', '└── index', '    └── [EDIT] hero'].join('\n'));
  });

  it('uses no arrow or em-dash characters', () => {
    const output = renderChangeTreeAscii(buildChangeTree(makeValidReview()));
    expect(output).not.toMatch(/[\u2014\u2192\u2190]/);
  });
});
