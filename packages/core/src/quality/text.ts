/**
 * Text primitives for the mechanical quality checks.
 *
 * Deliberately crude, and honest about it. These catch a recommendation that
 * copies its finding, a falsifier that restates its own hypothesis, and the
 * banned phrases of specification section 78. They do not catch a subtly
 * circular argument written in different words, and nothing in this file should
 * be read as claiming otherwise: quality/rubric.md carries the judgments that
 * only a human can make.
 *
 * No LLM is called here. A quality report that needed a model to produce it
 * would be one more piece of unfalsifiable output, which is the thing this
 * whole product exists to avoid.
 */

/**
 * Words carrying no analytical content. Kept short on purpose: an aggressive
 * stopword list makes two unrelated sentences look similar, which produces
 * false accusations of duplication.
 */
const STOPWORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'been',
  'being',
  'but',
  'by',
  'can',
  'could',
  'did',
  'do',
  'does',
  'for',
  'from',
  'had',
  'has',
  'have',
  'how',
  'in',
  'into',
  'is',
  'it',
  'its',
  'may',
  'might',
  'more',
  'most',
  'much',
  'must',
  'of',
  'on',
  'or',
  'our',
  'over',
  'should',
  'so',
  'some',
  'such',
  'than',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'those',
  'to',
  'up',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'why',
  'will',
  'with',
  'would',
  'you',
  'your',
]);

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Crude suffix stripping so "positions", "positioning" and "positioned" compare
 * equal. A real stemmer would be a dependency, and the family has none; the
 * cost of being approximate here is a check that is slightly noisier, not a
 * check that is wrong in a direction that matters.
 */
