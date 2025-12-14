import { NextRequest, NextResponse } from "next/server";
import { fetchWooProducts } from "@/lib/woocommerce";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;

    try {
        const { products, total, totalPages } = await fetchWooProducts(searchParams);

        // Fetch local operational data for these products
        const productIds = products.map((p: any) => p.id);
        // @ts-ignore
        const operationalData = await prisma.viaggioOperativo.findMany({
            where: {
                wooProductId: { in: productIds }
            }
        });

        // Merge data
        const enrichedProducts = products.map((product: any) => {
            const opData = operationalData.find((op: any) => op.wooProductId === product.id);
            return {
                ...product,
                viaggioOperativo: opData || null
            };
        });

        return NextResponse.json({
            products: enrichedProducts,
            pagination: {
                total,
                totalPages,
            }
        });

    } catch (error: any) {
        console.error("Error fetching WooCommerce products:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch products from WooCommerce" },
            { status: 500 }
        );
    }
}
