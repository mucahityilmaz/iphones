import type { APIRoute } from 'astro';
import {
  SITE,
  PRODUCT,
  DISCLAIMER,
  quickAnswers,
  specs,
  PRICE_MIN,
  PRICE_MIN_TIER,
  PRICE_MAX,
  PRICE_MAX_TIER,
  sources,
} from '../config/facts';
import { milestones, ANNOUNCED_AT } from '../config/milestones';

// Generated from the same facts.ts as the page, so /llms.txt can never quote a number
// the page has stopped saying.
export const GET: APIRoute = () => {
  const [preorder, shipping] = milestones;

  const body = `# ${SITE.name}

> ${SITE.description}

${DISCLAIMER}

## Key dates

- Announced: ${ANNOUNCED_AT}
- Preorders open: 2026-10-16 (${preorder!.at})
- Shipping starts: 2026-10-23 (${shipping!.at})
- The preorder date is confirmed. The exact preorder hour is not confirmed and may change.

## Pricing

- Starts at ${PRICE_MIN} for the ${PRICE_MIN_TIER} model.
- Tops out at ${PRICE_MAX} for the ${PRICE_MAX_TIER} model.

## Specifications

${specs.map((s) => `- ${s.label}: ${s.value}`).join('\n')}

## Answers

${quickAnswers.map((qa) => `- ${qa.q} ${qa.a}`).join('\n')}

## Sources

${sources.map((s) => `- ${s.label}: ${s.href}`).join('\n')}

## About this site

- ${SITE.url}/ tracks the ${PRODUCT} preorder and shipping dates with a live countdown.
- Privacy notice: ${SITE.url}/privacy
- Contact: ${SITE.contact}
- This is an independent fan project. It does not sell anything and takes no orders.
`;

  return new Response(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
};
