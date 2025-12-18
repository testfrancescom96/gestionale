
import { NextResponse } from "next/server";
import { getMetaAdsData } from "@/lib/meta-ads";

export const dynamic = 'force-dynamic'; // Always fetch fresh data on request

export async function GET() {
    console.log("DEBUG META ADS ENV:");
    console.log("TOKEN present:", !!process.env.META_ACCESS_TOKEN);
    console.log("ACCOUNT ID present:", !!process.env.META_AD_ACCOUNT_ID);
    console.log("ACCOUNT ID value:", process.env.META_AD_ACCOUNT_ID);

    try {
        const data = await getMetaAdsData();
        return NextResponse.json(data);
    } catch (error) {
        console.error("API Marketing Error:", error);
        return NextResponse.json({ error: "Failed to fetch marketing data" }, { status: 500 });
    }
}
