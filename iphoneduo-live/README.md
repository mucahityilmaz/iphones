# iphoneduo.live

Countdown to the iPhone Duo preorder and shipping dates. Astro, static output,
deployed to Cloudflare Pages. Signup is a Pages Function writing to D1.

Independent fan project. Not affiliated with, endorsed by, or sponsored by Apple Inc.

## Stack

| Thing | Choice |
|---|---|
| Site | Astro 7, `output: 'static'`, Tailwind v4 |
| Hosting | Cloudflare Pages |
| Signup / unsubscribe / export | Pages Functions in `functions/` |
| Email storage | Cloudflare D1 |
| Rate limiting | Cloudflare KV |
| Analytics | Google Analytics 4 (`G-K46TYLWDP9`) with basic consent mode |
| Fonts | Space Grotesk + JetBrains Mono, self-hosted via Fontsource |

No Google Fonts, no Meta Pixel. Google Analytics runs in **basic consent mode**: everything
defaults to denied and gtag.js is not fetched at all until the visitor accepts, so declining
means no Google request is ever made. The only thing stored without asking is the answer to
the consent banner, in `localStorage`.

## Where the facts live

`src/config/facts.ts` is the only place a number appears. The spec list, the Quick
answers section, the `FAQPage` JSON-LD and `/llms.txt` are all generated from it.
Change a price there and all four move together — which matters, because FAQPage
markup that disagrees with the visible Q&A is a Google guidelines violation.

`src/config/milestones.ts` holds the two dates. Editing `at` is the whole change:

```ts
{ id: 'preorder', label: 'Preorders open', at: '2026-10-16T14:00:00+02:00' },
```

Set `PREORDER_TIME_CONFIRMED = true` in the same file once Apple confirms the hour,
and the "subject to change" note next to the countdown disappears.

## Setup

```bash
pnpm install
```

### 1. Create the database

```bash
pnpm db:create              # wrangler d1 create iphoneduo_live
```

Paste the printed `database_id` into `wrangler.toml`, replacing
`REPLACE_ME_run_pnpm_db_create`.

### 2. Create the KV namespace

```bash
pnpm kv:create              # wrangler kv namespace create RATE_LIMIT
```

Paste the printed `id` into `wrangler.toml`, replacing `REPLACE_ME_run_pnpm_kv_create`.

### 3. Apply the migration

```bash
pnpm db:migrate:local       # local SQLite, for pnpm preview
pnpm db:migrate             # the real remote D1
```

### 4. Set the two secrets

```bash
wrangler pages secret put UNSUBSCRIBE_SECRET --project-name=iphoneduo-live
wrangler pages secret put ADMIN_TOKEN        --project-name=iphoneduo-live
```

Generate each with `openssl rand -hex 32`. For local dev, copy `.env.example` to
`.dev.vars` and fill in the same two keys — `.dev.vars` is gitignored.

**Do not rotate `UNSUBSCRIBE_SECRET` casually.** Every unsubscribe link ever sent is
an HMAC under it, so changing it invalidates all of them at once.

### 5. Run it

```bash
pnpm dev        # Astro dev server — pages only, Functions do not run
pnpm preview    # astro build + wrangler pages dev — Functions, D1 and KV all live
pnpm deploy     # astro build + wrangler pages deploy dist
```

Use `pnpm preview`, not `pnpm dev`, to test anything involving the form.

### Deploying without `wrangler login`

`wrangler login` needs a browser. If you cannot open one, `scripts/bundle-worker.mjs`
compiles `functions/` into a single Pages "advanced mode" worker that can be shipped
through the REST API instead:

```bash
pnpm build
node scripts/bundle-worker.mjs --into-dist   # dist/_worker.js, for local testing
wrangler pages dev dist                      # exercises the bundle, no auth needed
```

Then upload `dist/` as the asset manifest and pass `build/_worker.js` as the
`_worker.js` form field of `POST /accounts/:id/pages/projects/:name/deployments`.

This is a fallback, not the main path. `functions/` stays the single source of truth —
`scripts/worker-entry.ts` only imports those handlers and must never grow logic of its
own, or the two deploy routes would start behaving differently.

## Testing the three countdown states

`?now=` overrides the clock, client-side only:

```
/?now=2026-10-01T12:00:00Z    before preorders  → counts down to 16 Oct
/?now=2026-10-20T12:00:00Z    preorders open    → collapses, counts down to 23 Oct
/?now=2026-11-01T12:00:00Z    post-launch       → shipped state
```

All three states ship in the HTML with `hidden` toggled, so crawlers and no-JS
visitors get a coherent page and there is no flash or reflow when the script runs.

## Pulling the CSV export

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     https://iphoneduo.live/api/export -o subscribers.csv
```

401 on a missing or wrong token. The CSV includes an `unsubscribe_url` column with a
ready-made signed link per subscriber — nothing else generates those, so this export
is where they come from when you send a mailing.

## Signup hygiene

There is no confirmation email, so junk is filtered at submit time:

1. Hidden honeypot field — if filled, the response is a normal-looking redirect to
   `/thanks` and **nothing is written**, so a bot learns nothing.
2. Submissions faster than 2s are rejected. Elapsed time is measured entirely in the
   browser and posted as a duration, not a timestamp, so client clock skew cannot
   cause a false reject.
3. Email syntax, then an MX lookup on the domain over DNS-over-HTTPS. The MX check
   **fails open**: if the resolver is unreachable we accept, because a DoH outage
   silently rejecting every signup is worse than a few junk domains.
4. KV rate limit, 5 per IP per hour. Only requests that pass steps 1–3 count against
   it, so a bot cannot exhaust a real visitor's budget from the same NAT.
5. `ON CONFLICT(email) DO NOTHING`, and the response is byte-identical whether the row
   was inserted or already existed — so the endpoint cannot be used to test whether an
   address is on the list.

**Known trade-off:** step 2 needs JavaScript to fill the elapsed field. A visitor with
JS disabled cannot sign up and is told to email instead. That is deliberate — it also
turns the timing check into a cheap no-JS bot filter — but it is a real exclusion.

## Consent records

`src/config/consent.ts` holds the checkbox wording and a `CONSENT_VERSION`. Every row
stores the version, so you can prove what a given person actually agreed to.

**Never edit `CONSENT_TEXT` without bumping `CONSENT_VERSION`** — otherwise existing
rows claim consent to wording that was never on screen when they signed up.

## Layout

```
functions/            Pages Functions (project root, NOT inside dist/)
  _middleware.ts        CSP + security headers on HTML responses
  api/subscribe.ts      POST only; honeypot → timing → syntax → MX → KV → D1
  api/export.ts         GET, bearer ADMIN_TOKEN, returns CSV
  unsubscribe.ts        GET ?token=…, HMAC verify, sets unsubscribed_at
migrations/           D1 schema
src/config/           facts.ts, milestones.ts, consent.ts
src/lib/server.ts     Function helpers. Under src/ so Pages never routes it.
src/pages/            index, privacy, thanks, 404, llms.txt, sitemap.xml
```

`wrangler pages deploy dist` must be run from the project root so that `functions/`
is picked up — it is resolved relative to the working directory, not to `dist/`.
