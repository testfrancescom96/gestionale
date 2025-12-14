import { NextRequest, NextResponse } from "next/server";
import { fetchWooOrders } from "@/lib/woocommerce";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    try {
        const { orders, total, totalPages } = await fetchWooOrders(searchParams);

        return NextResponse.json({
            orders,
            pagination: {
                total,
                totalPages,
            }
        });

    } catch (error: any) {
        console.error("Error fetching WooCommerce orders:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch orders from WooCommerce" },
            { status: 500 }
        );
    }
}
