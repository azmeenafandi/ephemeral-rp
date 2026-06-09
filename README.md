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

## What's New in v1.1.0

- 🎭 **OOC slash commands**: Type `/ooc Be more verbose` to steer the AI's behavior mid-conversation. Type `/ooc` alone to manage directives in a modal panel.
- 🤖 **AI character generation**: Fill in Name + Description, hit Generate, and DeepSeek creates Personality, Scenario, Greeting, Voice Hints, and Rules for you.
- 🛡️ **Error resilience**: Automatic retry with exponential backoff, circuit breaker for upstream failures, and rate limiting in the Worker.
- 🔑 **Smart auth errors**: Bad API keys show a specific "check your key in Settings" message instead of a generic error.
- 📦 **Session v1.1.0**: Exports now carry `appVersion` and dedicated `oocInstructions` — no more amber bubbles in exported files.
- 🧪 **122 tests**: Doubled test coverage with streaming, error path, resilience, and edge case tests.
- 🏗️ **Architecture improvements**: Extracted shared components (Modal, ErrorBanner, Spinner, MarkdownContent), eliminated circular store dependencies, reduced chatStore size by 34%.

## Features

- 🎭 **10 built-in characters**: 4 fantasy (Fantasy Mage, Cyberpunk Hacker, Space Captain, Noir Detective) + 6 real-world experts (Maths Professor, Life Guidance Counselor, Systems Architect, History Scholar, Culinary Chef, Wilderness Naturalist)
- ✨ **Custom characters**: Create, edit, delete your own personas with AI-powered field generation
- 📝 **Markdown templates**: Add new built-in characters by creating a `.md` file — no coding required
- 💬 **Streaming chat**: Real-time SSE streaming from DeepSeek with 180s timeout and chunk-boundary buffering
- ✏️ **Edit messages**: Backtrack to any previous message and branch the conversation
- 📥 **Export sessions**: Download conversations as JSON files (v1.1.0 format)
- 📤 **Import sessions**: Restore previous conversations, including legacy v1.0.0 format (validated, 5 MB cap, sanitized rendering)
- 🔒 **Privacy-first**: Nothing stored server-side. No logging of sensitive data
- 🔑 **BYOK**: Bring your own DeepSeek key — never sent anywhere but DeepSeek
- 🚨 **Error boundary**: Graceful crash recovery with reload button — no white screens
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
├── components/     # React components (chat, sidebar, modals, editor, ErrorBoundary, ErrorBanner)
├── stores/         # Zustand stores (apiKey, character, chat, UI, chatHelpers)
├── types/          # TypeScript interfaces (Character, Message, Session)
├── utils/          # Prompt builder, context manager, session I/O, validate, slash commands, errors
├── characters/     # Built-in character templates (Markdown-based, load.ts)
└── test/           # Shared test factories
worker/
├── src/
│   ├── index.ts       # Cloudflare Worker fetch handler
│   ├── resilience.ts   # Retry with backoff + circuit breaker
│   └── rateLimiter.ts  # IP-based rate limiter
└── wrangler.toml       # Zero storage configuration
```

## Testing

- **122 tests**, 100% passing (62 state/utility + 34 chatStore streaming/error paths + 13 resilience + 13 error/edge cases)
- Frontend: Vitest + React Testing Library + jsdom
- Worker: Vitest (direct module import)
- Covers: session I/O validation, prompt building, context trimming, store operations, component rendering, worker integration, streaming SSE, error paths, circuit breaker, rate limiter, OOC lifecycle, message editing, session import/export
