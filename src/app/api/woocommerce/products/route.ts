import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    try {
        // Fetch from LOCAL DB
        const products = await prisma.wooProduct.findMany({
            include: {
                operational: true // Include operational status
            },
            orderBy: {
                eventDate: 'asc' // Default sort by date
            }
        });

        // Transform to match expected frontend structure if needed
        // Frontend expects: { products: [], ... }
        // The structure from prisma is slightly different (dates are Date objects)
        // But JSON serialization handles Date -> String ISO.

        return NextResponse.json({
            products: products,
            total: products.length,
            source: 'local_cache'
        });

    } catch (error: any) {
        console.error("Error fetching Local Woo products:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}
