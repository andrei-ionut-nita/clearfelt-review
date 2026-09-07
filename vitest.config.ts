import { defineConfig } from 'vitest/config';

// Tests live beside the source they cover, matching clearfelt-slide. The include
// glob is package-scoped rather than repo-wide so a stray test file under
// fixtures/ cannot silently join the suite.
export default defineConfig({
  test: { include: ['packages/*/src/**/*.test.ts'] },
});
