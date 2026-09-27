# Worldstreams

Worldstreams is a responsive discovery experience for interactive AI video worlds. It loads the public world catalog from the Sequencer API, keeps a small offline fallback, and hands each selection to its live public player on worldstreams.ai.

Gemini powers the world finder. Visitors describe a mood, story, or place, and Gemini recommends three experiences from the live catalog.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
cp .env.example .env
npm run dev
```

Add `GEMINI_API_KEY` to `.env` to enable Gemini locally. Without a key, the interface uses a deterministic catalog matcher so the complete experience remains testable. Never commit `.env`.

## Verify

```bash
npm run check
```

This runs unit tests, a credential scan, a production build, and endpoint smoke tests.

## Publish with Google AI Studio

1. Import the GitHub repository into Google AI Studio Build mode.
2. Add `GEMINI_API_KEY` as a server-side secret.
3. Preview the app, then select **Deploy to Cloud Run**.
4. Assign the generated `*.ai.studio` address when prompted.

Cloud Run provides `PORT` automatically. The app keeps the Gemini key on the server and does not expose credentials to the browser.
