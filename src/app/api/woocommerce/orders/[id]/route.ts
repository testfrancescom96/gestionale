import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Update Order (Local + WooCommerce)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const orderId = parseInt(id);
        const body = await request.json();

        // 1. Prepare data for WooCommerce
        const wooData: any = {};
        if (body.status) wooData.status = body.status;
        if (body.customer_note) wooData.customer_note = body.customer_note;

        // Billing
        if (body.billing) {
            wooData.billing = {
                first_name: body.billing.first_name,
                last_name: body.billing.last_name,
                email: body.billing.email,
                phone: body.billing.phone,
                address_1: body.billing.address_1,
                city: body.billing.city,
                postcode: body.billing.postcode,
                country: body.billing.country || 'IT'
            };
        }

        // 2. Call WooCommerce API
        const consumerKey = process.env.WOOCOMMERCE_KEY;
        const consumerSecret = process.env.WOOCOMMERCE_SECRET;
        const wooUrl = process.env.WOOCOMMERCE_URL;

        if (!consumerKey || !consumerSecret || !wooUrl) {
            return NextResponse.json({ error: "WooCommerce credentials missing" }, { status: 500 });
        }

        const res = await fetch(`${wooUrl}/wp-json/wc/v3/orders/${orderId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`
            },
            body: JSON.stringify(wooData)
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to update order in WooCommerce");
        }

        const updatedWooOrder = await res.json();

        // 3. Update Local DB
        // We set manuallyModified = true
        const localUpdate = await prisma.wooOrder.update({
            where: { id: orderId },
            data: {
                status: updatedWooOrder.status,
                billingFirstName: updatedWooOrder.billing.first_name,
                billingLastName: updatedWooOrder.billing.last_name,
                billingEmail: updatedWooOrder.billing.email,
                billingPhone: updatedWooOrder.billing.phone,
                billingAddress: updatedWooOrder.billing.address_1,
                billingCity: updatedWooOrder.billing.city,

                manuallyModified: true, // Marker
                adminNotes: body.admin_notes || undefined, // Internal notes

                updatedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            order: localUpdate,
            message: "Ordine aggiornato con successo"
        });

    } catch (error: any) {
        console.error("Error updating order:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
