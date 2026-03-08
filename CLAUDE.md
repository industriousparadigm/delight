# Delight — Agent Instructions

Content API for a Bitcoin piggy bank (ESP32 + e-ink). Serves fun, kid-friendly content items on rotation.

## Architecture

```
src/
├── app/
│   ├── api/delight/route.ts   # GET endpoint — ESP32 hits this
│   ├── layout.tsx             # Root layout, Google Fonts (Fredoka, DM Sans, DM Mono)
│   ├── page.tsx               # Web UI — visual preview of content pool
│   └── globals.css            # "Playground" theme — bright colored cards, paper-cut shadows
└── lib/
    └── content.ts             # All content lives here. Static arrays + dynamic generators.
```

## Key concepts

- **Content pool:** 70 items. Mix of static (jokes, facts, challenges) and dynamic (sats→EUR, countdowns).
- **Sequencing:** `buildSequence()` interleaves balance every 4th position. ESP32 tracks index client-side.
- **No database.** Content is code. Adding items = editing `content.ts` arrays.
- **No auth.** Public API. The ESP32 is the only consumer.

## API contract

```
GET /api/delight?index=N&sats=N
→ { index, type, emoji, title, body, total }
```

ESP32 sends its counter + current sats balance. API returns the content item at `index % total`. The response shape must stay stable — the firmware parses these exact fields.

## Content rules

- **Short text only.** E-ink is 250×122 pixels. Body text max ~120 chars. Use `\n` for line breaks.
- **Kid-friendly.** Oscar is 5, Diana is 8. Keep it simple, fun, surprising.
- **Types:** balance, joke, fact, challenge, phrase, emoji-story, conversion, countdown.
- Each type has a color in the web UI (defined in `globals.css` as `.card-{type}`).

## Adding content

1. Open `src/lib/content.ts`
2. Add strings to the relevant array (`jokes`, `funFacts`, `challenges`, `phrases`, `emojiStories`)
3. For new dynamic items, add a generator function to `buildGenerators()`
4. Total pool size updates automatically

## Styling

"Playground" theme — intentionally playful, not corporate:
- Cream background with dot grid
- Colored cards per content type (coral, sky, mint, sun, grape, tangerine, blush, ocean)
- Fredoka font (rounded, bubbly) for headings
- Paper-cut shadows (offset, no blur)
- Tape strips on hero card
- Wobble animation on hover

## Code style

- No semicolons
- 4-space indentation
- TypeScript strict

## Dynamic content

- **Sats conversion:** Fetches BTC/EUR from CoinGecko, cached 5 min via Next.js `revalidate`. Falls back gracefully if API is down.
- **Countdown:** Hardcoded Dec 25. Add more by adding `daysUntil()` calls in `buildGenerators()`.
- **Future:** Birthday countdowns (need Oscar + Diana's dates), weather, daily animal.

## Testing locally

```bash
npm run dev
curl "http://localhost:3000/api/delight?index=0&sats=238931"
```

## Deployment

Vercel hobby tier. No env vars needed. Auto-deploys from GitHub main branch.
