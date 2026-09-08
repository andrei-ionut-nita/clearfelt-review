/**
 * Client behaviour for the HTML report, inlined.
 *
 * Deliberately small and framework-free. It does three things: track the active
 * nav section, open the drill-down panel for an id, and walk the traceability
 * graph in both directions from the embedded model.
 *
 * The walk runs in the browser rather than being pre-rendered because the graph
 * is a DAG and pre-rendering every path from every node would balloon the file
 * for paths nobody opens.
 */
export const SCRIPT = String.raw`
(function () {
  var data = JSON.parse(document.getElementById('review-data').textContent);

  var COLLECTIONS = [
    ['recommendations', data.recommendations],
    ['actions', data.actions],
    ['findings', data.findings],
    ['opportunities', data.opportunities],
    ['evidence', data.evidence],
    ['observations', data.observations],
    ['sources', data.sources],
    ['assumptions', data.assumptions],
    ['comparisons', data.comparisons],
    ['unknowns', data.unknowns],
    ['hypotheses', data.hypotheses],
    ['user_assertions', data.user_assertions],
    ['entities', data.entities],
    ['assets', data.assets],
    ['research_questions', data.research_questions]
  ];

  function find(id) {
    for (var i = 0; i < COLLECTIONS.length; i++) {
      var name = COLLECTIONS[i][0];
      var items = COLLECTIONS[i][1] || [];
      for (var j = 0; j < items.length; j++) {
        if (items[j].id === id) return { collection: name, item: items[j] };
      }
    }
    return null;
  }

  function byId(list, id) {
    for (var i = 0; i < (list || []).length; i++) if (list[i].id === id) return list[i];
    return null;
  }

  function label(id) {
    var hit = find(id);
    if (!hit) return id;
    var it = hit.item;
    switch (hit.collection) {
      case 'recommendations': return it.title;
      case 'actions': return it.description;
      case 'opportunities': return it.title;
      case 'findings': return '[' + it.claim_type + '] ' + it.statement;
      case 'evidence': return it.claim;
      case 'observations': return (it.observation_type === 'absence' ? '[absence] ' : '') + it.statement;
      case 'sources': return it.title || it.url || it.source_type;
      case 'assumptions': return '[' + it.status + '] ' + it.statement;
      case 'comparisons': return it.name + ' (' + it.status + ')';
      case 'user_assertions': return '[' + it.status + '] ' + it.statement;
      case 'entities': return it.name;
      case 'assets': return it.path + (it.title ? ' (' + it.title + ')' : '');
      case 'research_questions': return it.question;
      case 'unknowns': return it.statement;
      case 'hypotheses': return it.statement;
      default: return id;
    }
  }

  /** Toward the evidence: why does this exist? */
  function forward(id) {
    var hit = find(id);
    if (!hit) return [];
    var it = hit.item;
    switch (hit.collection) {
      case 'actions': return [it.recommendation_id];
      case 'recommendations': return (it.finding_ids || []).concat(it.opportunity_ids || [], it.assumption_ids || []);
      case 'opportunities': return it.supporting_finding_ids || [];
      case 'findings': return (it.evidence_ids || []).concat(it.assumption_ids || [], it.contradicted_by || []);
      case 'evidence': return it.observation_ids || [];
      case 'observations': return [it.source_id];
      default: return [];
    }
  }

  /** Toward the action: what did this actually change? */
  function reverse(id) {
    var hit = find(id);
    if (!hit) return [];
    var out = [];
    var i;
    switch (hit.collection) {
      case 'sources':
        for (i = 0; i < data.observations.length; i++)
          if (data.observations[i].source_id === id) out.push(data.observations[i].id);
        return out;
      case 'observations':
        for (i = 0; i < data.evidence.length; i++)
          if ((data.evidence[i].observation_ids || []).indexOf(id) >= 0) out.push(data.evidence[i].id);
        return out;
      case 'evidence':
        for (i = 0; i < data.findings.length; i++)
          if ((data.findings[i].evidence_ids || []).indexOf(id) >= 0 ||
              (data.findings[i].contradicted_by || []).indexOf(id) >= 0) out.push(data.findings[i].id);
        return out;
      case 'findings':
        for (i = 0; i < data.opportunities.length; i++)
          if ((data.opportunities[i].supporting_finding_ids || []).indexOf(id) >= 0) out.push(data.opportunities[i].id);
        for (i = 0; i < data.recommendations.length; i++)
          if ((data.recommendations[i].finding_ids || []).indexOf(id) >= 0) out.push(data.recommendations[i].id);
        return out;
      case 'opportunities':
        for (i = 0; i < data.recommendations.length; i++)
          if ((data.recommendations[i].opportunity_ids || []).indexOf(id) >= 0) out.push(data.recommendations[i].id);
        return out;
      case 'recommendations':
        for (i = 0; i < data.actions.length; i++)
          if (data.actions[i].recommendation_id === id) out.push(data.actions[i].id);
        return out;
      default: return [];
    }
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function walk(id, step, prefix, isLast, isRoot, seen, depth) {
    if (depth > 8) return '';
    var line;
    if (isRoot) {
      line = '<span class="node" data-id="' + esc(id) + '">' + esc(id) + '</span>  ' + esc(label(id)) + '\n';
    } else {
      line = prefix + (isLast ? '└── ' : '├── ') +
        '<span class="node" data-id="' + esc(id) + '">' + esc(id) + '</span>  ' + esc(label(id)) + '\n';
    }
    if (seen.indexOf(id) >= 0) return line;
    var nextSeen = seen.concat([id]);
    var kids = step(id);
    var childPrefix = isRoot ? '' : prefix + (isLast ? '    ' : '│   ');
    for (var i = 0; i < kids.length; i++) {
      line += walk(kids[i], step, childPrefix, i === kids.length - 1, false, nextSeen, depth + 1);
    }
    return line;
  }

  var panel = document.getElementById('panel');
  var backdrop = document.getElementById('backdrop');
  var body = document.getElementById('panel-body');
  var panelClose = document.getElementById('panel-close');
  var lastFocused = null;

  function focusableIn(container) {
    return [].slice.call(
      container.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')
    ).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
  }

  function trapFocus(event) {
    if (event.key !== 'Tab' || !panel.classList.contains('open')) return;
    var focusable = focusableIn(panel);
    if (focusable.length === 0) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function detail(hit) {
    var it = hit.item;
    var rows = [];
    function row(k, v) { if (v !== undefined && v !== null && v !== '') rows.push('<tr><th>' + esc(k) + '</th><td>' + esc(v) + '</td></tr>'); }
    switch (hit.collection) {
      case 'recommendations':
        row('Problem', it.problem); row('Why it matters', it.why_it_matters);
        row('Change', it.recommended_change); row('Expected outcome', it.expected_outcome);
        row('Impact', it.impact); row('Effort', it.effort); row('Confidence', it.confidence); row('Urgency', it.urgency);
        if (it.measurement) {
          row('Metric', it.measurement.success_metric);
          row('Baseline', it.measurement.baseline);
          row('Target', it.measurement.target);
          row('Proved wrong by', it.measurement.falsifier);
        }
        break;
      case 'findings':
        row('Statement', it.statement); row('Claim type', it.claim_type);
        row('Implication', it.implication); row('Confidence', it.confidence);
        row('Importance', it.importance); row('Time frame', it.temporal_scope);
        break;
      case 'evidence':
        row('Claim', it.claim); row('Relevance', it.relevance);
        row('Reliability', it.reliability); row('Time frame', it.temporal_scope);
        // An absence must never read as a bare claim, wherever it surfaces. The
        // scope searched travels with it into this panel rather than sitting one
        // click deeper on the observation.
        for (var oi = 0; oi < (it.observation_ids || []).length; oi++) {
          var obs = byId(data.observations, it.observation_ids[oi]);
          if (!obs) continue;
          if (obs.observation_type === 'absence') {
            row('Absence', obs.statement);
            row('Searched', (obs.search_scope || []).join(', '));
          } else {
            row('Observed', obs.statement);
          }
        }
        break;
      case 'observations':
        row('Statement', it.statement); row('Type', it.observation_type);
        row('Locator', it.locator); row('Observed', it.observed_at);
        if (it.search_scope && it.search_scope.length) row('Searched', it.search_scope.join(', '));
        break;
      case 'sources':
        row('Title', it.title); row('URL', it.url); row('Type', it.source_type);
        row('Retrieval', it.retrieval_method); row('Authority', it.authority);
        row('Independence', it.independence ? it.independence.type : '');
        row('Accessed', it.accessed_at); row('Snapshot', it.snapshot_path);
        break;
      case 'assumptions':
        row('Statement', it.statement); row('Status', it.status);
        row('Why assumed', it.why_assumed); row('Validate by', it.validation_method);
        break;
      case 'comparisons':
        row('Type', it.type); row('Status', it.status); row('Proposed by', it.proposed_by);
        row('Why included', it.why_included); row('Why rejected', it.why_rejected);
        row('Audience overlap', it.audience_overlap); row('Relevance', it.relevance);
        break;
      case 'actions':
        row('Description', it.description); row('Effort', it.effort);
        row('Horizon', it.horizon); row('Done when', it.validation);
        break;
      case 'research_questions':
        row('Question', it.question); row('Module', it.module); row('State', it.state);
        row('Stopped because', it.stop_reason); row('Detail', it.stop_detail);
        break;
      default:
        row('Statement', it.statement || it.title || it.name);
    }
    return rows.length ? '<table>' + rows.join('') + '</table>' : '';
  }

  function open(id) {
    var hit = find(id);
    if (!hit) return;
    var priority = byId(data.priorities, id);
    var html = '<h3 id="panel-title">' + esc(id) + '</h3>';
    html += '<p class="meta">' + esc(hit.collection.replace(/_/g, ' ')) + '</p>';
    if (priority) {
      html += '<p class="meta"><span class="tag ' + priority.priority.toLowerCase() + '">' +
        esc(priority.priority) + '</span> ' + esc(priority.rationale) + '</p>';
    }
    html += detail(hit);
    var fwd = walk(id, forward, '', true, true, [], 0);
    var rev = walk(id, reverse, '', true, true, [], 0);
    html += '<h4>Why does this exist?</h4><div class="tree">' + fwd + '</div>';
    html += '<h4>What did this lead to?</h4><div class="tree">' + rev + '</div>';
    body.innerHTML = html;
    lastFocused = document.activeElement;
    panel.classList.add('open');
    backdrop.classList.add('open');
    if (panelClose) panelClose.focus();
  }

  function close() {
    panel.classList.remove('open');
    backdrop.classList.remove('open');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    lastFocused = null;
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (target.classList && (target.classList.contains('chip') || target.classList.contains('node'))) {
      event.preventDefault();
      open(target.getAttribute('data-id') || target.textContent.trim());
      return;
    }
    if (target.id === 'panel-close' || target.id === 'backdrop') close();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') close();
    trapFocus(event);
  });

  /**
   * Filtering is an enhancement, never a requirement: the .filter-bar itself
   * is CSS-hidden until this class is added, so with JavaScript disabled no
   * control appears and every card stays visible. With no chip pressed,
   * "show everything" is the default here too.
   */
  document.documentElement.classList.add('js');

  /**
   * Theme toggle. An explicit choice is stored (guarded: some file:// and
   * sandboxed contexts throw on storage access, and a preference that fails
   * to persist there should not break the toggle itself, only its memory).
   * Absent a stored choice, no data-theme attribute is set at all, so the
   * report keeps following the OS preference live, including a change made
   * while the page stays open.
   */
  function readStoredTheme() {
    try {
      var stored = localStorage.getItem('clearfelt-review-theme');
      return stored === 'light' || stored === 'dark' ? stored : null;
    } catch (e) {
      return null;
    }
  }

  function writeStoredTheme(theme) {
    try {
      localStorage.setItem('clearfelt-review-theme', theme);
    } catch (e) {
      // No persistence available; the toggle still works for this view.
    }
  }

  function effectiveTheme() {
    var explicit = document.documentElement.getAttribute('data-theme');
    if (explicit === 'light' || explicit === 'dark') return explicit;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  function updateToggleButton(theme) {
    var button = document.getElementById('theme-toggle');
    if (!button) return;
    var next = theme === 'dark' ? 'light' : 'dark';
    button.textContent = theme === 'dark' ? '☀' : '☾';
    button.setAttribute('aria-label', 'Switch to ' + next + ' theme');
  }

  var storedTheme = readStoredTheme();
  if (storedTheme) document.documentElement.setAttribute('data-theme', storedTheme);
  updateToggleButton(effectiveTheme());

  var themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var next = effectiveTheme() === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      writeStoredTheme(next);
      updateToggleButton(next);
    });
  }

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      // Only follow a live OS change when the reader has not made an
      // explicit choice; an explicit choice must not be silently overridden.
      if (!document.documentElement.getAttribute('data-theme')) {
        updateToggleButton(effectiveTheme());
      }
    });
  }

  function initFilters() {
    var bars = [].slice.call(document.querySelectorAll('.filter-bar'));
    bars.forEach(function (bar) {
      var target = document.getElementById(bar.getAttribute('data-filter-target') || '');
      var field = bar.getAttribute('data-filter-field');
      if (!target || !field) return;
      var chips = [].slice.call(bar.querySelectorAll('.filter-chip'));
      function apply() {
        var active = chips
          .filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; })
          .map(function (c) { return c.getAttribute('data-filter-value'); });
        var cards = [].slice.call(target.children);
        cards.forEach(function (card) {
          var value = card.getAttribute('data-' + field);
          // An element with no value for this field (e.g. a horizon heading
          // mixed in among action cards) is never a filter target, only
          // something that groups them, so it always stays visible.
          if (value === null) return;
          card.hidden = active.length > 0 && active.indexOf(value) < 0;
        });
      }
      chips.forEach(function (c) {
        c.addEventListener('click', function () {
          var pressed = c.getAttribute('aria-pressed') === 'true';
          c.setAttribute('aria-pressed', pressed ? 'false' : 'true');
          apply();
        });
      });
    });
  }
  initFilters();

  /**
   * The P0 shortcut in the corner does two things on one click: it jumps to
   * Recommendations (the href already does that) and it pre-presses that
   * section's own P0 filter chip, so the reader lands on exactly the list
   * the shortcut promised rather than the full, unfiltered section.
   */
  var jumpP0 = document.getElementById('jump-p0');
  if (jumpP0) {
    jumpP0.addEventListener('click', function () {
      var p0Chip = document.querySelector(
        '[data-filter-target="recommendations-list"] [data-filter-value="P0"]',
      );
      if (p0Chip && p0Chip.getAttribute('aria-pressed') !== 'true') p0Chip.click();
    });
  }

  /**
   * Reading progress: how far through the document the reader has scrolled.
   * Recomputed on scroll and resize, throttled to one measurement per frame.
   */
  var progressFill = document.getElementById('progress-fill');
  if (progressFill) {
    var scheduled = false;
    var updateProgress = function () {
      scheduled = false;
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - doc.clientHeight;
      var pct = scrollable > 0 ? (doc.scrollTop / scrollable) * 100 : 0;
      progressFill.style.width = Math.max(0, Math.min(100, pct)) + '%';
    };
    var onScroll = function () {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(updateProgress);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    updateProgress();
  }

  var sections = [].slice.call(document.querySelectorAll('main section'));
  var links = {};
  [].slice.call(document.querySelectorAll('nav.sidebar a')).forEach(function (a) {
    links[a.getAttribute('href').slice(1)] = a;
  });
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = links[entry.target.id];
        if (!link) return;
        if (entry.isIntersecting) {
          for (var key in links) links[key].classList.remove('active');
          link.classList.add('active');
        }
      });
    }, { rootMargin: '-10% 0px -80% 0px' });
    sections.forEach(function (s) { observer.observe(s); });
  }
})();
`;
