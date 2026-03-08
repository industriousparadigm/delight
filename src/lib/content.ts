export type ContentItem = {
    index: number
    type: string
    emoji: string
    title: string
    body: string
    total: number
}

type ContentGenerator = (ctx: { sats: number }) => ContentItem | Promise<ContentItem>

const jokes: string[] = [
    "Why did Bitcoin break up with fiat?\nToo many trust issues!",
    "What did the Bitcoin say to the euro?\nYou're not my type.",
    "Knock knock!\nWho's there?\nSatoshi.\nSatoshi who?\nExactly!",
    "Why don't Bitcoiners ever get cold?\nThey're always HODLing!",
    "What's a pirate's favorite crypto?\nBitcoin... because of the block-ARRR-chain!",
    "Why was the computer cold?\nIt left its Windows open!",
    "What do you call a sleeping dinosaur?\nA dino-snore!",
    "Why can't your nose be 12 inches?\nBecause then it'd be a foot!",
    "What do you call a dog magician?\nA Labracadabrador!",
    "Why did the math book look sad?\nIt had too many problems!",
]

const funFacts: string[] = [
    "Honey never expires.\nArchaeologists found 3000-year-old\nhoney in Egyptian tombs. Still good!",
    "Octopuses have three hearts\nand blue blood!",
    "A group of flamingos\nis called a flamboyance!",
    "Bananas are berries,\nbut strawberries aren't!",
    "The shortest war in history lasted\n38 to 45 minutes.\nBritain vs Zanzibar, 1896.",
    "Sharks are older than trees.\nSharks: 400 million years.\nTrees: 350 million years.",
    "A day on Venus is longer\nthan a year on Venus!",
    "Cows have best friends and get\nstressed when separated!",
    "The inventor of the Pringles can\nis buried in one!",
    "Wombat poop is cube-shaped.\nNo one knows exactly why!",
]

const challenges: string[] = [
    "Do 10 jumping jacks\nright now! GO!",
    "Try to touch your toes\nwithout bending your knees!",
    "Spin around 5 times\nthen try to walk straight!",
    "Do your best robot dance\nfor 15 seconds!",
    "Say 'red lorry yellow lorry'\n5 times fast!",
    "Balance on one foot\nfor 30 seconds!",
    "Make the silliest face\nyou can possibly make!",
    "Do 5 star jumps\nas fast as you can!",
    "Try to wiggle your ears.\nCan you do it?",
    "Clap your hands behind\nyour back 10 times!",
]

const phrases: string[] = [
    "Future millionaire loading...",
    "1 sat = 1 sat",
    "Stack sats, stay humble.",
    "Oscar's sats are growing\nwhile he sleeps!",
    "The best time to save sats\nwas yesterday.\nThe next best time is now!",
    "Patience is a superpower.",
    "Tick tock, next block!",
    "Not your keys,\nnot your coins!",
    "Every sat counts!",
    "Slowly, then suddenly.",
]

const emojiStories: string[][] = [
    ["🦁", "🎂", "🚀"],
    ["🐙", "⚡", "🏰"],
    ["🦊", "🌈", "🍕"],
    ["🐋", "🎸", "🌙"],
    ["🦄", "🗺️", "💎"],
    ["🐉", "📚", "⭐"],
    ["🦈", "🎪", "🔑"],
    ["🐧", "🏔️", "🎁"],
    ["🦜", "🏴‍☠️", "🍦"],
    ["🐸", "🌊", "👑"],
]

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

// Build the full content pool — mix of static and dynamic
// Each generator takes { sats } context and returns a ContentItem
function buildGenerators(): ContentGenerator[] {
    const generators: ContentGenerator[] = []

    // Balance display (every 4th item will be this)
    generators.push(({ sats }) => ({
        index: 0, type: "balance", emoji: "₿",
        title: "Oscar's Bitcoin Stash",
        body: `${formatSats(sats)} sats`,
        total: 0,
    }))

    // Jokes
    for (const joke of jokes) {
        generators.push(() => ({
            index: 0, type: "joke", emoji: "😄",
            title: "Joke time!",
            body: joke,
            total: 0,
        }))
    }

    // Fun facts
    for (const fact of funFacts) {
        generators.push(() => ({
            index: 0, type: "fact", emoji: "🧠",
            title: "Did you know?",
            body: fact,
            total: 0,
        }))
    }

    // Challenges
    for (const challenge of challenges) {
        generators.push(() => ({
            index: 0, type: "challenge", emoji: "💪",
            title: "Challenge!",
            body: challenge,
            total: 0,
        }))
    }

    // Phrases
    for (const phrase of phrases) {
        generators.push(() => ({
            index: 0, type: "phrase", emoji: "✨",
            title: "",
            body: phrase,
            total: 0,
        }))
    }

    // Emoji stories
    for (const emojis of emojiStories) {
        generators.push(() => ({
            index: 0, type: "emoji-story", emoji: "📖",
            title: "Make up a story!",
            body: emojis.join("  "),
            total: 0,
        }))
    }

    // Sats → EUR → ice creams (dynamic)
    generators.push(async ({ sats }) => {
        const price = await fetchBtcPriceEur()
        if (!price) {
            return {
                index: 0, type: "conversion", emoji: "🍦",
                title: "Ice cream count",
                body: "Hmm, can't check the price\nright now. Try again soon!",
                total: 0,
            }
        }
        const euros = (sats / 100_000_000) * price
        const iceCreamPrice = 2.5
        const iceCreams = Math.floor(euros / iceCreamPrice)
        return {
            index: 0, type: "conversion", emoji: "🍦",
            title: "Ice cream count",
            body: `${formatSats(sats)} sats\n= €${euros.toFixed(2)}\n= ${iceCreams} ice creams!`,
            total: 0,
        }
    })

    // Christmas countdown (dynamic)
    generators.push(() => {
        const days = daysUntil(12, 25)
        return {
            index: 0, type: "countdown", emoji: "🎄",
            title: "Christmas countdown",
            body: days === 0
                ? "MERRY CHRISTMAS!"
                : days === 1
                    ? "TOMORROW IS CHRISTMAS!"
                    : `${days} days until Christmas!`,
            total: 0,
        }
    })

    return generators
}

// Interleave: balance shows every 4th position, rest shuffled
function buildSequence(generators: ContentGenerator[]): ContentGenerator[] {
    const balance = generators[0]
    const rest = generators.slice(1)

    const sequence: ContentGenerator[] = []
    let restIdx = 0
    const totalItems = rest.length * 4 / 3 // rough: 1 balance per 3 others

    for (let i = 0; i < Math.ceil(totalItems); i++) {
        if (i % 4 === 0) {
            sequence.push(balance)
        } else if (restIdx < rest.length) {
            sequence.push(rest[restIdx++])
        }
    }

    // Add any remaining items
    while (restIdx < rest.length) {
        sequence.push(rest[restIdx++])
    }

    return sequence
}

const allGenerators = buildGenerators()
const sequence = buildSequence(allGenerators)

export async function getContentItem(index: number, sats: number): Promise<ContentItem> {
    const idx = index % sequence.length
    const generator = sequence[idx]
    const item = await generator({ sats })
    return { ...item, index: idx, total: sequence.length }
}

export function getPoolInfo() {
    return {
        totalItems: sequence.length,
        types: {
            balance: 1,
            jokes: jokes.length,
            funFacts: funFacts.length,
            challenges: challenges.length,
            phrases: phrases.length,
            emojiStories: emojiStories.length,
            dynamic: 2, // conversion + christmas
        },
    }
}
