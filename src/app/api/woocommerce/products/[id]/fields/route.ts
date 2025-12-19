import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/woocommerce/products/[id]/fields
 * Returns the unique fields actually present in this product's orders
 */
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
        return NextResponse.json({ error: "ID prodotto non valido" }, { status: 400 });
    }

    try {
        // Fetch all order items for this product
        const orderItems = await prisma.wooOrderItem.findMany({
            where: { wooProductId: productId },
            select: { metaData: true }
        });

        // Also fetch manual bookings
        const manualBookings = await prisma.manualBooking.findMany({
            where: { wooProductId: productId },
            select: { customData: true }
        });

        // Extract unique fields from order items
        const fieldMap = new Map<string, { fieldKey: string; label: string; count: number }>();

        for (const item of orderItems) {
            if (!item.metaData) continue;

            try {
                const meta = JSON.parse(item.metaData);
                if (!Array.isArray(meta)) continue;

                for (const field of meta) {
                    const key = field.key || field.display_key;
                    const label = field.display_key || field.key || key;

                    // Skip internal WooCommerce fields
                    if (!key || key.startsWith('_')) continue;

                    if (!fieldMap.has(key)) {
                        fieldMap.set(key, { fieldKey: key, label: label, count: 0 });
                    }
                    fieldMap.get(key)!.count++;
                }
            } catch (e) {
                // Skip invalid JSON
            }
        }

        // Add standard fields that are always available
        const standardFields = [
            { fieldKey: '_order_id', label: 'N° Ordine', count: orderItems.length },
            { fieldKey: '_billing_name', label: 'Nome Acquirente', count: orderItems.length },
            { fieldKey: '_billing_phone', label: 'Telefono', count: orderItems.length },
            { fieldKey: '_billing_email', label: 'Email', count: orderItems.length },
            { fieldKey: '_quantity', label: 'Quantità', count: orderItems.length },
        ];

        // Combine: standard fields first, then dynamic fields sorted by frequency
        const dynamicFields = Array.from(fieldMap.values())
            .sort((a, b) => b.count - a.count);

        const allFields = [...standardFields, ...dynamicFields];

        return NextResponse.json(allFields);

    } catch (error) {
        console.error("Error fetching product fields:", error);
        return NextResponse.json({ error: "Errore nel recupero dei campi" }, { status: 500 });
    }
}
