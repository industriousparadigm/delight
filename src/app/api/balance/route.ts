import { NextResponse } from "next/server"
import * as bitcoin from "bitcoinjs-lib"
import { HDKey } from "@scure/bip32"
import { base58check } from "@scure/base"

// How many addresses to derive and check.
// Start with what we know is enough. To grow: bump these and redeploy (no reflash).
const RECEIVE_COUNT = 15
const CHANGE_COUNT = 5

function deriveAddresses(zpub: string, chain: 0 | 1, count: number): string[] {
    const decoded = base58check(bitcoin.crypto.sha256).decode(zpub)
    const xpubBytes = new Uint8Array(decoded)
    xpubBytes[0] = 0x04
    xpubBytes[1] = 0x88
    xpubBytes[2] = 0xb2
    xpubBytes[3] = 0x1e
    const xpub = base58check(bitcoin.crypto.sha256).encode(xpubBytes)

    const root = HDKey.fromExtendedKey(xpub)
    const chainKey = root.deriveChild(chain)

    const addresses: string[] = []
    for (let i = 0; i < count; i++) {
        const child = chainKey.deriveChild(i)
        if (!child.publicKey) throw new Error(`Failed to derive key at ${chain}/${i}`)
        const { address } = bitcoin.payments.p2wpkh({
            pubkey: Buffer.from(child.publicKey),
            network: bitcoin.networks.bitcoin,
        })
        if (!address) throw new Error(`Failed to derive address at ${chain}/${i}`)
        addresses.push(address)
    }
    return addresses
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// Fetch with retry on 429 (rate limit)
async function fetchWithRetry(url: string): Promise<Response> {
    for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(url)
        if (res.status !== 429) return res
        await sleep(1500 * (attempt + 1))
    }
    throw new Error("rate_limited: " + url)
}

async function fetchAddressBalance(address: string): Promise<number> {
    const res = await fetchWithRetry(`https://mempool.space/api/address/${address}`)
    if (!res.ok) return 0
    const data = await res.json()
    const txCount = (data.chain_stats?.tx_count ?? 0) + (data.mempool_stats?.tx_count ?? 0)
    if (txCount === 0) return 0
    const cIn = data.chain_stats?.funded_txo_sum ?? 0
    const cOut = data.chain_stats?.spent_txo_sum ?? 0
    const pIn = data.mempool_stats?.funded_txo_sum ?? 0
    const pOut = data.mempool_stats?.spent_txo_sum ?? 0
    return (cIn - cOut) + (pIn - pOut)
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
        const receiveAddrs = deriveAddresses(zpub, 0, RECEIVE_COUNT)
        const changeAddrs = deriveAddresses(zpub, 1, CHANGE_COUNT)
        const allAddrs = [...receiveAddrs, ...changeAddrs]

        // Lightning in parallel (different API, no rate limit concern)
        const lightningPromise = coinosToken ? fetchLightning(coinosToken) : Promise.resolve(0)

        // Sequential scan with 400ms pacing. 20 addresses x 400ms = 8s.
        let onchain = 0
        let active = 0
        for (const addr of allAddrs) {
            const balance = await fetchAddressBalance(addr)
            if (balance > 0) {
                active++
                onchain += balance
            }
            await sleep(400)
        }

        const lightning = await lightningPromise
        const total = onchain + lightning

        return NextResponse.json({
            total,
            onchain,
            lightning,
            addresses: { checked: allAddrs.length, active },
        }, {
            headers: {
                "Access-Control-Allow-Origin": "*",
                // Cache on Vercel CDN for 2 minutes. ESP32 checks every 5 min,
                // so most requests hit cache (instant). Fresh scan only when cache expires.
                // Worst case deposit detection: ~7 min (2 min cache + 5 min poll).
                "Cache-Control": "s-maxage=120, stale-while-revalidate=60",
            },
        })
    } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown"
        console.error("Balance error:", msg)
        return NextResponse.json({ error: "Failed to fetch balance" }, { status: 500 })
    }
}
