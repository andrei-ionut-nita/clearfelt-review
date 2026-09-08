import { renderChangeTreeAscii } from '../../change-tree.ts';
import type { Level, Opportunity } from '../../model/index.ts';
import { QUADRANT_LABELS, type Quadrant } from '../../prioritise.ts';
import type { ReviewView } from '../view.ts';
import { SCRIPT } from './script.ts';
import { STYLES } from './styles.ts';

/**
 * The interactive HTML report.
 *
 * A single self-contained file: no CDN, no external stylesheet, no build step
 * for assets. The report has to keep working when emailed, opened from a USB
 * stick, or read offline, and a report that needs a network to explain itself
 * is not an artifact you can hand to someone.
 *
 * The model travels with the page as a JSON island so the drill-down can walk
 * the traceability graph in both directions. Section content is rendered here
 * rather than in the browser, so the page still reads with JavaScript disabled;
 * only the drill-down needs it.
 */

function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Every id in the report is a chip, so drill-down is always one click away. */
function chip(id: string): string {
  return `<a class="chip" data-id="${esc(id)}" href="#">${esc(id)}</a>`;
}

function chips(ids: readonly string[]): string {
  return ids.map(chip).join(' ');
}

function tag(text: string, kind = ''): string {
  return `<span class="tag ${kind}">${esc(text)}</span>`;
}

function levelRank(level: Level): number {
  return level === 'high' ? 3 : level === 'medium' ? 2 : 1;
}

const NAV = [
  ['overview', 'Overview'],
  ['context', 'Context'],
  ['comparison', 'Comparison'],
  ['findings', 'Findings'],
  ['opportunities', 'Opportunities'],
  ['recommendations', 'Recommendations'],
  ['roadmap', 'Roadmap'],
  ['changes', 'Change tree'],
  ['evidence', 'Evidence'],
  ['limits', 'What we do not know'],
  ['quality', 'How this checks out'],
] as const;

