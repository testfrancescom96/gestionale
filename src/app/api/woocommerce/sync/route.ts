import { NextRequest, NextResponse } from "next/server";
import { syncProducts, syncOrders } from "@/lib/sync-woo";

export const maxDuration = 300; // 5 minutes timeout for heavy sync

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, options } = body; // type: 'products' | 'orders' | 'all'

        let result = {};

        if (type === 'products' || type === 'all') {
            const mode = options?.mode || 'incremental'; // 'full' or 'incremental'
            const res = await syncProducts(mode);
            result = { ...result, products: res.count };
        }

        if (type === 'orders' || type === 'all') {
            const limit = options?.limit || 50;
            const res = await syncOrders(limit);
            result = { ...result, orders: res.count };
        }

        return NextResponse.json({ success: true, stats: result });
    } catch (error: any) {
        console.error("Sync API Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to sync" },
            { status: 500 }
        );
    }
}
