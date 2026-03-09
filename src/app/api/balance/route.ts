import { NextResponse } from "next/server"
import * as bitcoin from "bitcoinjs-lib"
import { HDKey } from "@scure/bip32"
import { base58check } from "@scure/base"

// Allow up to 30s for the full gap-limit scan (Vercel hobby supports up to 60s)
export const maxDuration = 30

// Standard Bitcoin gap limit: stop scanning when this many consecutive
// unused addresses are found. This is what Blue Wallet, Electrum, etc. use.
// Works forever — no manual address management needed.
const GAP_LIMIT = 20

function deriveAddress(zpub: string, chain: 0 | 1, index: number): string {
    const decoded = base58check(bitcoin.crypto.sha256).decode(zpub)
    const xpubBytes = new Uint8Array(decoded)
    xpubBytes[0] = 0x04
    xpubBytes[1] = 0x88
    xpubBytes[2] = 0xb2
    xpubBytes[3] = 0x1e
    const xpub = base58check(bitcoin.crypto.sha256).encode(xpubBytes)

    const root = HDKey.fromExtendedKey(xpub)
    const child = root.deriveChild(chain).deriveChild(index)
    if (!child.publicKey) throw new Error(`Failed to derive key at ${chain}/${index}`)
    const { address } = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(child.publicKey),
        network: bitcoin.networks.bitcoin,
    })
    if (!address) throw new Error(`Failed to derive address at ${chain}/${index}`)
    return address
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// Fetch with retry on 429 (mempool.space rate limit)
async function fetchWithRetry(url: string): Promise<Response> {
    for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(url)
        if (res.status !== 429) return res
        await sleep(2000 * (attempt + 1))
    }
    throw new Error("rate_limited: " + url)
}

// Returns { used: whether address has any tx history, balance: current sats }
async function checkAddress(address: string): Promise<{ used: boolean, balance: number }> {
    const res = await fetchWithRetry(`https://blockstream.info/api/address/${address}`)
    if (!res.ok) return { used: false, balance: 0 }
    const data = await res.json()
    const txCount = (data.chain_stats?.tx_count ?? 0) + (data.mempool_stats?.tx_count ?? 0)
    if (txCount === 0) return { used: false, balance: 0 }
    const cIn = data.chain_stats?.funded_txo_sum ?? 0
    const cOut = data.chain_stats?.spent_txo_sum ?? 0
    const pIn = data.mempool_stats?.funded_txo_sum ?? 0
    const pOut = data.mempool_stats?.spent_txo_sum ?? 0
    return { used: true, balance: (cIn - cOut) + (pIn - pOut) }
}

// Scan one chain (receive=0 or change=1) using gap limit.
// Keeps deriving addresses until GAP_LIMIT consecutive unused addresses.
async function scanChain(zpub: string, chain: 0 | 1): Promise<{ total: number, checked: number, active: number }> {
    let total = 0
    let checked = 0
    let active = 0
    let gap = 0
    let index = 0

    while (gap < GAP_LIMIT) {
        const addr = deriveAddress(zpub, chain, index)
        const result = await checkAddress(addr)
        checked++

        if (result.used) {
            gap = 0
            active++
            total += result.balance
        } else {
            gap++
        }

        index++
        await sleep(100)
    }

    return { total, checked, active }
}

async function fetchLightning(token: string): Promise<number> {
    try {
        const res = await fetch("https://coinos.io/api/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) return 0
        const data = await res.json()
        return data.balance ?? 0
    } catch {
        return 0
    }
}

export async function GET() {
    const zpub = process.env.ZPUB?.trim()
    const coinosToken = process.env.COINOS_TOKEN

    if (!zpub) {
        return NextResponse.json({ error: "ZPUB not configured" }, { status: 500 })
    }

    try {
        // Lightning fetches in parallel (different API)
        const lightningPromise = coinosToken ? fetchLightning(coinosToken) : Promise.resolve(0)

        // Scan receive then change chain sequentially (rate limit friendly)
        const receive = await scanChain(zpub, 0)
        const change = await scanChain(zpub, 1)
        const lightning = await lightningPromise

        const onchain = receive.total + change.total
        const total = onchain + lightning

        return NextResponse.json({
            total,
            onchain,
            lightning,
            receive: { checked: receive.checked, active: receive.active, sats: receive.total },
            change: { checked: change.checked, active: change.active, sats: change.total },
        }, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                // Cache on Vercel CDN for 2 minutes. Most ESP32 requests hit cache (instant).
                // Uncached requests take ~20s (gap limit scan). stale-while-revalidate
                // serves stale data immediately while refreshing in background.
                "Cache-Control": "s-maxage=120, stale-while-revalidate=60",
            },
        })
    } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown"
        console.error("Balance error:", msg)
        return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
    }
}
