/**
 * All styling for the HTML report, inlined.
 *
 * No external stylesheet and no CDN: the report is a single file that has to
 * keep working when emailed, opened from a USB stick, or read on a machine with
 * no network. That constraint is also why there is no framework here.
 *
 * Colours are defined as tokens on bare :root and redefined for dark mode, so
 * a reader's system preference is respected without a toggle to forget.
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
  --text-faint: #8a8880;
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
    --text-faint: #7d7b76;
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
  }
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  font-size: 15px;
  line-height: 1.6;
}

.layout { display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 0; }

nav.sidebar {
  position: sticky;
  top: 0;
  align-self: start;
  height: 100vh;
  overflow-y: auto;
  padding: 24px 16px;
  border-right: 1px solid var(--border);
  background: var(--surface);
}
nav.sidebar h1 { font-size: 15px; margin: 0 0 4px; letter-spacing: -0.01em; }
nav.sidebar .subject { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; }
nav.sidebar a {
  display: block;
  padding: 6px 10px;
  border-radius: 6px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 13.5px;
}
nav.sidebar a:hover { background: var(--surface-sunk); color: var(--text); }
nav.sidebar a.active { background: var(--accent-soft); color: var(--accent); font-weight: 600; }

/* main stretches and an inner wrapper does the centring. Putting max-width and
   justify-self on the grid item itself switches it to fit-content sizing, which
   sizes to content on a narrow viewport and scrolls the page sideways.
   min-width: 0 stops a wide table blowing the grid column out. */
main { min-width: 0; padding: 40px 48px 120px; }
main > .wrap { max-width: 900px; margin: 0 auto; }
section { margin-bottom: 56px; scroll-margin-top: 24px; }
section > h2 {
  font-size: 22px;
  margin: 0 0 4px;
  letter-spacing: -0.02em;
}
section > .lede { color: var(--text-muted); margin: 0 0 20px; font-size: 14px; }

h3 { font-size: 16px; margin: 28px 0 8px; }

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px 18px;
  margin-bottom: 12px;
}
.card h4 { margin: 0 0 6px; font-size: 15.5px; }
.card p { margin: 0 0 10px; }
.card p:last-child { margin-bottom: 0; }

.meta { font-size: 13px; color: var(--text-muted); }
.meta strong { color: var(--text); font-weight: 600; }

/* Id chips are the drill-down affordance. Every id in the report is one, so
   "why are you telling me this" is always one click away. */
.chip {
  display: inline-block;
  font-family: var(--mono);
  font-size: 11.5px;
  padding: 1px 6px;
  border-radius: 5px;
  background: var(--surface-sunk);
  border: 1px solid var(--border);
  color: var(--text-muted);
  cursor: pointer;
  text-decoration: none;
}
.chip:hover { border-color: var(--accent); color: var(--accent); }

.tag {
  display: inline-block;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 5px;
  background: var(--surface-sunk);
  color: var(--text-muted);
}
/* An inference must not look like an observation anywhere in the report. */
.tag.inferred { background: var(--warn-soft); color: var(--warn); }
.tag.hypothesis { background: var(--warn-soft); color: var(--warn); }
.tag.contested { background: var(--alert-soft); color: var(--alert); }
.tag.absence { background: var(--warn-soft); color: var(--warn); }
.tag.p0 { background: var(--alert-soft); color: var(--p0); }
.tag.p1 { background: var(--warn-soft); color: var(--p1); }
.tag.p2 { background: var(--accent-soft); color: var(--p2); }
.tag.p3 { background: var(--surface-sunk); color: var(--p3); }

.callout {
  border-left: 3px solid var(--warn);
  background: var(--warn-soft);
  padding: 10px 14px;
  border-radius: 0 8px 8px 0;
  margin: 10px 0;
  font-size: 13.5px;
}
.callout.alert { border-left-color: var(--alert); background: var(--alert-soft); }

table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin: 12px 0; }
th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border); vertical-align: top; }
th { font-weight: 600; color: var(--text-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; }
.scroll-x { overflow-x: auto; }

pre {
  font-family: var(--mono);
  font-size: 12.5px;
  line-height: 1.55;
  background: var(--surface-sunk);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 14px 16px;
  overflow-x: auto;
}

/* Opportunity map: specification section 26, as a real grid rather than a
   picture, so each recommendation sits in a quadrant a reader can click. */
.matrix { display: grid; grid-template-columns: 90px 1fr 1fr; grid-template-rows: auto 1fr 1fr auto; gap: 6px; margin: 16px 0; }
.matrix .axis { display: flex; align-items: center; justify-content: center; font-size: 11.5px; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.05em; }
.matrix .axis.v { writing-mode: vertical-rl; transform: rotate(180deg); }
.quad { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px; min-height: 110px; }
.quad h5 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-faint); }
.quad .item { font-size: 13px; margin-bottom: 6px; }

/* Drill-down panel. The reverse walk is what lets a reader ask what a source
   actually changed, not just why a recommendation exists. */
#panel {
  position: fixed;
  top: 0; right: 0; bottom: 0;
  width: min(520px, 92vw);
  background: var(--surface);
  border-left: 1px solid var(--border-strong);
  box-shadow: -8px 0 32px rgba(0,0,0,0.10);
  padding: 24px 26px 60px;
  overflow-y: auto;
  transform: translateX(100%);
  transition: transform 160ms ease;
  z-index: 40;
}
#panel.open { transform: translateX(0); }
#panel .close { position: absolute; top: 16px; right: 18px; border: 1px solid var(--border); background: var(--surface-sunk); color: var(--text-muted); border-radius: 6px; cursor: pointer; font-size: 13px; padding: 3px 9px; }
#panel h3 { margin-top: 0; }
#panel h4 { margin: 22px 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-faint); }
#panel .tree { font-family: var(--mono); font-size: 12px; white-space: pre-wrap; line-height: 1.7; }
#panel .tree .node { cursor: pointer; }
#panel .tree .node:hover { color: var(--accent); text-decoration: underline; }

.backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.28); opacity: 0; pointer-events: none; transition: opacity 160ms ease; z-index: 30; }
.backdrop.open { opacity: 1; pointer-events: auto; }

.stat-row { display: flex; flex-wrap: wrap; gap: 10px; margin: 16px 0 24px; }
.stat { background: var(--surface); border: 1px solid var(--border); border-radius: 9px; padding: 10px 14px; min-width: 108px; }
.stat .n { font-size: 21px; font-weight: 650; letter-spacing: -0.02em; }
.stat .l { font-size: 11.5px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; }

@media (max-width: 820px) {
  .layout { grid-template-columns: 1fr; }
  nav.sidebar { position: static; height: auto; border-right: none; border-bottom: 1px solid var(--border); }
  main { padding: 24px 20px 100px; }
  .matrix { grid-template-columns: 1fr; grid-template-rows: none; }
  .matrix .axis { display: none; }
}
`;
