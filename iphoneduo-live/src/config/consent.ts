/**
 * The exact wording shown next to the signup checkbox.
 *
 * There is no confirmation email, so the row in D1 is the only evidence of what a
 * person agreed to. CONSENT_VERSION is stored with every subscriber.
 *
 * Never edit CONSENT_TEXT without bumping CONSENT_VERSION — otherwise existing rows
 * silently claim consent to wording that was never on screen when they signed up.
 */
export const CONSENT_VERSION = '2026-09-10.v1';

export const CONSENT_TEXT =
  'Email me when iPhone Duo preorders open, and occasionally about related products ' +
  'and offers. I can unsubscribe at any time.';
