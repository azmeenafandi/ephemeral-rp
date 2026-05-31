# Private AI Roleplay

A privacy-first, browser-based AI roleplay application. Your API key and conversations exist only in your browser's memory — nothing is ever stored server-side.

## Architecture

```
Browser (React + Zustand)  →  Cloudflare Worker (stateless relay)  →  DeepSeek API
```

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Zustand
- **Backend**: Cloudflare Worker — pure stateless proxy
- **Zero persistence**: No D1, KV, R2, Durable Objects, or any database
- **Privacy**: API key in browser memory only, lost on page refresh

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (frontend on :5173, worker on :8787)
npm run dev        # in one terminal
cd worker && npm run dev  # in another terminal

# Or with worker proxy:
# The Vite dev server proxies /api → localhost:8787
```

## Features

- 🎭 **4 built-in characters**: Fantasy Mage, Cyberpunk Hacker, Space Captain, Noir Detective
- ✨ **Custom characters**: Create, edit, delete your own personas
- 💬 **Streaming chat**: Real-time SSE streaming from DeepSeek
- 📥 **Export sessions**: Download conversations as JSON files
- 📤 **Import sessions**: Restore previous conversations
- 🔒 **Privacy-first**: Nothing stored server-side. No logging of sensitive data.
- 🌙 **Dark mode**: Always-on dark theme
- 📱 **Responsive**: Works on desktop and mobile

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm test` | Run all frontend tests (Vitest) |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |
| `cd worker && npm run dev` | Start Worker dev server |
| `cd worker && npm test` | Run Worker tests |

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api` | Worker API base URL. Set to deployed Worker URL in production |

For Cloudflare Pages production builds:
```bash
VITE_API_BASE_URL=https://your-worker.workers.dev/api npm run build
```

## Deployment

### Frontend (Cloudflare Pages)
```bash
npm run build
npx wrangler pages deploy dist
```

### Worker (Cloudflare Workers)
```bash
cd worker
npx wrangler deploy
```

Set the `VITE_API_BASE_URL` env var in Cloudflare Pages to point to your deployed Worker URL.

## Project Structure

```
src/
├── components/     # React components
├── stores/         # Zustand stores (apiKey, character, chat, UI)
├── types/          # TypeScript interfaces
├── utils/          # Prompt builder, context manager, session I/O
└── characters/     # Built-in character definitions
worker/
├── src/index.ts    # Cloudflare Worker fetch handler
└── wrangler.toml    # Zero storage configuration
```

## Testing

- **69 tests total**, 100% passing
- Frontend: Vitest + React Testing Library + jsdom
- Worker: Vitest (direct module import)
- Covers: session I/O validation, prompt building, context trimming, store operations, component rendering, worker validation
