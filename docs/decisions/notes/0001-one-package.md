# 0001. One package rather than a core and cli split

Date: 2026-09-07

`clearfelt-diagram` and `clearfelt-slide` both ship a separate `cli` package. In both cases that package is a **scaffolder**: it copies a `template/` directory into a user's repository, which is a genuinely different job from the engine's.

This project has nothing to scaffold. `packages/core` carries the `clearfelt-review` bin directly, the way `@clearfelt/diagram-engine` does for its own commands.

This changes if the product ever ships something a user initialises into their own repository, at which point a `packages/cli` with a `template/` earns its place. Adding a package before then would be structure without a job.
