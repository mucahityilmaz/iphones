/**
 * Single source of truth for every factual claim on this site.
 *
 * The spec list, the Quick answers section, the JSON-LD FAQPage and /llms.txt are all
 * generated from here. Google treats FAQPage markup that does not match the visible
 * Q&A as a violation, so they must not be maintained separately — change a number
 * here and all four surfaces move together.
 */

export const PRODUCT = 'iPhone Duo';

export const SITE = {
  url: 'https://iphoneduo.live',
  name: 'iPhone Duo Countdown',
  // Deliberately says "unofficial tracker" — must not imply Apple affiliation.
  title: 'iPhone Duo release countdown — preorder and shipping dates',
  description:
    'Unofficial countdown to the iPhone Duo preorder and shipping dates, with prices by ' +
    'storage tier, colours and specs. Independent fan project, not affiliated with Apple.',
  contact: 'contact@iphoneduo.live',
} as const;

export const DISCLAIMER =
  'Independent fan project. Not affiliated with, endorsed by, or sponsored by Apple Inc. ' +
  'Apple, iPhone and iPhone Duo are trademarks of Apple Inc.';

// --- individual facts, referenced by name so nothing is retyped ---------------
export const INNER_DISPLAY = '7.6-inch';
export const FRAME = 'titanium';
export const COVER_GLASS = 'Ceramic Shield 2';
export const INGRESS_RATING = 'IP68';
export const BIOMETRICS = 'Touch ID in the side button';
export const COLOURS = ['Star White', 'Night Sky'] as const;
export const PRICE_MIN = '$1,999';
export const PRICE_MIN_TIER = '256GB';
export const PRICE_MAX = '$3,199';
export const PRICE_MAX_TIER = '2TB';
export const CASE_PRICE = '$79';

export type Spec = { label: string; value: string };

/** The plain factual list below the fold. Facts only, no marketing voice. */
export const specs: Spec[] = [
  { label: 'Inner display', value: `${INNER_DISPLAY}` },
  { label: 'Frame', value: 'Titanium' },
  { label: 'Cover glass', value: COVER_GLASS },
  { label: 'Water and dust resistance', value: INGRESS_RATING },
  { label: 'Biometrics', value: 'Touch ID in the side button' },
  { label: 'Colours', value: COLOURS.join(', ') },
  { label: 'Storage and price', value: `${PRICE_MIN} (${PRICE_MIN_TIER}) to ${PRICE_MAX} (${PRICE_MAX_TIER})` },
  { label: 'Official case', value: CASE_PRICE },
];

export type QA = { id: string; q: string; a: string };

/**
 * Every answer is one self-contained sentence that names the subject, so it still
 * makes sense quoted with no surrounding context. This is what an answer engine
 * lifts, and it is mirrored verbatim into the FAQPage JSON-LD.
 */
export const quickAnswers: QA[] = [
  {
    id: 'preorder-date',
    q: 'When do iPhone Duo preorders open?',
    a: 'iPhone Duo preorders open on 16 October 2026.',
  },
  {
    id: 'ship-date',
    q: 'When does the iPhone Duo ship?',
    a: 'The iPhone Duo starts shipping on 23 October 2026.',
  },
  {
    id: 'price',
    q: 'How much does the iPhone Duo cost?',
    a: `The ${PRODUCT} starts at ${PRICE_MIN} for ${PRICE_MIN_TIER} and goes up to ${PRICE_MAX} for ${PRICE_MAX_TIER}.`,
  },
  {
    id: 'screen-size',
    q: 'How big is the iPhone Duo screen?',
    a: `The ${PRODUCT} has a ${INNER_DISPLAY} inner display.`,
  },
  {
    id: 'colours',
    q: 'What colours does the iPhone Duo come in?',
    a: `The ${PRODUCT} comes in ${COLOURS[0]} and ${COLOURS[1]}.`,
  },
  {
    id: 'touch-id',
    q: 'Does the iPhone Duo have Touch ID?',
    a: `Yes, the ${PRODUCT} has Touch ID built into the side button.`,
  },
  {
    id: 'case-price',
    q: 'How much is the official iPhone Duo case?',
    a: `The official ${PRODUCT} case costs ${CASE_PRICE}.`,
  },
];

export type Source = { label: string; href: string };

export const sources: Source[] = [
  { label: 'Apple Newsroom', href: 'https://www.apple.com/newsroom/' },
  {
    label: "Tom's Guide",
    href: 'https://www.tomsguide.com/phones/iphones/iphone-duo-is-official-price-release-date-specs-and-everything-you-need-to-know',
  },
  {
    label: 'Bloomberg',
    href: 'https://www.bloomberg.com/news/articles/2026-09-09/apple-event-details-2-000-iphone-duo-apple-watch-series-12-recording-feature',
  },
];