export function renderHtml(view: ReviewView): string {
  const { review } = view;
  const subject = review.entities.find((e) => e.role === 'subject');
  const title = `Clearfelt Review: ${subject?.name ?? review.run.slug}`;

  // Only what the drill-down needs. Sending the whole run would bloat the file
  // with research-log entries nothing in the page reads.
  const island = {
    recommendations: review.recommendations,
    actions: review.actions,
    findings: review.findings,
    opportunities: review.opportunities,
    evidence: review.evidence,
    observations: review.observations,
    sources: review.sources,
    assumptions: review.assumptions,
    comparisons: review.comparisons,
    unknowns: review.unknowns,
    hypotheses: review.hypotheses,
    user_assertions: review.user_assertions,
    entities: review.entities,
    assets: review.assets,
    research_questions: review.research_questions,
    priorities: view.priorities,
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>${STYLES}</style>
</head>
<body>
<div class="layout">
<nav class="sidebar">
  <h1>Clearfelt Review</h1>
  <div class="subject">${esc(subject?.name ?? review.run.slug)}</div>
  ${NAV.map(([id, label]) => `<a href="#${id}">${esc(label)}</a>`).join('\n  ')}
</nav>
<main>
<div class="wrap">
${overview(view)}
${context(view)}
${comparison(view)}
${findings(view)}
${opportunities(view)}
${recommendations(view)}
${roadmap(view)}
${changes(view)}
${evidence(view)}
${limits(view)}
${quality(view)}
</div>
</main>
</div>
<div class="backdrop" id="backdrop"></div>
<aside id="panel"><button class="close" id="panel-close">Close</button><div id="panel-body"></div></aside>
<script type="application/json" id="review-data">${JSON.stringify(island).replace(/</g, '\\u003c')}</script>
<script>${SCRIPT}</script>
</body>
</html>
`;
}

function overview(view: ReviewView): string {
  const { review, coverage } = view;
  const scope = review.scope;
  const top = view.priorities.slice(0, 3);
  const topFindings = [...review.findings]
    .sort((a, b) => levelRank(b.importance) - levelRank(a.importance))
    .slice(0, 5);

  return `<section id="overview">
<h2>Overview</h2>
<p class="lede">Run ${esc(review.run.id)}, ${esc(review.run.created_at.slice(0, 10))}.</p>
${scope ? `<div class="card"><h4>The decision this supports</h4><p>${esc(scope.decision.statement)}</p><p class="meta"><strong>Objective.</strong> ${esc(scope.objective)}</p></div>` : ''}
<div class="stat-row">
  <div class="stat"><div class="n">${review.findings.length}</div><div class="l">Findings</div></div>
  <div class="stat"><div class="n">${review.recommendations.length}</div><div class="l">Recommendations</div></div>
  <div class="stat"><div class="n">${review.evidence.length}</div><div class="l">Evidence</div></div>
  <div class="stat"><div class="n">${coverage.totals.independent_sources}</div><div class="l">Independent sources</div></div>
  <div class="stat"><div class="n">${coverage.totals.unresolved}</div><div class="l">Unresolved</div></div>
</div>
<h3>Current position</h3>
${topFindings
  .map(
    (f) => `<div class="card">
  <h4>${esc(f.title)} ${f.claim_type === 'inferred' ? tag('inferred', 'inferred') : ''} ${f.contradicted_by.length > 0 ? tag('contested', 'contested') : ''}</h4>
  <p>${esc(f.statement)}</p>
  <p class="meta"><strong>Confidence.</strong> ${esc(f.confidence)} &nbsp; ${chip(f.id)}</p>
</div>`,
  )
  .join('\n')}
<h3>Top priorities</h3>
${top
  .map((result) => {
    const rec = view.recommendationOf(result.id);
    if (!rec) return '';
    const unvalidated = view.unvalidatedAssumptions(rec);
    return `<div class="card">
  <h4>${tag(result.priority, result.priority.toLowerCase())} ${esc(rec.title)}</h4>
  <p>${esc(rec.why_it_matters)}</p>
  ${unvalidated.length > 0 ? `<div class="callout">Depends on an unvalidated assumption: ${unvalidated.map((a) => `${esc(a.statement)} ${chip(a.id)}`).join('; ')}</div>` : ''}
  <p class="meta">${chip(rec.id)}</p>
</div>`;
  })
  .join('\n')}
</section>`;
}

function context(view: ReviewView): string {
  const { review } = view;
  const scope = review.scope;
  if (!scope)
    return '<section id="context"><h2>Context</h2><p>No scope was recorded.</p></section>';
  const plan = review.plan;
  return `<section id="context">
<h2>Context</h2>
<p class="lede">What was reviewed, for whom, and what was deliberately left out.</p>
<div class="card">
  <h4>Audiences</h4>
  <table><tr><th>Audience</th><th>Role in the decision</th></tr>
  ${scope.audiences.map((a) => `<tr><td>${esc(a.name)}</td><td>${esc(a.decision_role ?? '')}</td></tr>`).join('')}
  </table>
</div>
<div class="card">
  <h4>Out of scope</h4>
  <ul>${scope.exclusions.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>
</div>
${
  plan
    ? `<div class="card">
  <h4>How the objective was interpreted</h4>
  <p>${esc(plan.objective_interpretation)}</p>
  <p class="meta"><strong>Areas examined.</strong> ${plan.activated_modules.map((m) => esc(m.key)).join(', ')}</p>
  <p class="meta"><strong>Areas not examined.</strong> ${plan.dormant_modules.map((m) => `${esc(m.key)} (${esc(m.reason)})`).join('; ')}</p>
</div>`
    : ''
}
${
  review.user_assertions.length > 0
    ? `<div class="card">
  <h4>What you told us, and what we found</h4>
  <p class="meta">Statements made during onboarding are treated as claims to investigate, not as findings.</p>
  <table><tr><th>Statement</th><th>Status</th><th></th></tr>
  ${review.user_assertions.map((a) => `<tr><td>${esc(a.statement)}</td><td>${esc(a.status.replace(/_/g, ' '))}</td><td>${chip(a.id)}</td></tr>`).join('')}
  </table>
</div>`
    : ''
}
</section>`;
}

function comparison(view: ReviewView): string {
  const { comparisons } = view.review;
  if (comparisons.length === 0) {
    const scope = view.review.scope;
    return `<section id="comparison"><h2>Comparison</h2><p>${
      scope?.comparison_applicable === false
        ? esc(scope.comparison_not_applicable_reason ?? 'Comparison was not applied.')
        : 'No comparison landscape was built.'
    }</p></section>`;
  }
  return `<section id="comparison">
<h2>Comparison</h2>
<p class="lede">Who the audience is actually choosing between. A rejected candidate stays listed with the reason, so the judgement can be argued with.</p>
<div class="scroll-x">
<table>
<tr><th>ID</th><th>Name</th><th>Type</th><th>Status</th><th>Audience overlap</th><th>Proposed by</th></tr>
${comparisons
  .map(
    (c) =>
      `<tr><td>${chip(c.id)}</td><td>${esc(c.name)}</td><td>${esc(c.type.replace(/_/g, ' '))}</td><td>${esc(c.status)}</td><td>${esc(c.audience_overlap)}</td><td>${esc(c.proposed_by)}</td></tr>`,
  )
  .join('')}
</table>
</div>
${comparisons
  .filter((c) => c.status === 'rejected')
  .map(
    (c) =>
      `<div class="callout"><strong>${esc(c.name)}</strong> was rejected. ${esc(c.why_rejected ?? '')}</div>`,
  )
  .join('')}
${saturationTable(view)}
</section>`;
}

/**
 * Specification section 19's saturation table, computed by
 * comparison-synthesis.ts from the qualified comparison set rather than
 * asserted by a reasoning stage. Current position stays a stated judgement,
 * carried from whichever opportunity named the territory as white space.
 */
function saturationTable(view: ReviewView): string {
  const { rows } = view.saturation;
  if (rows.length === 0) return '';
  return `<h3>Positioning territories</h3>
<p class="meta">Saturation and opportunity are computed from the comparison landscape, not asserted.</p>
<div class="scroll-x">
<table>
<tr><th>Territory</th><th>Saturation</th><th>Current position</th><th>Opportunity</th><th>Reading</th></tr>
${rows
  .map(
    (row) =>
      `<tr><td>${esc(row.territory)}</td><td>${esc(row.saturation.replace('_', ' '))}</td><td>${esc(row.current_position)}</td><td>${esc(row.opportunity.replace('_', ' '))}</td><td>${esc(row.classification.replace(/_/g, ' '))}</td></tr>`,
  )
  .join('')}
</table>
</div>
${rows
  .map(
    (row) =>
      `<div class="card"><h4>${esc(row.territory)}</h4><p class="meta">${esc(row.saturation_rationale)}</p>${row.occupants.length > 0 ? `<p class="meta">${chips(row.occupants.map((o) => o.comparison_id))}</p>` : ''}${row.opportunity_ids.length > 0 ? `<p class="meta">Named as white space by ${chips(row.opportunity_ids)}</p>` : ''}</div>`,
  )
  .join('')}
${
  view.saturation.possible_duplicate_territories.length > 0
    ? `<div class="callout"><strong>Possibly the same territory</strong> (a caution, not a merge: reconcile the names by hand if so).<ul>${view.saturation.possible_duplicate_territories
        .map(
          (d) =>
            `<li>"${esc(d.territory_a)}" ${chips(d.comparison_ids_a)} ~ "${esc(d.territory_b)}" ${chips(d.comparison_ids_b)} (similarity ${d.similarity.toFixed(2)})</li>`,
        )
        .join('')}</ul></div>`
    : ''
}`;
}

function findings(view: ReviewView): string {
  const sorted = [...view.review.findings].sort(
    (a, b) => levelRank(b.importance) - levelRank(a.importance) || a.id.localeCompare(b.id),
  );
  if (sorted.length === 0)
    return '<section id="findings"><h2>Findings</h2><p>No findings.</p></section>';
  return `<section id="findings">
<h2>Findings</h2>
<p class="lede">A finding marked <em>inferred</em> goes beyond what its evidence directly shows.</p>
${sorted
  .map((f) => {
    const sources = view.sourcesBehind(f);
    return `<div class="card">
  <h4>${esc(f.id)}: ${esc(f.title)} ${f.claim_type === 'inferred' ? tag('inferred', 'inferred') : tag(f.claim_type)} ${f.contradicted_by.length > 0 ? tag('contested', 'contested') : ''}</h4>
  <p>${esc(f.statement)}</p>
  <p class="meta"><strong>Implication.</strong> ${esc(f.implication)}</p>
  ${
    f.contradicted_by.length > 0
      ? `<div class="callout alert"><strong>Contradicted by.</strong> ${f.contradicted_by
          .map((id) => `${esc(view.evidenceOf(id)?.claim ?? id)} ${chip(id)}`)
          .join('; ')}</div>`
      : ''
  }
  ${
    f.assumption_ids.length > 0
      ? `<div class="callout"><strong>Rests on.</strong> ${f.assumption_ids
          .map((id) => `${esc(view.assumptionOf(id)?.statement ?? id)} ${chip(id)}`)
          .join('; ')}</div>`
      : ''
  }
  <p class="meta"><strong>Confidence.</strong> ${esc(f.confidence)} &nbsp; <strong>Importance.</strong> ${esc(f.importance)} &nbsp; <strong>Time frame.</strong> ${esc(f.temporal_scope)}</p>
  <p class="meta"><strong>Evidence.</strong> ${chips(f.evidence_ids)} from ${sources.map((s) => `${esc(s.title ?? s.url ?? s.source_type)} ${chip(s.id)}`).join(', ') || 'no recorded source'}</p>
</div>`;
  })
  .join('\n')}
</section>`;
}

/** The computed saturation line for an opportunity's white-space territory, if any. */
function whiteSpaceLine(
  view: ReviewView,
  whiteSpace: NonNullable<Opportunity['white_space']>,
): string {
  const row = view.saturation.rows.find((r) => r.territory === whiteSpace.territory);
  const saturation = row ? `, saturation ${esc(row.saturation.replace('_', ' '))} (computed)` : '';
  return `<p class="meta"><strong>White space.</strong> Territory "${esc(whiteSpace.territory)}", current position ${esc(whiteSpace.current_position)}${saturation}.</p>`;
}

function opportunities(view: ReviewView): string {
  const items = view.review.opportunities;
  if (items.length === 0)
    return '<section id="opportunities"><h2>Opportunities</h2><p>None identified.</p></section>';
  return `<section id="opportunities">
<h2>Opportunities</h2>
<p class="lede">A gap that is worth pursuing, not merely a weakness.</p>
${items
  .map(
    (o) => `<div class="card">
  <h4>${esc(o.id)}: ${esc(o.title)}</h4>
  <p>${esc(o.description)}</p>
  ${o.white_space ? whiteSpaceLine(view, o.white_space) : ''}
  <p class="meta"><strong>Strategic value.</strong> ${esc(o.strategic_value)} &nbsp; <strong>Confidence.</strong> ${esc(o.confidence)}</p>
  <p class="meta"><strong>Supported by.</strong> ${chips(o.supporting_finding_ids)}</p>
</div>`,
  )
  .join('\n')}
</section>`;
}

function recommendations(view: ReviewView): string {
  if (view.priorities.length === 0) {
    return '<section id="recommendations"><h2>Recommendations</h2><p>None produced.</p></section>';
  }
  const quadrant = (q: Quadrant): string =>
    view.priorities
      .filter((p) => p.quadrant === q)
      .map((p) => {
        const rec = view.recommendationOf(p.id);
        return `<div class="item">${tag(p.priority, p.priority.toLowerCase())} ${esc(rec?.title ?? p.id)} ${chip(p.id)}</div>`;
      })
      .join('') || '<div class="item meta">None</div>';

  return `<section id="recommendations">
<h2>Recommendations</h2>
<p class="lede">Priority is computed from impact, effort, confidence and urgency. The arithmetic is shown, so it can be argued with.</p>

<h3>Opportunity map</h3>
<div class="matrix">
  <div class="axis v">High impact</div>
  <div class="quad"><h5>${esc(QUADRANT_LABELS.do_now)} (low effort)</h5>${quadrant('do_now')}</div>
  <div class="quad"><h5>${esc(QUADRANT_LABELS.strategic_bet)} (high effort)</h5>${quadrant('strategic_bet')}</div>
  <div class="axis v">Low impact</div>
  <div class="quad"><h5>${esc(QUADRANT_LABELS.quick_win)} (low effort)</h5>${quadrant('quick_win')}</div>
  <div class="quad"><h5>${esc(QUADRANT_LABELS.defer)} (high effort)</h5>${quadrant('defer')}</div>
</div>

${view.priorities
  .map((result) => {
    const rec = view.recommendationOf(result.id);
    if (!rec) return '';
    const unvalidated = view.unvalidatedAssumptions(rec);
    const actions = view.actionsFor(rec.id);
    return `<div class="card">
  <h4>${tag(result.priority, result.priority.toLowerCase())} ${esc(rec.id)}: ${esc(rec.title)}</h4>
  <p class="meta">${esc(result.rationale)}</p>
  <p><strong>Problem.</strong> ${esc(rec.problem)}</p>
  <p><strong>Why it matters.</strong> ${esc(rec.why_it_matters)}</p>
  <p><strong>Change.</strong> ${esc(rec.recommended_change)}</p>
  ${unvalidated.length > 0 ? `<div class="callout">Rests on an unvalidated assumption: ${unvalidated.map((a) => `${esc(a.statement)} ${chip(a.id)}`).join('; ')}</div>` : ''}
  <table>
    <tr><th>Metric</th><td>${esc(rec.measurement.success_metric)} (${esc(rec.measurement.kind)})</td></tr>
    <tr><th>Baseline</th><td>${esc(rec.measurement.baseline ?? 'not established')}</td></tr>
    <tr><th>Target</th><td>${esc(rec.measurement.target ?? 'not set')}</td></tr>
    <tr><th>Proved wrong by</th><td>${esc(rec.measurement.falsifier)}</td></tr>
  </table>
  <p class="meta"><strong>Supported by.</strong> ${chips(rec.finding_ids)} ${chips(rec.opportunity_ids)}</p>
  ${actions.length > 0 ? `<p class="meta"><strong>Actions.</strong> ${actions.map((a) => `${esc(a.description)} ${chip(a.id)}`).join('<br>')}</p>` : ''}
</div>`;
  })
  .join('\n')}
</section>`;
}

function roadmap(view: ReviewView): string {
  const horizons: [string, string][] = [
    ['now', 'Now'],
    ['next', 'Next'],
    ['later', 'Later'],
  ];
  const blocks = horizons
    .map(([key, label]) => {
      const actions = view.review.actions.filter((a) => a.horizon === key);
      if (actions.length === 0) return '';
      return `<h3>${esc(label)}</h3>
${actions
  .map(
    (a) => `<div class="card">
  <h4>${esc(a.description)}</h4>
  <p class="meta"><strong>Effort.</strong> ${esc(a.effort)} &nbsp; <strong>Done when.</strong> ${esc(a.validation)}</p>
  <p class="meta">${chip(a.id)} serves ${chip(a.recommendation_id)}${a.dependencies.length > 0 ? ` &nbsp; after ${chips(a.dependencies)}` : ''}</p>
</div>`,
  )
  .join('')}`;
    })
    .join('');
  return `<section id="roadmap"><h2>Roadmap</h2><p class="lede">Sequenced by dependency, not by calendar.</p>${blocks || '<p>No actions scheduled.</p>'}</section>`;
}

function changes(view: ReviewView): string {
  const tree = renderChangeTreeAscii(view.changeTree);
  if (tree === '')
    return '<section id="changes"><h2>Change tree</h2><p>No changes proposed.</p></section>';
  const rows: string[] = [];
  const walk = (nodes: typeof view.changeTree.roots): void => {
    for (const node of nodes) {
      if (node.operation) {
        rows.push(
          `<tr><td><code>${esc(node.path)}</code></td><td>${esc(node.operation)}</td><td>${chips(node.action_ids)}</td><td>${chips(node.recommendation_ids)}</td><td>${chips(node.finding_ids)}</td></tr>`,
        );
      }
      walk(node.children);
    }
  };
  walk(view.changeTree.roots);
  return `<section id="changes">
<h2>Change tree</h2>
<p class="lede">Derived from the actions, so it cannot say anything the recommendations do not.</p>
<pre>${esc(tree)}</pre>
<div class="scroll-x"><table>
<tr><th>Where</th><th>Operation</th><th>Action</th><th>Recommendation</th><th>Finding</th></tr>
${rows.join('')}
</table></div>
</section>`;
}

function evidence(view: ReviewView): string {
  const { review } = view;
  if (review.evidence.length === 0)
    return '<section id="evidence"><h2>Evidence</h2><p>None recorded.</p></section>';
  return `<section id="evidence">
<h2>Evidence</h2>
<p class="lede">Every conclusion in this report resolves to something here. An absence is recorded with the scope searched.</p>
${review.evidence
  .map((e) => {
    const usedBy = [
      ...review.findings.filter((f) => f.evidence_ids.includes(e.id)).map((f) => f.id),
      ...review.findings.filter((f) => f.contradicted_by.includes(e.id)).map((f) => f.id),
    ];
    return `<div class="card">
  <h4>${esc(e.id)}</h4>
  <p>${esc(e.claim)}</p>
  <p class="meta"><strong>Observations.</strong></p>
  <ul>${e.observation_ids
    .map((id) => {
      const o = view.observationOf(id);
      if (!o) return '';
      const scope =
        o.search_scope && o.search_scope.length > 0
          ? `<br><span class="meta">Searched: ${esc(o.search_scope.join(', '))}</span>`
          : '';
      return `<li>${o.observation_type === 'absence' ? tag('absence', 'absence') : ''} ${esc(o.statement)} ${chip(id)}<br><span class="meta">at <code>${esc(o.locator)}</code></span>${scope}</li>`;
    })
    .join('')}</ul>
  <p class="meta"><strong>Sources.</strong> ${e.source_ids
    .map((id) => {
      const s = view.sourceOf(id);
      if (!s) return chip(id);
      return `${esc(s.title ?? s.source_type)} ${chip(id)} <span class="meta">(${esc(s.retrieval_method)}, authority ${esc(s.authority)}, ${esc(s.independence.type)})</span>`;
    })
    .join('<br>')}</p>
  <p class="meta"><strong>Reliability.</strong> ${esc(e.reliability)} &nbsp; <strong>Relevance.</strong> ${esc(e.relevance)} &nbsp; <strong>Used by.</strong> ${usedBy.length > 0 ? chips([...new Set(usedBy)]) : 'nothing yet'}</p>
</div>`;
  })
  .join('\n')}
</section>`;
}

function limits(view: ReviewView): string {
  const { review, coverage } = view;
  const unresolved = coverage.modules.flatMap((m) => m.unresolved);
  return `<section id="limits">
<h2>What we do not know</h2>
<p class="lede">Stated rather than smoothed over. "We researched this sufficiently" and "we could not find out" are different results.</p>

${
  coverage.modules.length > 0
    ? `<h3>Coverage by area</h3>
<div class="scroll-x"><table>
<tr><th>Area</th><th>Answered</th><th>Evidence</th><th>Independent sources</th><th>Confidence</th></tr>
${coverage.modules
  .map(
    (m) =>
      `<tr><td>${esc(m.module)}</td><td>${m.by_state.ANSWERED}/${m.questions}</td><td>${m.evidence_count}</td><td>${m.independent_source_count}</td><td>${esc(m.confidence)}</td></tr>`,
  )
  .join('')}
</table></div>
<p class="meta">Confidence is the weakest answer in the area, not an average.</p>`
    : ''
}

${
  review.unknowns.length > 0
    ? `<h3>Unknowns</h3>${review.unknowns
        .map(
          (u) =>
            `<div class="card"><h4>${esc(u.statement)}</h4><p class="meta">${esc(u.why_unknown)}</p>${u.how_to_resolve ? `<p class="meta"><strong>To resolve.</strong> ${esc(u.how_to_resolve)}</p>` : ''}<p class="meta">${chip(u.id)}</p></div>`,
        )
        .join('')}`
    : ''
}

${
  unresolved.length > 0
    ? `<h3>Questions we could not close</h3>${unresolved
        .map(
          (u) =>
            `<div class="card"><h4>${esc(u.question)}</h4><p class="meta"><strong>Stopped because.</strong> ${esc(u.stop_reason ?? 'no reason recorded')}. ${esc(u.stop_detail ?? '')}</p><p class="meta">${chip(u.id)}</p></div>`,
        )
        .join('')}`
    : ''
}

${
  review.assumptions.length > 0
    ? `<h3>Assumptions</h3><div class="scroll-x"><table><tr><th>Assumption</th><th>Status</th><th>Validate by</th><th></th></tr>${review.assumptions
        .map(
          (a) =>
            `<tr><td>${esc(a.statement)}</td><td>${esc(a.status)}</td><td>${esc(a.validation_method ?? 'not stated')}</td><td>${chip(a.id)}</td></tr>`,
        )
        .join('')}</table></div>`
    : ''
}

${
  coverage.failures.length > 0
    ? `<h3>Research that did not succeed</h3><ul>${coverage.failures
        .map(
          (f) =>
            `<li><strong>${esc(f.outcome)}</strong>: ${esc(f.detail)} <span class="meta">(${esc(f.research_question_id)})</span></li>`,
        )
        .join('')}</ul>`
    : ''
}

${
  coverage.uncorroborated_findings.length > 0
    ? `<div class="callout">These findings rest on fewer than two independent sources: ${chips(coverage.uncorroborated_findings)}</div>`
    : ''
}
</section>`;
}

/**
 * The report's own critique of itself, rendered last.
 *
 * A report that shows its unanswered contract questions and its mechanical
 * defects is harder to read as an oracle, and that is the point: specification
 * section 77's failure is a document that looks authoritative and has quietly
 * stopped being a view of the evidence. Rendered even when clean, so its
 * presence is never itself a warning sign.
 */
function quality(view: ReviewView): string {
  const { quality: report } = view;
  const contract = report.contract;

  const incomplete = contract.recommendations.filter((r) => !r.complete);
  const contractBlock =
    contract.total === 0
      ? '<p>No recommendations yet, so the output contract has nothing to test.</p>'
      : `<p>${contract.complete_count} of ${contract.total} recommendation${contract.total === 1 ? '' : 's'} answer all ten questions.</p>${
          incomplete.length > 0
            ? incomplete
                .map(
                  (rec) =>
                    `<div class="card"><h4>${chip(rec.recommendation_id)} ${esc(rec.title)}</h4><ul>${rec.answers
                      .filter((a) => !a.answered)
                      .map((a) => `<li><strong>${esc(a.question)}</strong> ${esc(a.detail)}</li>`)
                      .join('')}</ul></div>`,
                )
                .join('')
            : ''
        }`;

  const checkBlock =
    report.findings.length === 0
      ? '<p>No mechanical quality issue was detected.</p>'
      : Object.entries(report.by_category)
          .map(
            ([category, findings]) =>
              `<h3>${esc(category.replace(/_/g, ' '))}</h3>${(findings ?? [])
                .map(
                  (f) =>
                    `<div class="card"><h4>${tag(f.severity, f.severity === 'defect' ? 'warn' : '')} ${chip(f.id)}</h4><p>${esc(f.message)}</p><p class="meta">${esc(f.remedy)}</p></div>`,
                )
                .join('')}`,
          )
          .join('');

  return `<section id="quality">
<h2>How this checks out</h2>
<p class="lede">The ten questions every recommendation has to answer, and the checks this review runs against itself.</p>
<h3>Output contract</h3>
${contractBlock}
<h3>Quality checks</h3>
${checkBlock}
<div class="callout">These are mechanical checks, and passing them is not a claim that the analysis is good. Whether the comparison set is the one this audience actually considers, whether an inference is warranted, and whether any of this bears on the decision are judgments only a reader can make.</div>
</section>`;
}
