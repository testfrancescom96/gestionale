import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncOrders } from "@/lib/sync-woo"; // Reuse existing logic

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { productId, pax, customer, note, metaData } = body;

        // Validation
        if (!productId || !pax || !customer) {
            return NextResponse.json({ error: "Dati mancanti (productId, pax, customer)" }, { status: 400 });
        }

        // 1. Prepare WooCommerce Order Data
        const orderData = {
            payment_method: "bacs", // "Bonifico Bancario" by default for manual
            payment_method_title: "Prenotazione Manuale (Gestionale)",
            set_paid: false,
            status: "processing", // Confirmed but not necessarily paid? Or "on-hold"? User said "Pending" or "Processing". Processing usually triggers emails.
            billing: {
                first_name: customer.firstName,
                last_name: customer.lastName,
                email: customer.email || `manual_${Date.now()}@local.test`, // Dummy if missing, WC needs email
                phone: customer.phone,
                address_1: customer.address || '',
                city: customer.city || '',
                postcode: customer.cap || '',
                country: 'IT'
            },
            line_items: [
                {
                    product_id: productId,
                    quantity: pax
                }
            ],
            // Add Meta Data: Pickup, Note, etc.
            meta_data: []
        };

        // Add Note as Customer Note or Meta?
        if (note) {
            (orderData as any).customer_note = note;
        }

        // Add Custom Meta (e.g. Pickup Point)
        if (metaData && Array.isArray(metaData)) {
            (orderData as any).meta_data = metaData;
        }

        // 2. Call WooCommerce API
        const wcUrl = process.env.WOOCOMMERCE_API_URL;
        const wcKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
        const wcSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

        // Basic Auth
        const auth = Buffer.from(`${wcKey}:${wcSecret}`).toString('base64');

        const res = await fetch(`${wcUrl}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${auth}`
            },
            body: JSON.stringify(orderData)
        });

        if (!res.ok) {
            const errDetails = await res.json();
            console.error("WooCommerce API Error:", errDetails);
            return NextResponse.json({ error: "Errore API WooCommerce", details: errDetails }, { status: 500 });
        }

        const createdOrder = await res.json();

        // 3. Immediately Trigger Local Sync for this specific product or order
        // Ideally we sync just this order, but our sync logic is product or date based.
        // Syncing the PRODUCT is safest to get updated stock/pax count.
        // We can run this in background or await it. Await is safer for UI feedback.

        await syncOrders({
            mode: 'product',
            productId: productId
        });

        return NextResponse.json({
            success: true,
            orderId: createdOrder.id,
            total: createdOrder.total
        });

    } catch (error: any) {
        console.error("Error creating manual order:", error);
        return NextResponse.json({ error: "Errore interno server" }, { status: 500 });
    }
}
