# Cloudflare Deployment Guide

Zero-to-deployed for the Private AI Roleplay application on Cloudflare's Free plan.

**Read every step. Don't skip.** Cloudflare uses confusingly similar names for different things — pay attention to exact field names and values.

---

## Before You Start

You need these ready:

- A **[Cloudflare account](https://dash.cloudflare.com/sign-up)** (free, no credit card)
- A **[DeepSeek API key](https://platform.deepseek.com)** (free to create)
- This project built locally: `npm run build` succeeds

---

## ⚠️ CRITICAL: Two Different Credential Types

Cloudflare has TWO completely different credentials with confusingly similar names. Using the wrong one is the #1 mistake. You must create the right type.

| | Global API Key | API Token |
|---|---|---|
| **What it looks like** | 32 hex characters: `833e192bb77b00e18778f9300dd55d78` | Long random string, may start with `d1p_` or similar |
| **Where to find it** | [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) → "Global API Key" (click "View") | [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) → "Create Token" |
| **Env var name** | `CLOUDFLARE_API_KEY` _(plus `CLOUDFLARE_EMAIL`)_ | `CLOUDFLARE_API_TOKEN` |
| **Works with Wrangler 4.x?** | ❌ **No.** Wrangler 4.x rejects it. | ✅ **Yes.** This is what you need. |

**Bottom line: You MUST create an API Token. The Global API Key will NOT work with Wrangler 4.x.**

---

## Step 1: Create a Cloudflare Account

Go to **[dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up)**.

Fill in email and password. Verify your email. You now have a Cloudflare account on the Free plan. No payment needed.

---

## Step 2: Create an API Token (NOT an API Key)

This is the credential Wrangler actually accepts. Do NOT use the "Global API Key" — it will fail with error `6111`.

### 2a. Go to the API Tokens page

Open **[dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)**.

### 2b. Create a custom token

Click the blue **"Create Token"** button.

You'll see several templates — **ignore all of them.** Scroll to the very bottom and click **"Create Custom Token"**.

### 2c. Configure the token

Fill in exactly these fields and nothing else:

| Field | What to enter |
|-------|--------------|
| **Token name** | `wrangler-deploy` (or any name you like — this is just a label) |
| **Permissions** — first row | |
|    _Scope_ | **Account** |
|    _Permission_ | **Workers Scripts** |
|    _Access_ | **Edit** |
| **Permissions** — second row | |
|    _Scope_ | **Account** |
|    _Permission_ | **Workers Assets** |
|    _Access_ | **Edit** |

**Do not add any other permissions.** Leave "Client IP Address Filtering", "TTL", and "Zone Resources" at their defaults (blank/unset).

### 2d. Create and copy

Click **"Continue to summary"** at the bottom.

Review that you have exactly 2 permissions (Workers Scripts: Edit, Workers Assets: Edit). Click **"Create Token"**.

**⚠️ Copy the token IMMEDIATELY.** It will only be shown once. If you lose it, you must create a new one.

The token is a long string. It may look like `d1p_xxxxxxxxxxxxx...` or just a random alphanumeric string. That's your `CLOUDFLARE_API_TOKEN`.

Paste it somewhere safe for the next step.

---

## Step 3: Set the Token and Deploy

### 3a. Set the environment variable

In your terminal, run this single command. Replace `<token>` with the token you just copied:

```bash
export CLOUDFLARE_API_TOKEN="<token>"
```

Do NOT add extra spaces, quotes inside the token, or newlines. It should be one continuous string.

If you're on WSL2, also add this line to your `~/.bashrc` so it persists across terminal sessions:

```bash
echo 'export CLOUDFLARE_API_TOKEN="<token>"' >> ~/.bashrc
```

Replace `<token>` with your actual token.

### 3b. Verify authentication

```bash
cd ~/public_projects/ephemereal-rp/worker
npx wrangler whoami
```

Expected output: your Cloudflare account email address. If you see "You are not authenticated", the token is wrong or not set.

### 3c. Build the frontend

The Worker serves the frontend as static assets, so we need the build output:

```bash
cd ~/public_projects/ephemereal-rp
npm run build
```

This creates the `dist/` folder with `index.html`, CSS, and JS files. The Worker's `wrangler.toml` points to `"../dist"` so these files are included when you deploy the Worker.

### 3d. Deploy

```bash
cd ~/public_projects/ephemereal-rp/worker
npx wrangler deploy
```

Expected output:

```
✔ Deployed private-ai-roleplay
Your worker is now live at:
https://private-ai-roleplay.<your-subdomain>.workers.dev
```

**That single URL is your entire application** — it serves both the frontend AND the API. No Pages needed.

---

## Step 4: Test the Deployment

### 4a. Test the frontend

Open your browser and go to:

```
https://private-ai-roleplay.<your-subdomain>.workers.dev
```

You should see:
- Dark themed page with **"Private AI Roleplay"** in the header
- A red dot with **"No API key"**
- Character dropdown in the sidebar with 4 characters
- Empty chat area with privacy feature icons

### 4b. Test the API

```bash
curl -s https://private-ai-roleplay.<your-subdomain>.workers.dev/api/chat
```

Should return:

```json
{"error":"Method not allowed. Use POST /api/chat"}
```

That 405 error means the Worker is running and validating requests. Perfect.

### 4c. Test with a missing API key

```bash
curl -s -X POST https://private-ai-roleplay.<your-subdomain>.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

Should return:

```json
{"error":"Missing or invalid API key"}
```

---

## Step 5: Try It Out

1. Open your Worker URL in a browser
2. Click the **⚙️ gear icon** in the header → Settings
3. Enter your DeepSeek API key (get one free at **[platform.deepseek.com](https://platform.deepseek.com/api_keys)**)
4. Click **Set** — the indicator turns green: **"Key set"**
5. Select a character from the sidebar dropdown (e.g., "Eldrin Starweaver")
6. Type a message and press **Enter**
7. The response streams in token by token

---

## Troubleshooting

### "You are not authenticated" from wrangler whoami

Your `CLOUDFLARE_API_TOKEN` is either not set, empty, or incorrect.

```bash
# Check if it's set (should show a long string)
echo "$CLOUDFLARE_API_TOKEN"

# If empty, re-export it
export CLOUDFLARE_API_TOKEN="<your-token>"
```

### "Invalid format for Authorization header [code: 6111]"

You're using a **Global API Key** instead of an **API Token**. Go back to Step 2 and create a proper API Token. The Global API Key (32 hex chars like `833e192...`) does not work with Wrangler 4.x. You MUST create an API Token.

### OAuth browser login not working (WSL2)

Skip it. The OAuth callback often fails on WSL2, Windows Subsytem for Linux, or remote servers. Use the API Token method in Step 2-3 instead — it bypasses the browser callback entirely.

### "✘ [ERROR] In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN"

Wrangler 4.x requires `CLOUDFLARE_API_TOKEN` specifically. `CLOUDFLARE_API_KEY` (the global key) is NOT accepted. Create the token in Step 2.

### "Cannot find module" or TypeScript errors on deploy

Run `npm run build` before deploying. The Worker needs the `dist/` folder to exist. If you skip the build step, the static assets won't be included.

### Worker URL shows blank page or 404

Make sure you ran `npm run build` in the project root BEFORE `wrangler deploy`. The `[assets]` binding in `wrangler.toml` points to `../dist` — if that folder is empty or missing, the frontend won't load.

---

## Redeploying After Code Changes

Whenever you modify the code:

```bash
# 1. Build the frontend
cd ~/public_projects/ephemereal-rp
npm run build

# 2. Deploy the Worker (which includes the updated frontend)
cd worker
npx wrangler deploy
```

That's it. One command deploys both the API and the frontend.

---

## Architecture Note

This application uses a **single Cloudflare Worker** for everything:

```
Browser
  │
  ▼
Cloudflare Worker (private-ai-roleplay.<you>.workers.dev)
  │
  ├── GET /*           → serves static frontend files (index.html, JS, CSS)
  │
  └── POST /api/chat   → stateless relay to DeepSeek API
```

No separate Pages project. No separate Worker. One URL for everything.

---

## Quick Reference

| What | Value |
|------|-------|
| Your app URL | `https://private-ai-roleplay.<you>.workers.dev` |
| API endpoint | `https://private-ai-roleplay.<you>.workers.dev/api/chat` |
| Cloudflare Dashboard | [dash.cloudflare.com](https://dash.cloudflare.com) |
| API Tokens page | [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) |
| DeepSeek API keys | [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) |

## Costs

| Service | Free Tier Limit | Your Usage |
|---------|----------------|------------|
| Cloudflare Workers | 100,000 requests/day, 10ms CPU/request | Well within limits |
| Worker static assets | Included with Workers | Your ~235KB of frontend files |
| DeepSeek API | $0.14 per 1M input tokens, $0.28 per 1M output tokens | Pay-as-you-go (~pennies per conversation) |

Total infrastructure cost: **$0/month**.
