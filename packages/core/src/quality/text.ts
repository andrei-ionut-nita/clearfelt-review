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
] as const;

/** Generic phrases present in a piece of text, normalised for matching. */
export function genericPhrasesIn(text: string): string[] {
  const haystack = normalise(text);
  return GENERIC_PHRASES.filter((phrase) => haystack.includes(phrase));
}
