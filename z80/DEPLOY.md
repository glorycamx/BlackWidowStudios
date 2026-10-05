# Deploying z80.si

The site runs on **Cloudflare Workers** (via the OpenNext adapter). Hostinger is only needed as the place the domain is registered.

## 1. Put z80.si on Cloudflare (one time)

1. In Cloudflare: **Add a domain** → `z80.si` → Free plan. Cloudflare shows two nameservers.
2. In Hostinger: **Domains → z80.si → DNS / Nameservers → Change nameservers**, and paste Cloudflare's two nameservers.
3. Wait until Cloudflare says the domain is **Active** (usually minutes, up to a few hours).

## 2. Connect the repo (no tokens needed)

Cloudflare dashboard → **Workers & Pages → Create → Import a repository**:

| Setting | Value |
| --- | --- |
| Repository | `glorycamx/blackwidowstudios` |
| Branch | `claude/determined-tesla-utoafx` (or `main` once merged) |
| Root directory | `z80` |
| Build command | `npx opennextjs-cloudflare build` |
| Deploy command | `npx opennextjs-cloudflare deploy` |

`wrangler.jsonc` already attaches `z80.si` and `www.z80.si` as custom domains, so the first deploy puts the site live there. Every push to the branch redeploys.

## Or deploy from a terminal

```bash
cd z80
npm install
npx wrangler login     # or set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID
npm run deploy
```

Preview locally in the Cloudflare runtime first with `npm run cf:preview`.

## Notes

- No secrets are required. The demo runs in the browser; the API routes fall back to the built-in mock planner.
- To use a real model later, add `Z80_AI_API_KEY` as a secret: `npx wrangler secret put Z80_AI_API_KEY`.
