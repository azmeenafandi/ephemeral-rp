# Cloudflare Deployment

This project runs as a single Cloudflare Worker that serves both the frontend (static assets) and the API proxy (`/api/chat`).

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier)
- A [DeepSeek API key](https://platform.deepseek.com/api_keys)

## 1. Create an API Token

Wrangler 4.x requires an **API Token** — the Global API Key will not work.

1. Go to [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token** → **Create Custom Token** (at the bottom)
3. Configure two permissions:

   | Scope | Permission | Access |
   |-------|-----------|--------|
   | Account | Workers Scripts | Edit |
   | Account | Workers Assets | Edit |

4. Click through to create, then **copy the token immediately** — it's shown only once.

## 2. Authenticate

```bash
export CLOUDFLARE_API_TOKEN="<your-token>"
```

Verify:

```bash
npx wrangler whoami
```

## 3. Deploy

Build the frontend, then deploy. The Worker includes frontend assets via its `[assets]` binding in `wrangler.toml`.

```bash
npm run build
cd worker && npx wrangler deploy
```

Your app is now live at the URL shown in the output (e.g. `https://private-ai-roleplay.<you>.workers.dev`).

## Redeploying After Changes

```bash
npm run build
cd worker && npx wrangler deploy
```

## Architecture

```
Browser
  │
  ▼
Cloudflare Worker
  │
  ├── GET /*            → serves static frontend (index.html, JS, CSS)
  └── POST /api/chat    → stateless relay to DeepSeek API
```

No separate Pages project or database — one Worker, one URL.

## Troubleshooting

| Problem | Solution |
|---|---|
| `You are not authenticated` | `CLOUDFLARE_API_TOKEN` is not set or empty |
| `Invalid format for Authorization header [code: 6111]` | You're using a Global API Key — create an API Token instead (Step 1) |
| `requires a CLOUDFLARE_API_TOKEN` | Only `CLOUDFLARE_API_TOKEN` works in Wrangler 4.x, not `CLOUDFLARE_API_KEY` |
| Worker URL shows blank page or 404 | Run `npm run build` before deploying — the `dist/` folder must exist |
| TypeScript errors on deploy | Run `npm run build` first to compile |
