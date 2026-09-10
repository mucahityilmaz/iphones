# iphones

Three domains, each hosted on Cloudflare Pages (free tier).

## Structure

| Folder | Domain | Pages project | Kind |
|---|---|---|---|
| `iphoneduo-live/` | [iphoneduo.live](https://iphoneduo.live) | `iphoneduo-live` | Astro app — see its own [README](iphoneduo-live/README.md) |
| `iphoneduo-click/` | [iphoneduo.click](https://iphoneduo.click) | `iphoneduo-click` | Plain static, placeholder |
| `iphonetrio-com/` | [iphonetrio.com](https://iphonetrio.com) | `iphonetrio-com` | Plain static, iPhone Trio parody page |

`iphoneduo-live` is a build-step project (Astro + Tailwind, with Pages Functions, D1
and KV). The other two are hand-written HTML deployed as-is. They deploy differently —
see below.

## Cloudflare setup

All three zones are on the **Free Website** plan, nameservers `karl` / `nina.ns.cloudflare.com`.

**DNS** — apex `CNAME` to the matching `*.pages.dev`, proxied. `www` `CNAME` to the
apex, proxied, with a static 301 Single Redirect rule sending `www` → apex.

**SSL/TLS** — Universal SSL, mode Full, Always Use HTTPS, Automatic HTTPS Rewrites,
TLS 1.3, Opportunistic Encryption.

**Bots** — all allowed. Bot Fight Mode off, AI bot protection disabled, crawler
protection disabled, Security Level `essentially_off`, Browser Integrity Check off.

**Email** — Email Routing enabled with a catch-all forwarding every address to
`mucahityilmaz@gmail.com`. Anything at `*@<domain>` lands in Gmail. Email Address
Obfuscation is off on all three zones, so `mailto:` addresses render literally.

## Deploying

One-time auth (needs a browser):

```
npx wrangler login
```

### The two static sites

```
npx wrangler pages deploy iphonetrio-com --project-name=iphonetrio-com
npx wrangler pages deploy iphoneduo-click --project-name=iphoneduo-click
```

The folder name and the Pages project name are always identical.

### iphoneduo.live

Has a build step, and must be deployed from inside its own directory so that
`functions/` is picked up:

```
cd iphoneduo-live
pnpm install
pnpm deploy          # astro build && wrangler pages deploy dist
```

Full setup — D1, KV, secrets, migrations, CSV export — is in
[`iphoneduo-live/README.md`](iphoneduo-live/README.md).

## Local preview

```
npx wrangler pages dev iphonetrio-com          # static sites
cd iphoneduo-live && pnpm preview              # Astro app, with D1 + KV bound
```
