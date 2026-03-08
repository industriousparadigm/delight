import { NextRequest, NextResponse } from "next/server"
import { getContentItem, getPoolInfo } from "@/lib/content"

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams
    const index = parseInt(params.get("index") ?? "0", 10)
    const sats = parseInt(params.get("sats") ?? "0", 10)

    if (isNaN(index) || index < 0) {
        return NextResponse.json({ error: "index must be a non-negative integer" }, { status: 400 })
    }

    const item = await getContentItem(index, sats)

    return NextResponse.json(item, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store",
        },
    })
}

// Info endpoint — GET /api/delight?info=true
export async function HEAD() {
    const info = getPoolInfo()
    return NextResponse.json(info)
}
