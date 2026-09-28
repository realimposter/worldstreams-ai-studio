# Worldstreams

Worldstreams is a responsive discovery experience for interactive AI video worlds. It loads the public world catalog from the Sequencer API and opens every world in an interactive simulated stream with demo media, audience choices, prompts, reactions, and chat.

Gemini powers the world finder. Visitors describe a mood, story, or place, and Gemini recommends three experiences from the live catalog.

The stream interactions run locally for demonstration and never write to production. Public catalog details and available demo media remain externally hosted.

Each world supports a four-part stream sequence. Viewers vote during a 15-second beat, the selected prompt moves into the lead, and its matching clip plays next. The sequence loops continuously.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
cp .env.example .env
npm run dev
```

Add `GEMINI_API_KEY` to `.env` to enable Gemini locally. Without a key, the interface uses a deterministic catalog matcher so the complete experience remains testable. Never commit `.env`.

## Generate stream clips

Gemini Omni 1.1 Flash generates up to 10 seconds per clip. Worldstreams plays each generated clip at a calibrated rate as a smooth 15-second stream beat.

Preview a world's four prompts without generating media:

```bash
node scripts/generate-omni-clips.mjs --world "Space Mission" --dry-run
```

Generate the four linked clips using the server-side key in the ignored `.env` file:

```bash
npm run generate:streams -- --world "Space Mission" --confirm-generation
```

Use `--all --confirm-generation` to generate clips for every published world. Generated clips and their manifest are written to `public/streams/<publicId>/`.

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
