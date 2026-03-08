export type ContentItem = {
    index: number
    type: string
    emoji: string
    title: string
    body: string
    total: number
}

type ContentGenerator = (ctx: { sats: number }) => ContentItem | Promise<ContentItem>

// --- Static content pools ---

const funFacts: string[] = [
    "Honey never expires. Archaeologists found 3000-year-old honey in Egyptian tombs!",
    "Octopuses have three hearts and blue blood!",
    "A group of flamingos is called a flamboyance!",
    "Bananas are berries, but strawberries aren't!",
    "Sharks are older than trees. Sharks: 400 million years. Trees: 350 million.",
    "A day on Venus is longer than a year on Venus!",
    "Cows have best friends and get stressed when separated!",
    "Wombat poop is cube-shaped. No one knows exactly why!",
    "Sea otters hold hands while sleeping so they don't drift apart!",
    "A bolt of lightning is 5x hotter than the surface of the Sun!",
]

const challenges: string[] = [
    "Do 10 jumping jacks right now! GO!",
    "Spin around 5 times then try to walk straight!",
    "Do your best robot dance for 15 seconds!",
    "Balance on one foot for 30 seconds!",
    "Make the silliest face you can possibly make!",
    "Do 5 star jumps as fast as you can!",
    "Try to wiggle your ears. Can you do it?",
    "Hop on one foot 10 times without stopping!",
    "Touch your elbows behind your back. Impossible? Try it!",
    "Freeze like a statue for 20 seconds. No moving!",
]

const phrases: string[] = [
    "Future millionaire loading...",
    "1 sat = 1 sat",
    "Stack sats, stay humble.",
    "Oscar's sats are growing while he sleeps!",
    "Patience is a superpower.",
    "Tick tock, next block!",
    "Every sat counts!",
    "Slowly, then suddenly.",
    "The piggy bank never sleeps.",
    "Diamond hands!",
]

const emojiStories: string[][] = [
    ["a lion", "a cake", "a rocket"],
    ["an octopus", "lightning", "a castle"],
    ["a fox", "a rainbow", "pizza"],
    ["a whale", "a guitar", "the moon"],
    ["a unicorn", "a map", "a diamond"],
    ["a dragon", "books", "a star"],
    ["a shark", "a circus", "a key"],
    ["a penguin", "a mountain", "a gift"],
    ["a parrot", "pirates", "ice cream"],
    ["a frog", "the ocean", "a crown"],
]

const tongueTwisters: string[] = [
    "Red lorry, yellow lorry. Say it 5 times fast!",
    "She sells seashells by the seashore. Faster!",
    "How much wood would a woodchuck chuck? GO!",
    "Unique New York. Say it 10 times fast!",
    "Toy boat. Toy boat. Toy boat. Toy boat. Keep going!",
]

const mathPuzzles: string[] = [
    "If you have 100 sats and get 50 more every day, how many after a week?",
    "What's 7 x 8? Think before you peek!",
    "If 3 cats catch 3 mice in 3 minutes, how many cats catch 100 mice in 100 min?",
    "What comes next? 2, 4, 8, 16, ...",
    "You have 21 sats. You double them 3 times. How many now?",
]

// --- Helpers ---

function formatSats(sats: number): string {
    return sats.toLocaleString("en-US")
}

async function fetchBtcPriceEur(): Promise<number | null> {
    try {
        const res = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur",
            { next: { revalidate: 300 } }
        )
        const data = await res.json()
        return data.bitcoin?.eur ?? null
    } catch {
        return null
    }
}

