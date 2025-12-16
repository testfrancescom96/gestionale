
import { NextResponse } from "next/server";
import { getMetaAdsData } from "@/lib/meta-ads";

export const dynamic = 'force-dynamic'; // Always fetch fresh data on request

export async function GET() {
    try {
        const data = await getMetaAdsData();
        return NextResponse.json(data);
    } catch (error) {
        console.error("API Marketing Error:", error);
        return NextResponse.json({ error: "Failed to fetch marketing data" }, { status: 500 });
    }
}