function stem(word: string): string {
  for (const suffix of ['ations', 'ation', 'ingly', 'ing', 'edly', 'ies', 'ed', 'es', 's']) {
    if (word.length > suffix.length + 3 && word.endsWith(suffix)) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

/** Content-bearing terms, stemmed and deduplicated. */
export function contentTerms(text: string): Set<string> {
  const terms = new Set<string>();
  for (const word of normalise(text).split(' ')) {
    if (word.length < 3 || STOPWORDS.has(word)) continue;
    terms.add(stem(word));
  }
  return terms;
}

/**
 * Jaccard overlap of content terms, 0 to 1.
 *
 * Order-insensitive on purpose. "Rewrite the hero to lead with economics" and
 * "Lead with economics in the hero, rewritten" are the same instruction, and a
 * check that missed that would be trivially evaded by reordering a clause.
 */
export function similarity(a: string, b: string): number {
  const left = contentTerms(a);
  const right = contentTerms(b);
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const term of left) if (right.has(term)) shared += 1;
  return shared / (left.size + right.size - shared);
}

/** Terms in `text` that appear in none of `against`. */
export function novelTerms(text: string, against: readonly string[]): string[] {
  const known = new Set<string>();
  for (const other of against) for (const term of contentTerms(other)) known.add(term);
  return [...contentTerms(text)].filter((term) => !known.has(term));
}

/**
 * Whether a sentence expresses a failure condition rather than a success one.
 *
 * A falsifier has to be able to come out false. "Enquiries increase" cannot:
 * it describes the outcome we are hoping for, so observing it never disproves
 * anything. Requiring a negation or a shortfall word is the mechanical half of
 * that test.
 */
export const NEGATION_MARKERS: ReadonlySet<string> = new Set([
  'no',
  'not',
  'none',
  'never',
  'without',
  'nothing',
  'neither',
  'nor',
  'cannot',
  'unable',
]);

const SHORTFALL_MARKERS: ReadonlySet<string> = new Set([
  'fails',
  'fail',
  'failed',
  'unchanged',
  'below',
  'under',
  'less',
  'fewer',
  'worse',
  'falls',
  'drops',
  'declines',
  'decrease',
  'decreases',
  'decreased',
  'absent',
  'still',
  'remains',
  'flat',
  'lower',
  'indistinguishable',
  'unaffected',
  'unmoved',
  'identical',
  'same',
]);

export function statesAFailureCondition(text: string): boolean {
  return normalise(text)
    .split(' ')
    .some((word) => NEGATION_MARKERS.has(word) || SHORTFALL_MARKERS.has(word));
}

/**
 * Specification section 78, the "AI consultant theatre" list.
 *
 * Matched against a recommendation's recommended_change, which is the field
 * that has to be executable. These phrases are only banned when they stand in
 * for the specifics: the check reports them, and the reader decides.
 */
export const GENERIC_PHRASES: readonly string[] = [
  'strengthen your brand',
  'strengthen the brand',
  'improve your messaging',
  'improve the messaging',
  'improve messaging',
  'leverage ai',
  'leverage artificial intelligence',
  'focus on your audience',
  'focus on the audience',
  'differentiate from competitors',
  'differentiate from the competition',
  'create more content',
  'produce more content',
  'increase engagement',
  'optimise the funnel',
  'optimize the funnel',
  'build trust',
  'tell a better story',
  'enhance the user experience',
  'improve seo',
  'raise brand awareness',
  // Widened in Phase 6 by adding the consultant-theatre phrases the original
  // list happened not to cover, rather than raising a threshold: the same
  // calibration method as Phase 2, applied without a fresh real run to check
  // against, so this list is the part most worth widening again next time one
  // is available.
  'unlock synergies',
  'move the needle',
  'best in class',
  'drive growth',
  'low hanging fruit',
  'unlock the full potential',
  'maximise value',
  'maximize value',
  'take it to the next level',
] as const;

/**
 * Similarity at or above which a window of the target text counts as saying a
 * generic phrase, not merely brushing past one of its words.
 *
 * Every phrase in GENERIC_PHRASES has at most 3 content terms, so a window
 * missing one of them scores at most 0.5 (2 of 3 shared) and a window sharing
 * only one term scores at most 0.5 as well for the shortest, 2-term phrases;
 * 0.6 sits above both, so only a window whose content terms are the phrase's
 * own (in any order, any inflection the crude stemmer normalises together,
 * with at most one unrelated word admitted alongside them) ever qualifies.
 * That headroom is deliberate: this check produces a 'defect', not a caution,
 * so a false positive costs more here than the same score would in a
 * cross-run possible-duplicate hint.
 */
const GENERIC_PHRASE_THRESHOLD = 0.6;

/**
 * Content terms in original order, duplicates kept. `contentTerms` returns a
 * deduplicating Set because its callers do set arithmetic; windowing needs
 * the sequence a phrase's words could actually appear in.
 */
function contentTermSequence(text: string): string[] {
  return normalise(text)
    .split(' ')
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
    .map(stem);
}

/**
 * Whether `phrase` appears in `textTerms` as a contiguous run, order and
 * inflection aside, with room for at most one word that isn't the phrase's.
 *
 * A phrase with fewer than two content terms (only `leverage ai`: "ai" is
 * two letters and is filtered out as noise-length by `contentTerms` itself)
 * has nothing to window against without matching on a single word so common
 * it would flag unrelated writing; those rely on the literal check only.
 */
function fuzzyPhraseMatch(phrase: string, textTerms: readonly string[]): boolean {
  const phraseSize = contentTerms(phrase).size;
  if (phraseSize < 2) return false;
  for (const windowSize of [phraseSize, phraseSize + 1]) {
    if (textTerms.length < windowSize) continue;
    for (let i = 0; i + windowSize <= textTerms.length; i += 1) {
      const window = textTerms.slice(i, i + windowSize).join(' ');
      if (similarity(phrase, window) >= GENERIC_PHRASE_THRESHOLD) return true;
    }
  }
  return false;
}

/**
 * Generic phrases present in a piece of text: an exact substring, the cheap
 * case a literal list always catches, or a fuzzy match, the paraphrase,
 * reordering or inflection a literal list is structurally always one phrase
 * behind (docs/decisions/0008-validation-is-not-evaluation.md, Phase 3/4).
 */
export function genericPhrasesIn(text: string): string[] {
  const haystack = normalise(text);
  const textTerms = contentTermSequence(text);
  return GENERIC_PHRASES.filter(
    (phrase) => haystack.includes(phrase) || fuzzyPhraseMatch(phrase, textTerms),
  );
}
