# Delight

A fun content API for Oscar's Bitcoin piggy bank. Every 30 seconds (or on button press), the ESP32 e-ink display cycles through jokes, fun facts, challenges, emoji stories, sats-to-euro conversions, countdowns, and Bitcoin wisdom — with the balance screen woven in every 4th item.

## How it works

```
ESP32 piggy bank                    Delight API (Vercel)
┌──────────────┐     GET /api/delight?index=N&sats=238931
│  250×122     │ ──────────────────────────────────────────► ┌─────────────┐
│  e-ink       │                                             │ Next.js app │
│  display     │ ◄────────────────────────────────────────── │             │
└──────────────┘     { type, emoji, title, body, total }     │ 70 items:   │
                                                             │ jokes       │
counter++                                                    │ facts       │
every 30s                                                    │ challenges  │
                                                             │ conversions │
                                                             │ countdowns  │
                                                             └─────────────┘
```

The ESP32 tracks a simple counter. Each tick (or button press), it increments the counter and calls the API. The API returns the content item at that index (modulo pool size). Balance shows every 4th position. When the counter wraps, the whole pool cycles again.

## API

**`GET /api/delight?index=N&sats=N`**

| Param | Required | Description |
|-------|----------|-------------|
| `index` | yes | Current position in the content pool (0-based) |
| `sats` | yes | Current sats balance (for conversion/display items) |

**Response:**
```json
{
    "index": 3,
    "type": "joke",
    "emoji": "😄",
    "title": "Joke time!",
    "body": "Knock knock!\nWho's there?\nSatoshi.\nSatoshi who?\nExactly!",
    "total": 70
}
```

**Content types:** `balance`, `joke`, `fact`, `challenge`, `phrase`, `emoji-story`, `conversion`, `countdown`

## Content pool (70 items)

| Type | Count | What |
|------|-------|------|
| Balance | woven in every 4th | Oscar's sats balance |
| Jokes | 10 | Bitcoin puns + kid jokes |
| Fun facts | 10 | Animals, space, food — weird and wonderful |
| Challenges | 10 | Physical/silly things to do right now |
| Phrases | 10 | Bitcoin wisdom + motivational one-liners |
| Emoji stories | 10 | 3 random emojis — kids make up a story |
| Conversion | 1 | Sats → EUR → ice cream count (live BTC price) |
| Countdown | 1 | Days until Christmas |

Adding content: edit `src/lib/content.ts`. Static items are arrays of strings. Dynamic items are async generator functions.

## Web UI

The app also serves a visual preview at `/` — see what the piggy bank is currently showing, browse through the pool, auto-play the rotation.

## Running locally

```bash
npm install
npm run dev    # starts on http://localhost:3000
```

Test the API:
```bash
curl "http://localhost:3000/api/delight?index=0&sats=238931"
```

## Deploy to Vercel

1. Push to GitHub
2. Import in Vercel (hobby tier is fine — this does ~200 requests/day)
3. No env vars needed (BTC price fetched from CoinGecko public API)
4. Note the deployment URL — this goes into the ESP32 firmware

## Tech stack

- Next.js 16 (App Router)
- TypeScript (strict)
- Tailwind CSS v4
- No database — content pool is code
- CoinGecko API for live BTC/EUR price (cached 5 min)

## Related

- **Firmware:** [industriousparadigm/oscars-bitcoin-stash](https://github.com/industriousparadigm/oscars-bitcoin-stash) (private)
- **Project docs:** `~/Dev/Work/ai-command-center/projects/bitcoin-piggybank/`
