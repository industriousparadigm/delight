"use client"

import { useState, useEffect, useCallback } from "react"

type ContentItem = {
    index: number
    type: string
    emoji: string
    title: string
    body: string
    total: number
}

const TYPE_LABELS: Record<string, string> = {
    balance: "Balance",
    fact: "Fun Fact",
    challenge: "Challenge",
    phrase: "Vibes",
    "emoji-story": "Story Time",
    conversion: "What Can You Buy?",
    countdown: "Countdown",
    twister: "Tongue Twister",
    puzzle: "Quick Math",
}

const CARD_CLASSES: Record<string, string> = {
    balance: "card-balance",
    fact: "card-fact",
    challenge: "card-challenge",
    phrase: "card-phrase",
    "emoji-story": "card-emoji-story",
    conversion: "card-conversion",
    countdown: "card-countdown",
    twister: "card-twister",
    puzzle: "card-puzzle",
}

const DEMO_SATS = 238931

export default function Home() {
    const [current, setCurrent] = useState<ContentItem | null>(null)
    const [history, setHistory] = useState<ContentItem[]>([])
    const [index, setIndex] = useState(0)
    const [isLoading, setIsLoading] = useState(false)
    const [autoPlay, setAutoPlay] = useState(false)
    const [secondsLeft, setSecondsLeft] = useState(30)

    const fetchItem = useCallback(async (idx: number) => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/delight?index=${idx}&sats=${DEMO_SATS}`)
            const data: ContentItem = await res.json()
            setCurrent(data)
            setHistory(prev => {
                const next = [data, ...prev]
                return next.slice(0, 12)
            })
        } catch (err) {
            console.error("Failed to fetch:", err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchItem(0)
    }, [fetchItem])

    const goNext = useCallback(() => {
        const next = index + 1
        setIndex(next)
        setSecondsLeft(30)
        fetchItem(next)
    }, [index, fetchItem])

    const goPrev = useCallback(() => {
        const prev = Math.max(0, index - 1)
        setIndex(prev)
        setSecondsLeft(30)
        fetchItem(prev)
    }, [index, fetchItem])

    const showItem = useCallback((item: ContentItem) => {
        setCurrent(item)
    }, [])

    // Auto-play timer
    useEffect(() => {
        if (!autoPlay) return
        setSecondsLeft(30)
        const interval = setInterval(() => {
            setSecondsLeft(prev => {
                if (prev <= 1) {
                    goNext()
                    return 30
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(interval)
    }, [autoPlay, goNext])

    return (
        <main className="min-h-screen px-6 py-12 max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-12 text-center">
                <h1
                    className="text-5xl font-bold mb-2 tracking-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    delight
                </h1>
                <p className="text-lg opacity-60" style={{ fontFamily: "var(--font-mono)" }}>
                    Oscar&apos;s piggy bank content feed
                </p>
            </div>

            {/* Now Showing — Hero Card */}
            {current && (
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-3">
                        <span className="sticker" style={{ background: "var(--color-sun)" }}>
                            Now Showing
                        </span>
                        <span
                            className="text-sm opacity-50"
                            style={{ fontFamily: "var(--font-mono)" }}
                        >
                            #{current.index} / {current.total}
                        </span>
                    </div>

                    <div
                        key={current.index + "-" + index}
                        className={`
                            relative rounded-2xl p-8 paper-shadow bounce-in
                            ${CARD_CLASSES[current.type] ?? "card-balance"}
                        `}
                    >
                        <div className="tape tape-left" />
                        <div className="tape tape-right" />

                        <div className="text-4xl mb-3">{current.emoji}</div>
                        {current.title && (
                            <h2
                                className="text-2xl font-bold mb-3"
                                style={{ fontFamily: "var(--font-display)" }}
                            >
                                {current.title}
                            </h2>
                        )}
                        <p
                            className="text-lg whitespace-pre-line leading-relaxed"
                            style={{ fontFamily: current.type === "balance" ? "var(--font-mono)" : "var(--font-body)" }}
                        >
                            {current.body}
                        </p>

                        <div className="mt-4">
                            <span className="sticker bg-white/30">
                                {TYPE_LABELS[current.type] ?? current.type}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-10">
                <button
                    onClick={goPrev}
                    disabled={index === 0 || isLoading}
                    className="
                        rounded-full w-12 h-12 border-3 border-ink
                        font-bold text-xl paper-shadow-sm
                        disabled:opacity-30 hover:scale-110 transition-transform
                        bg-white cursor-pointer
                    "
                    style={{ fontFamily: "var(--font-display)", borderColor: "var(--color-ink)" }}
                >
                    ←
                </button>

                <button
                    onClick={() => setAutoPlay(!autoPlay)}
                    className="
                        rounded-full px-6 py-3 border-3 font-bold paper-shadow-sm
                        hover:scale-105 transition-transform cursor-pointer
                    "
                    style={{
                        fontFamily: "var(--font-display)",
                        borderColor: "var(--color-ink)",
                        backgroundColor: autoPlay ? "var(--color-coral)" : "white",
                        color: autoPlay ? "white" : "var(--color-ink)",
                    }}
                >
                    {autoPlay ? `⏸ ${secondsLeft}s` : "▶ Auto"}
                </button>

                <button
                    onClick={goNext}
                    disabled={isLoading}
                    className="
                        rounded-full w-12 h-12 border-3 border-ink
                        font-bold text-xl paper-shadow-sm
                        disabled:opacity-30 hover:scale-110 transition-transform
                        bg-white cursor-pointer
                    "
                    style={{ fontFamily: "var(--font-display)", borderColor: "var(--color-ink)" }}
                >
                    →
                </button>
            </div>

            {/* E-ink Preview */}
            <div className="mb-10">
                <h3 className="section-title mb-3">
                    <span className="section-title-icon">📺</span> E-ink Preview
                    <span className="section-title-sub">250×122px</span>
                </h3>
                <div
                    className="eink-frame mx-auto p-4"
                    style={{ width: 250, height: 122, fontSize: 10, lineHeight: 1.3, overflow: "hidden" }}
                >
                    {current && (
                        <>
                            <div className="font-bold text-xs">{current.title || current.emoji}</div>
                            <hr className="my-1 border-black" />
                            <div className="whitespace-pre-line" style={{ fontSize: current.type === "balance" ? 18 : 9 }}>
                                {current.body}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* History */}
            {history.length > 1 && (
                <div>
                    <h3 className="section-title mb-3">
                        <span className="section-title-icon">⏪</span> Recent
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {history.slice(1).map((item, i) => (
                            <button
                                key={`${item.index}-${i}`}
                                onClick={() => showItem(item)}
                                className={`
                                    rounded-xl p-3 paper-shadow-sm card-hover text-left
                                    cursor-pointer hover:scale-105 transition-transform
                                    ${CARD_CLASSES[item.type] ?? "card-balance"}
                                `}
                                style={{ fontSize: 12 }}
                            >
                                <div className="text-xl mb-1">{item.emoji}</div>
                                <div
                                    className="font-bold truncate"
                                    style={{ fontFamily: "var(--font-display)" }}
                                >
                                    {item.title || TYPE_LABELS[item.type]}
                                </div>
                                <div
                                    className="truncate opacity-70 mt-1"
                                    style={{ fontFamily: "var(--font-mono)", fontSize: 10 }}
                                >
                                    {item.body.split("\n")[0]}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="mt-16 text-center opacity-30" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                <p>delight api — bitcoin piggy bank content feed</p>
                <p>GET /api/delight?index=N&sats=N</p>
            </footer>
        </main>
    )
}
