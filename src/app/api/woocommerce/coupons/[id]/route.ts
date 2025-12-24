import { NextRequest, NextResponse } from "next/server";
import { fetchWooCoupon, updateWooCoupon, deleteWooCoupon } from "@/lib/woocommerce";

/**
 * GET /api/woocommerce/coupons/[id]
 * Get single coupon details
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const couponId = parseInt(id);

    if (isNaN(couponId)) {
        return NextResponse.json({ error: "ID coupon non valido" }, { status: 400 });
    }

    try {
        const coupon = await fetchWooCoupon(couponId);
        return NextResponse.json({ coupon });
    } catch (error: unknown) {
        console.error("Error fetching coupon:", error);
        const message = error instanceof Error ? error.message : "Errore nel recupero coupon";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * PUT /api/woocommerce/coupons/[id]
 * Update existing coupon
 */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const couponId = parseInt(id);

    if (isNaN(couponId)) {
        return NextResponse.json({ error: "ID coupon non valido" }, { status: 400 });
    }

    try {
        const body = await request.json();

        const updateData: Record<string, unknown> = {};

        // Only include fields that are provided
        if (body.code !== undefined) updateData.code = body.code;
        if (body.discount_type !== undefined) updateData.discount_type = body.discount_type;
        if (body.amount !== undefined) updateData.amount = body.amount.toString();
        if (body.description !== undefined) updateData.description = body.description;
        if (body.date_expires !== undefined) updateData.date_expires = body.date_expires;
        if (body.individual_use !== undefined) updateData.individual_use = body.individual_use;
        if (body.usage_limit !== undefined) updateData.usage_limit = body.usage_limit;
        if (body.usage_limit_per_user !== undefined) updateData.usage_limit_per_user = body.usage_limit_per_user;
        if (body.minimum_amount !== undefined) updateData.minimum_amount = body.minimum_amount.toString();
        if (body.maximum_amount !== undefined) updateData.maximum_amount = body.maximum_amount.toString();
        if (body.free_shipping !== undefined) updateData.free_shipping = body.free_shipping;
        if (body.product_ids !== undefined) updateData.product_ids = body.product_ids;
        if (body.excluded_product_ids !== undefined) updateData.excluded_product_ids = body.excluded_product_ids;
        if (body.email_restrictions !== undefined) updateData.email_restrictions = body.email_restrictions;

        const coupon = await updateWooCoupon(couponId, updateData);
        return NextResponse.json({ coupon });
    } catch (error: unknown) {
        console.error("Error updating coupon:", error);
        const message = error instanceof Error ? error.message : "Errore nell'aggiornamento coupon";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

/**
 * DELETE /api/woocommerce/coupons/[id]
 * Delete coupon
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const couponId = parseInt(id);

    if (isNaN(couponId)) {
        return NextResponse.json({ error: "ID coupon non valido" }, { status: 400 });
    }

    try {
        await deleteWooCoupon(couponId, true);
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error("Error deleting coupon:", error);
        const message = error instanceof Error ? error.message : "Errore nell'eliminazione coupon";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
