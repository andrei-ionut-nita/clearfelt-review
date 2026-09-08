/**
 * All styling for the HTML report, inlined.
 *
 * No external stylesheet and no CDN: the report is a single file that has to
 * keep working when emailed, opened from a USB stick, or read on a machine with
 * no network. That constraint is also why there is no framework here.
 *
 * Colours are defined as tokens on bare :root and redefined for dark mode, so
 * a reader's system preference is respected without a toggle to forget.
 *
 * Spacing, type size and radius are also tokens (a 4px-based spacing scale,
 * a small type scale) rather than the ad hoc per-rule values this file used
 * to carry, so nothing downstream has to guess what "a bit more padding"
 * means.
 */
export const STYLES = `
:root {
  --bg: #fbfbfa;
  --surface: #ffffff;
  --surface-sunk: #f4f4f2;
  --border: #e2e1dd;
  --border-strong: #c9c7c1;
  --text: #1a1a18;
  --text-muted: #605e58;
  --text-faint: #726f68;
  --accent: #1f4f43;
  --accent-soft: #e6efec;
  --warn: #8a5a12;
  --warn-soft: #fbf1de;
  --alert: #8c2f2f;
  --alert-soft: #f9eaea;
  --p0: #8c2f2f;
  --p1: #8a5a12;
  --p2: #1f4f43;
  --p3: #605e58;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  --sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;

  /* Spacing scale, 4px base. */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --space-8: 64px;

  /* Type scale. */
  --text-xs: 11.5px;
  --text-sm: 13px;
  --text-base: 15px;
  --text-md: 15.5px;
  --text-lg: 16px;
  --text-xl: 19px;
  --text-2xl: 24px;
  --text-3xl: 34px;

  --radius-sm: 5px;
  --radius-md: 8px;
  --radius-lg: 10px;

  --shadow-panel: -8px 0 32px rgba(0, 0, 0, 0.10);
  --focus-ring: 2px solid var(--accent);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #16161a;
    --surface: #1e1e23;
    --surface-sunk: #26262c;
    --border: #33333a;
    --border-strong: #4a4a53;
    --text: #ececee;
    --text-muted: #a8a6a0;
    --text-faint: #98958c;
    --accent: #7cc0ac;
    --accent-soft: #1d2f2a;
    --warn: #d9a648;
    --warn-soft: #322a18;
    --alert: #e08585;
    --alert-soft: #331e1e;
    --p0: #e08585;
    --p1: #d9a648;
    --p2: #7cc0ac;
    --p3: #a8a6a0;
    --shadow-panel: -8px 0 32px rgba(0, 0, 0, 0.5);
  }
}

/* An explicit choice from the toggle wins over the OS preference in either
   direction, set by script.ts as a data-theme attribute on <html>. Absent
   that attribute, the block above still drives dark mode from the system
   setting, so a reader who never touches the toggle keeps following it live,
   including a live OS theme change while the page stays open. */
:root[data-theme="dark"] {
  --bg: #16161a;
  --surface: #1e1e23;
  --surface-sunk: #26262c;
  --border: #33333a;
  --border-strong: #4a4a53;
  --text: #ececee;
  --text-muted: #a8a6a0;
  --text-faint: #98958c;
  --accent: #7cc0ac;
  --accent-soft: #1d2f2a;
  --warn: #d9a648;
  --warn-soft: #322a18;
  --alert: #e08585;
  --alert-soft: #331e1e;
  --p0: #e08585;
  --p1: #d9a648;
  --p2: #7cc0ac;
  --p3: #a8a6a0;
  --shadow-panel: -8px 0 32px rgba(0, 0, 0, 0.5);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  font-size: var(--text-base);
  line-height: 1.6;
}

/* Skip link: first focusable thing on the page, invisible until tabbed to. */
.skip-link {
  position: absolute;
  top: -48px;
  left: var(--space-3);
  z-index: 60;
  background: var(--accent);
  color: var(--bg);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: 600;
  transition: top 120ms ease;
}
.skip-link:focus { top: var(--space-3); }

/* Reading progress: a thin fixed bar tracking scroll position through the
   document. This report can run long, and nothing else on the page tells a
   reader how much is left. Purely visual: no motion is introduced beyond the
   width already implied by scroll position, so it needs no reduced-motion
   guard of its own. */
.progress-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 3px;
  z-index: 25;
  background: transparent;
}
.progress-bar .progress-fill {
  height: 100%;
  width: 0%;
  background: var(--accent);
}

/* Top-right controls, grouped so the theme toggle and the P0 shortcut share
   one reachable cluster regardless of scroll position. z-index sits below
   the backdrop/panel on purpose: while the drill-down dialog is open,
   nothing behind it should be reachable, this included. */
.corner-controls {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* JS-only (see .js-only below): a shortcut that does nothing is worse than
   none, so it stays hidden with JavaScript disabled. */
.jump-p0 {
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--p0);
  background: var(--alert-soft);
  color: var(--p0);
  text-decoration: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.jump-p0:hover { text-decoration: underline; }

.theme-toggle {
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}
.theme-toggle:hover { border-color: var(--accent); color: var(--accent); }

:focus-visible { outline: var(--focus-ring); outline-offset: 2px; }

.layout { display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 0; }

nav.sidebar {
  position: sticky;
  top: 0;
  align-self: start;
  height: 100vh;
  overflow-y: auto;
  padding: var(--space-5) var(--space-4);
  border-right: 1px solid var(--border);
  background: var(--surface);
}
nav.sidebar .brand { font-size: var(--text-base); font-weight: 600; margin: 0 0 var(--space-1); letter-spacing: -0.01em; color: var(--text-muted); }
nav.sidebar .subject { font-size: var(--text-sm); color: var(--text-muted); margin-bottom: var(--space-5); }

/* The page's real title: who or what was reviewed, unmissable at the top of
   the body itself, not only in <title> or tucked into the sidebar. */
.report-header { margin: 0 0 var(--space-6); }
.report-header .eyebrow {
  margin: 0 0 var(--space-1);
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--accent);
}
.report-header h1 {
  margin: 0 0 var(--space-2);
  font-size: var(--text-3xl);
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.report-header .report-meta {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--text-muted);
}
.report-header .report-meta a { color: var(--text-muted); }
nav.sidebar .nav-group-label {
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-faint);
  margin: var(--space-4) 0 var(--space-1);
  padding: 0 var(--space-2);
}
nav.sidebar .nav-group-label:first-of-type { margin-top: 0; }
nav.sidebar a {
  display: block;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  text-decoration: none;
  font-size: var(--text-sm);
}
/* Indented so a link reads as its group label's child, not a peer of it. */
nav.sidebar a.nav-child { padding-left: calc(10px + var(--space-3)); }
nav.sidebar a:hover { background: var(--surface-sunk); color: var(--text); }
nav.sidebar a.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }

/* main stretches and an inner wrapper does the centring. Putting max-width and
   justify-self on the grid item itself switches it to fit-content sizing, which
   sizes to content on a narrow viewport and scrolls the page sideways.
   min-width: 0 stops a wide table blowing the grid column out. */
main { min-width: 0; padding: var(--space-7) var(--space-6) 120px; }
main > .wrap { max-width: 1200px; margin: 0 auto; }
main:focus { outline: none; }
section { margin-bottom: var(--space-8); scroll-margin-top: var(--space-5); }
section > h2 {
  font-size: var(--text-2xl);
  margin: 0 0 var(--space-1);
  letter-spacing: -0.02em;
}
section > .lede { color: var(--text-muted); margin: 0 0 var(--space-5); font-size: var(--text-sm); }

h3 { font-size: var(--text-lg); margin: var(--space-6) 0 var(--space-2); }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-4);
  margin-bottom: var(--space-3);
}
.card h4 { margin: 0 0 var(--space-2); font-size: var(--text-md); }
.card p { margin: 0 0 var(--space-3); max-width: 68ch; }
.card p:last-child { margin-bottom: 0; }

/* Card type, legible in peripheral vision while scrolling a long list, not
   only on close reading of the h4 and prose. A recommendation's priority
   band (already computed, already shown as a .tag) overrides its kind
   colour, since priority is the more useful signal there; a contested
   finding overrides both, since a reader should never scan past that. */
.card[data-kind="finding"] { border-left-color: var(--accent); }
.card[data-kind="opportunity"] { border-left-color: var(--warn); }
.card[data-kind="evidence"] { border-left-color: var(--border-strong); }
.card[data-kind="action"] { border-left-color: var(--text-faint); }
.card[data-priority="P0"] { border-left-color: var(--p0); }
.card[data-priority="P1"] { border-left-color: var(--p1); }
.card[data-priority="P2"] { border-left-color: var(--p2); }
.card[data-priority="P3"] { border-left-color: var(--p3); }
.card[data-contested="true"] { border-left-color: var(--alert); }

/* Card grid: dense, similarly-sized cards (stat-like findings, top
   priorities, opportunities) laid out to use a wide viewport instead of
   stacking one per row. Prose-heavy sections (full Findings, Evidence,
   Recommendations) stay single-column at a readable measure, unaffected. */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--space-3);
  align-items: start;
}
.card-grid .card { margin-bottom: 0; }

/* The ask: what a recommendation wants the reader to do, set apart from the
   rationale prose around it so it reads first. */
.card p.ask { font-size: var(--text-md); font-weight: 500; }

.meta { font-size: var(--text-sm); color: var(--text-muted); }
.meta strong { color: var(--text); font-weight: 600; }

/* Id chips are the drill-down affordance. Every id in the report is one, so
   "why are you telling me this" is always one click away. */
.chip {
  display: inline-block;
  font-family: var(--mono);
  font-size: var(--text-xs);
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  background: var(--surface-sunk);
  border: 1px solid var(--border);
  color: var(--text-muted);
  cursor: pointer;
  text-decoration: none;
}
.chip:hover { border-color: var(--accent); color: var(--accent); }

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-sm);
  background: var(--surface-sunk);
  color: var(--text-muted);
}
/* An inference must not look like an observation anywhere in the report. */
.tag.inferred { background: var(--warn-soft); color: var(--warn); }
.tag.hypothesis { background: var(--warn-soft); color: var(--warn); }
.tag.contested { background: var(--alert-soft); color: var(--alert); }
.tag.absence { background: var(--warn-soft); color: var(--warn); }

/* Priority tags carry a glyph as well as a colour, so P0 is not distinguished
   from P3 by hue alone: a reader with a colour-vision deficiency still gets a
   distinct cue. */
.tag.p0 { background: var(--alert-soft); color: var(--p0); }
.tag.p0::before { content: "\\25A0"; }
.tag.p1 { background: var(--warn-soft); color: var(--p1); }
.tag.p1::before { content: "\\25B2"; }
.tag.p2 { background: var(--accent-soft); color: var(--p2); }
.tag.p2::before { content: "\\25CF"; }
.tag.p3 { background: var(--surface-sunk); color: var(--p3); }
.tag.p3::before { content: "\\25CB"; }

/* Quality severities, reused for action status badges. */
.tag.warn { background: var(--alert-soft); color: var(--alert); }
.tag.todo { background: var(--surface-sunk); color: var(--text-muted); }
.tag.in_progress { background: var(--warn-soft); color: var(--warn); }
.tag.done { background: var(--accent-soft); color: var(--accent); }
.tag.dropped { background: var(--surface-sunk); color: var(--text-faint); text-decoration: line-through; }

.callout {
  border-left: 3px solid var(--warn);
  background: var(--warn-soft);
  padding: var(--space-2) var(--space-4);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  margin: var(--space-2) 0;
  font-size: var(--text-sm);
}
.callout.alert { border-left-color: var(--alert); background: var(--alert-soft); }

/* Hero: the executive-summary callout at the top of Overview. Same callout
   language as the rest of the report, sized up, so it reads as the headline
   without introducing a new visual vocabulary. */
.hero {
  border-left: 4px solid var(--accent);
  background: var(--accent-soft);
  padding: var(--space-4) var(--space-5);
  border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
  margin: var(--space-4) 0 var(--space-5);
}
.hero p { margin: 0 0 var(--space-1); font-size: var(--text-lg); color: var(--text); }
.hero p:last-child { margin-bottom: 0; }

/* Hero as three scannable cells rather than stacked prose: a headline count,
   the one recommendation to read first, and the open-risk count, each
   legible without reading a full sentence. */
.hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-5);
}
.hero-cell .n { font-size: var(--text-3xl); font-weight: 650; letter-spacing: -0.02em; line-height: 1.1; }
.hero-cell .l { font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin: 2px 0 var(--space-1); }
.hero-cell .meta { margin: 0; }
.hero-top .hero-link { display: block; font-size: var(--text-lg); font-weight: 600; color: var(--text); text-decoration: none; margin-bottom: 2px; }
.hero-top .hero-link:hover { color: var(--accent); text-decoration: underline; }
.hero-summary { margin: var(--space-3) 0 0; }

table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); margin: var(--space-3) 0; }
th, td { text-align: left; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--border); vertical-align: top; }
th { font-weight: 600; color: var(--text-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
.scroll-x { overflow-x: auto; }

pre {
  font-family: var(--mono);
  font-size: 12.5px;
  line-height: 1.55;
  background: var(--surface-sunk);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-4);
  overflow-x: auto;
}

/* Native disclosure, used to collapse the more verbose parts of a card by
   default (evidence detail, a derived finding's supporting chain). Works
   with JavaScript disabled: the browser owns open/close. */
details { margin-top: var(--space-2); }
details > summary {
  cursor: pointer;
  font-size: var(--text-sm);
  color: var(--text-muted);
  list-style: none;
}
details > summary::-webkit-details-marker { display: none; }
details > summary::before { content: "\\25B8"; display: inline-block; width: 1em; }
details[open] > summary::before { content: "\\25BE"; }
details > summary:focus-visible { outline: var(--focus-ring); outline-offset: 2px; border-radius: var(--radius-sm); }
details .disclosure-body { padding-top: var(--space-2); }

/* Priority meter: the score as a proportion of its ceiling, next to the
   rationale sentence that already explains it in words. The bar never
   replaces the sentence, only makes it faster to scan. */
.meter { display: flex; align-items: center; gap: var(--space-2); margin: var(--space-1) 0 var(--space-2); }
.meter .track { flex: 0 0 120px; height: 6px; border-radius: 3px; background: var(--surface-sunk); overflow: hidden; }
.meter .fill { height: 100%; background: var(--p2); }
.meter[data-band="P0"] .fill { background: var(--p0); }
.meter[data-band="P1"] .fill { background: var(--p1); }
.meter[data-band="P2"] .fill { background: var(--p2); }
.meter[data-band="P3"] .fill { background: var(--p3); }
.meter .label { font-size: var(--text-xs); color: var(--text-muted); }

/* Priority distribution, coverage-by-module: existing counts re-encoded as a
   proportional bar rather than a new computation. */
.dist { display: flex; gap: var(--space-1); margin: var(--space-3) 0; height: 10px; border-radius: 5px; overflow: hidden; }
.dist .seg { height: 100%; }
.dist .seg.p0 { background: var(--p0); }
.dist .seg.p1 { background: var(--p1); }
.dist .seg.p2 { background: var(--p2); }
.dist .seg.p3 { background: var(--p3); }
.dist-legend { display: flex; flex-wrap: wrap; gap: var(--space-4); font-size: var(--text-xs); color: var(--text-muted); margin-bottom: var(--space-4); }
.dist-legend .sw { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 4px; vertical-align: middle; }
.dist-legend .sw.p0 { background: var(--p0); }
.dist-legend .sw.p1 { background: var(--p1); }
.dist-legend .sw.p2 { background: var(--p2); }
.dist-legend .sw.p3 { background: var(--p3); }

.bar { display: inline-block; width: 80px; height: 6px; border-radius: 3px; background: var(--surface-sunk); overflow: hidden; vertical-align: middle; margin-right: var(--space-2); }
.bar .fill { height: 100%; background: var(--accent); }

/* Saturation heat visual: territory x saturation, coloured by intensity. A
   re-encoding of the same rows already printed as a table above it. */
.heat { display: flex; flex-direction: column; gap: var(--space-1); margin: var(--space-3) 0 var(--space-4); }
.heat-row { display: grid; grid-template-columns: 1fr 160px; align-items: center; gap: var(--space-3); font-size: var(--text-sm); }
.heat-row .swatch { height: 20px; border-radius: var(--radius-sm); display: flex; align-items: center; padding: 0 var(--space-2); font-size: var(--text-xs); color: var(--bg); font-weight: 600; }
.heat-row .swatch.very_high { background: var(--p0); }
.heat-row .swatch.high { background: var(--p1); }
.heat-row .swatch.medium { background: var(--p2); }
.heat-row .swatch.low { background: var(--p3); }

/* Opportunity map: specification section 26, as a real grid rather than a
   picture, so each recommendation sits in a quadrant a reader can click. */
.matrix { display: grid; grid-template-columns: 90px 1fr 1fr; grid-template-rows: auto 1fr 1fr auto; gap: var(--space-2); margin: var(--space-4) 0; }
.matrix .axis { display: flex; align-items: center; justify-content: center; font-size: var(--text-xs); color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.05em; }
.matrix .axis.v { writing-mode: vertical-rl; transform: rotate(180deg); }
.quad { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-3); min-height: 110px; }
.quad h5 { margin: 0 0 var(--space-2); font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-faint); }
.quad .item { font-size: var(--text-sm); margin-bottom: var(--space-1); }

/* Filter bar: enhancement only. With JavaScript disabled these toggles do
   nothing and every card underneath stays visible, which is the safe
   default; script.ts only ever narrows an already-complete view. */
.filter-bar { display: flex; flex-wrap: wrap; gap: var(--space-2); margin: var(--space-3) 0 var(--space-4); }
.filter-chip {
  font-family: var(--sans);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
}
.filter-chip[aria-pressed="true"] { background: var(--accent-soft); border-color: var(--accent); color: var(--accent); }
.filter-chip:focus-visible { outline: var(--focus-ring); outline-offset: 2px; }
.js-only { display: none; }
.js .js-only { display: flex; }

/* Drill-down panel. The reverse walk is what lets a reader ask what a source
   actually changed, not just why a recommendation exists. */
#panel {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: min(520px, 92vw);
  background: var(--surface);
  border-left: 1px solid var(--border-strong);
  box-shadow: var(--shadow-panel);
  padding: var(--space-5) 26px 60px;
  overflow-y: auto;
  transform: translateX(100%);
  z-index: 40;
}
@media (prefers-reduced-motion: no-preference) {
  #panel { transition: transform 160ms ease; }
  .backdrop { transition: opacity 160ms ease; }
}
#panel.open { transform: translateX(0); }
#panel .close { position: absolute; top: var(--space-4); right: 18px; border: 1px solid var(--border); background: var(--surface-sunk); color: var(--text-muted); border-radius: var(--radius-sm); cursor: pointer; font-size: var(--text-sm); padding: 3px 9px; }
#panel h3 { margin-top: 0; }
#panel h4 { margin: 22px 0 var(--space-2); font-size: var(--text-sm); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-faint); }
#panel .tree { font-family: var(--mono); font-size: 12px; white-space: pre-wrap; line-height: 1.7; }
#panel .tree .node { cursor: pointer; }
#panel .tree .node:hover { color: var(--accent); text-decoration: underline; }

.backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.28); opacity: 0; pointer-events: none; z-index: 30; }
.backdrop.open { opacity: 1; pointer-events: auto; }

.stat-row { display: flex; flex-wrap: wrap; gap: var(--space-2); margin: var(--space-4) 0 var(--space-5); }
.stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-2) var(--space-4); min-width: 108px; }
.stat .n { font-size: var(--text-xl); font-weight: 650; letter-spacing: -0.02em; }
.stat .l { font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }

@media (max-width: 1100px) {
  main { padding: var(--space-6) var(--space-5) 100px; }
  nav.sidebar { padding: var(--space-4) var(--space-3); }
}

@media (max-width: 820px) {
  .layout { grid-template-columns: 1fr; }
  nav.sidebar { position: static; height: auto; border-right: none; border-bottom: 1px solid var(--border); }
  nav.sidebar a { padding: 10px 12px; }
  main { padding: var(--space-5) var(--space-4) 100px; }
  .matrix { grid-template-columns: 1fr; grid-template-rows: none; }
  .matrix .axis { display: none; }
  .heat-row { grid-template-columns: 1fr; }
}

@media print {
  .skip-link, nav.sidebar, #panel, .backdrop, .filter-bar, .corner-controls, .progress-bar { display: none !important; }
  .layout { display: block; }
  main { padding: 0; }
  main > .wrap { max-width: none; }
  details > summary { display: none; }
  details .disclosure-body, details > *:not(summary) { display: block !important; }
  .chip {
    color: inherit;
    background: none;
    border: none;
    padding: 0;
    text-decoration: none;
    font-family: var(--mono);
  }
  .card, tr, .quad { break-inside: avoid; }
  h2, h3, h4 { break-after: avoid; }
  a[href]::after { content: ""; }
}
`;
