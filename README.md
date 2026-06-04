# Private AI Roleplay

A privacy-first, browser-based AI roleplay application. Your API key and conversations exist only in your browser's memory — nothing is ever stored server-side.

> **Live demo**: [roleplay.beeroolabs.com](https://roleplay.beeroolabs.com)

## Architecture

```
Browser (React + Zustand)  →  Cloudflare Worker (stateless relay)  →  DeepSeek API
```

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Zustand
- **Backend**: Cloudflare Worker — pure stateless proxy
- **Zero persistence**: No D1, KV, R2, Durable Objects, or any database
- **Privacy**: API key in browser memory only, lost on page refresh

## Quick Start

```bash
npm install
npm run dev              # Frontend on :5173
cd worker && npm run dev # Worker on :8787
```

The Vite dev server proxies `/api` → `localhost:8787`.

## Features

- 🎭 **10 built-in characters**: 4 fantasy (Fantasy Mage, Cyberpunk Hacker, Space Captain, Noir Detective) + 6 real-world experts (Maths Professor, Life Guidance Counselor, Systems Architect, History Scholar, Culinary Chef, Wilderness Naturalist)
- ✨ **Custom characters**: Create, edit, delete your own personas
- 📝 **Markdown templates**: Add new built-in characters by creating a `.md` file — no coding required
- 💬 **Streaming chat**: Real-time SSE streaming from DeepSeek with 120s timeout
- ✏️ **Edit messages**: Backtrack to any previous message and branch the conversation
- 📥 **Export sessions**: Download conversations as JSON files
- 📤 **Import sessions**: Restore previous conversations (validated, 5 MB cap, sanitized rendering)
- 🔒 **Privacy-first**: Nothing stored server-side. No logging of sensitive data
- 🔑 **BYOK**: Bring your own DeepSeek key — never sent anywhere but DeepSeek
- ℹ️ **About modal**: Privacy education and API key best practices
- 🌙 **Dark mode**: Always-on dark theme
- 📱 **Responsive**: Works on desktop and mobile

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm test` | Run all tests (Vitest) |
| `npm run lint` | ESLint check |
| `npm run format` | Prettier format |
| `cd worker && npm run dev` | Start Worker dev server |
| `cd worker && npm test` | Run Worker tests |

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `/api` | Worker API base URL |

For production builds pointing to a deployed Worker:

```bash
VITE_API_BASE_URL=https://your-worker.workers.dev/api npm run build
```

## Deployment

The app runs as a single Cloudflare Worker serving both the frontend and the API relay. See [`CLOUDFLARE.md`](./CLOUDFLARE.md) for the full guide.

```bash
npm run build
cd worker && npx wrangler deploy
```

## Project Structure

```
src/
├── components/     # React components (chat, sidebar, modals, editor)
├── stores/         # Zustand stores (apiKey, character, chat, UI)
├── types/          # TypeScript interfaces (Character, Message, Session)
├── utils/          # Prompt builder, context manager, session I/O, UUID
└── characters/     # Built-in character templates (Markdown-based)
worker/
├── src/index.ts    # Cloudflare Worker fetch handler
└── wrangler.toml   # Zero storage configuration
```

## Testing

- **61 tests**, 100% passing
- Frontend: Vitest + React Testing Library + jsdom
- Worker: Vitest (direct module import)
- Covers: session I/O validation, prompt building, context trimming, store operations, component rendering, worker integration