function daysUntil(month: number, day: number): number {
    const now = new Date()
    const target = new Date(now.getFullYear(), month - 1, day)
    if (target < now) target.setFullYear(target.getFullYear() + 1)
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// --- "What can you buy?" conversions ---

type BuyableItem = { name: string, emoji: string, priceEur: number }

const buyableItems: BuyableItem[] = [
    { name: "ice creams", emoji: "🍦", priceEur: 2.50 },
    { name: "pizza slices", emoji: "🍕", priceEur: 3.00 },
    { name: "Lego minifigures", emoji: "🧱", priceEur: 4.00 },
    { name: "Pokemon cards", emoji: "🃏", priceEur: 5.00 },
    { name: "chocolate bars", emoji: "🍫", priceEur: 1.50 },
    { name: "bouncy balls", emoji: "🏀", priceEur: 1.00 },
    { name: "stickers packs", emoji: "⭐", priceEur: 2.00 },
    { name: "hot dogs", emoji: "🌭", priceEur: 2.50 },
]

function makeBuyableGenerator(item: BuyableItem): ContentGenerator {
    return async ({ sats }) => {
        const price = await fetchBtcPriceEur()
        if (!price) {
            return {
                index: 0, type: "conversion", emoji: item.emoji,
                title: `${item.emoji} How many?`,
                body: "Can't check the price\nright now. Try again soon!",
                total: 0,
            }
        }
        const euros = (sats / 100_000_000) * price
        const count = Math.floor(euros / item.priceEur)
        return {
            index: 0, type: "conversion", emoji: item.emoji,
            title: `You could buy...`,
            body: `${count} ${item.name}!\nYour sats are worth about EUR ${Math.round(euros)}.`,
            total: 0,
        }
    }
}

// --- Build generators per type ---

function makeStatic(type: string, emoji: string, title: string, body: string): ContentGenerator {
    return () => ({ index: 0, type, emoji, title, body, total: 0 })
}

function buildTypeBuckets(): Record<string, ContentGenerator[]> {
    const buckets: Record<string, ContentGenerator[]> = {}

    // Fun facts
    buckets.fact = funFacts.map(f => makeStatic("fact", "🧠", "Did you know?", f))

    // Challenges
    buckets.challenge = challenges.map(c => makeStatic("challenge", "💪", "Challenge!", c))

    // Phrases
    buckets.phrase = phrases.map(p => makeStatic("phrase", "✨", "", p))

    // Emoji stories
    buckets["emoji-story"] = emojiStories.map(e =>
        makeStatic("emoji-story", "📖", "Make up a story!", e.join(", "))
    )

    // Tongue twisters
    buckets.twister = tongueTwisters.map(t => makeStatic("twister", "👅", "Tongue twister!", t))

    // Math puzzles
    buckets.puzzle = mathPuzzles.map(m => makeStatic("puzzle", "🔢", "Quick math!", m))

    // "What can you buy" conversions (dynamic)
    buckets.conversion = buyableItems.map(makeBuyableGenerator)

    // Christmas countdown
    buckets.countdown = [
        () => {
            const days = daysUntil(12, 25)
            return {
                index: 0, type: "countdown", emoji: "🎄",
                title: "Christmas countdown",
                body: days === 0 ? "MERRY CHRISTMAS!"
                    : days === 1 ? "TOMORROW IS CHRISTMAS!"
                    : `${days} days until Christmas!`,
                total: 0,
            }
        },
    ]

    return buckets
}

// --- Round-robin interleave with balance every 5th ---

function buildSequence(): ContentGenerator[] {
    const buckets = buildTypeBuckets()
    const typeOrder = ["fact", "challenge", "conversion", "emoji-story", "phrase", "twister", "puzzle", "countdown"]

    // Track position within each bucket
    const cursors: Record<string, number> = {}
    for (const t of typeOrder) cursors[t] = 0

    const balance: ContentGenerator = ({ sats }) => ({
        index: 0, type: "balance", emoji: "₿",
        title: "Oscar's Bitcoin Stash",
        body: `${formatSats(sats)} sats`,
        total: 0,
    })

    const sequence: ContentGenerator[] = []
    let typeIdx = 0

    // Total non-balance items across all buckets
    const totalItems = Object.values(buckets).reduce((sum, b) => sum + b.length, 0)

    for (let placed = 0; placed < totalItems;) {
        // Every 5th position is balance
        if (sequence.length % 5 === 0) {
            sequence.push(balance)
        }

        // Pick next item, round-robin through types
        let found = false
        for (let tries = 0; tries < typeOrder.length; tries++) {
            const type = typeOrder[typeIdx % typeOrder.length]
            typeIdx++
            const bucket = buckets[type]
            if (bucket && cursors[type] < bucket.length) {
                sequence.push(bucket[cursors[type]])
                cursors[type]++
                placed++
                found = true
                break
            }
        }
        if (!found) break
    }

    return sequence
}

const sequence = buildSequence()

export async function getContentItem(index: number, sats: number): Promise<ContentItem> {
    const idx = index % sequence.length
    const generator = sequence[idx]
    const item = await generator({ sats })
    return { ...item, index: idx, total: sequence.length }
}

export function getPoolInfo() {
    return {
        totalItems: sequence.length,
    }
}
