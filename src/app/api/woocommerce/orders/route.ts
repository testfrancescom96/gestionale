import { NextRequest, NextResponse } from "next/server";
import { fetchWooOrders, fetchAllWooOrders } from "@/lib/woocommerce";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    try {
        let orders = [];
        let total = "0";
        let totalPages = "1";

        if (searchParams.get("limit") === "all") {
            orders = await fetchAllWooOrders(searchParams);
            total = orders.length.toString();
        } else {
            const res = await fetchWooOrders(searchParams);
            orders = res.orders;
            total = res.total;
            totalPages = res.totalPages;
        }

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
