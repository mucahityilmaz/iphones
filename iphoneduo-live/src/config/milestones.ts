export type Milestone = {
  id: string;
  label: string;
  /** Absolute instant with an explicit offset. Everything is computed from this in UTC. */
  at: string;
};

// ---------------------------------------------------------------------------
// The two dates. This is the one-line edit when Apple confirms the real hour.
// ---------------------------------------------------------------------------
export const milestones: Milestone[] = [
  { id: 'preorder', label: 'Preorders open', at: '2026-10-16T14:00:00+02:00' },
  { id: 'shipping', label: 'Shipping starts', at: '2026-10-23T09:00:00+02:00' },
];

/**
 * Apple has confirmed the preorder *day* but not the hour. While this is false the
 * page shows a "time subject to change" note next to the countdown. Flip it to true
 * once the hour above is confirmed and the note disappears.
 */
export const PREORDER_TIME_CONFIRMED = false;

/** Timezone the static HTML is rendered in, before JS localises it for the visitor. */
export const REFERENCE_TZ = 'Europe/Berlin';

/** The day Apple announced the product. Used in copy and llms.txt. */
export const ANNOUNCED_AT = '2026-09-09';

// ---------------------------------------------------------------------------
// Helpers. Shared by the build (static HTML) and the browser (live countdown).
// ---------------------------------------------------------------------------

export function msAt(m: Milestone): number {
  return Date.parse(m.at);
}

/** Human string in the reference timezone, e.g. "16 October 2026 at 14:00 CEST". */
export function formatReference(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: REFERENCE_TZ,
  }).format(d);
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: REFERENCE_TZ,
    timeZoneName: 'short',
  }).format(d);
  return `${date} at ${time}`;
}

/** Date only, for prose that should not imply a confirmed hour. */
export function formatReferenceDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: REFERENCE_TZ,
  }).format(new Date(iso));
}

export type Phase = 'before-preorder' | 'preorder-open' | 'shipped';

/** Which of the three states the site is in at a given instant. */
export function phaseAt(now: number): Phase {
  const [preorder, shipping] = milestones;
  if (now < msAt(preorder!)) return 'before-preorder';
  if (now < msAt(shipping!)) return 'preorder-open';
  return 'shipped';
}

/** The milestone the countdown is currently pointed at, or null once both have passed. */
export function activeMilestone(now: number): Milestone | null {
  return milestones.find((m) => now < msAt(m)) ?? null;
}
