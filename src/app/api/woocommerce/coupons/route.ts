import { NextRequest, NextResponse } from "next/server";
import { fetchWooCoupons, createWooCoupon } from "@/lib/woocommerce";

/**
 * GET /api/woocommerce/coupons
 * List all coupons from WooCommerce
 */
export async function GET() {
    try {
        const { coupons, total } = await fetchWooCoupons();

        return NextResponse.json({
            coupons,
            total: parseInt(total || "0")
        });
    } catch (error: unknown) {
        console.error("Error fetching coupons:", error);
        const message = error instanceof Error ? error.message : "Errore nel recupero coupon";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * POST /api/woocommerce/coupons
 * Create a new coupon on WooCommerce
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        if (!body.code) {
            return NextResponse.json({ error: "Codice coupon richiesto" }, { status: 400 });
        }

        const coupon = await createWooCoupon({
            code: body.code,
            discount_type: body.discount_type || 'percent',
            amount: body.amount?.toString() || '0',
            description: body.description || '',
            date_expires: body.date_expires || null,
            individual_use: body.individual_use ?? false,
            usage_limit: body.usage_limit || null,
            usage_limit_per_user: body.usage_limit_per_user || null,
            minimum_amount: body.minimum_amount?.toString() || '',
            maximum_amount: body.maximum_amount?.toString() || '',
            free_shipping: body.free_shipping ?? false,
            product_ids: body.product_ids || [],
            excluded_product_ids: body.excluded_product_ids || [],
            email_restrictions: body.email_restrictions || []
        });

        return NextResponse.json({ coupon });
    } catch (error: unknown) {
        console.error("Error creating coupon:", error);
        const message = error instanceof Error ? error.message : "Errore nella creazione coupon";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
