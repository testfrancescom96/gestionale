import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchWooProducts } from "@/lib/woocommerce";

/**
 * GET /api/woocommerce/products/[id]
 * Fetch single product data including WooCommerce live data
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await context.params;
        const id = parseInt(idStr);
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        // Try to get from local DB first
        const localProduct = await prisma.wooProduct.findUnique({
            where: { id }
        });

        if (!localProduct) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        // Fetch fresh data from WooCommerce API to get stock_quantity and menu_order
        try {
            const params = new URLSearchParams();
            params.set("include", id.toString());
            const { products } = await fetchWooProducts(params);

            if (products && products.length > 0) {
                const wooProduct = products[0];

                // Return merged data
                return NextResponse.json({
                    ...localProduct,
                    stockQuantity: wooProduct.stock_quantity,
                    manageStock: wooProduct.manage_stock,
                    menuOrder: wooProduct.menu_order,
                    description: wooProduct.short_description || wooProduct.description,
                    regularPrice: parseFloat(wooProduct.regular_price) || null,
                    salePrice: parseFloat(wooProduct.sale_price) || null,
                });
            }
        } catch (wooError) {
            console.error("WooCommerce fetch error:", wooError);
            // Fall back to local data
        }

        // Return local data if WooCommerce fetch fails
        return NextResponse.json(localProduct);

    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
    }
}


export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await context.params;
        const id = parseInt(idStr);
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const body = await request.json();

        // Allowed fields to update
        const updateData: any = {};

        if (typeof body.isPinned === 'boolean') {
            updateData.isPinned = body.isPinned;
        }

        // If no valid fields, return error or empty
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const product = await prisma.wooProduct.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(product);

    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}
