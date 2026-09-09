# iphones

Static sites for three domains, hosted on Cloudflare Pages (free tier).

## Structure

| Folder | Domain | Pages project |
|---|---|---|
| `iphoneduo-live/` | [iphoneduo.live](https://iphoneduo.live) | `iphoneduo-live` |
| `iphoneduo-click/` | [iphoneduo.click](https://iphoneduo.click) | `iphoneduo-click` |
| `iphonetrio-com/` | [iphonetrio.com](https://iphonetrio.com) | `iphonetrio-com` |

Each folder is an independent static site with its own Pages project. `iphonetrio-com`
is the iPhone Trio parody page; the other two are still placeholders.

## Cloudflare setup

All three zones are on the **Free Website** plan, nameservers `karl` / `nina.ns.cloudflare.com`.

**DNS** — apex `CNAME` to the matching `*.pages.dev`, proxied.

**SSL/TLS** — Universal SSL, mode Full, Always Use HTTPS, Automatic HTTPS Rewrites,
TLS 1.3, Opportunistic Encryption.

**Bots** — all allowed. Bot Fight Mode off, AI bot protection disabled, crawler
protection disabled, Security Level `essentially_off`, Browser Integrity Check off.

**Email** — Email Routing enabled with a catch-all forwarding every address to
`mucahityilmaz@gmail.com`. Anything at `*@<domain>` lands in Gmail.

## Deploying

One-time auth (needs a browser):

```
npx wrangler login
```

Then deploy a single site:

```
npx wrangler pages deploy iphonetrio-com --project-name=iphonetrio-com
```

Substitute the folder and project name from the table above. The folder name and the
Pages project name are always identical.

## Local preview

```
npx wrangler pages dev iphonetrio-com
```
