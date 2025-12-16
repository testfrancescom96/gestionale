import { prisma } from "@/lib/db";
import { fetchAllWooProducts, fetchAllWooOrders, fetchWooProducts, fetchWooOrders } from "./woocommerce";
import { parseSkuDate } from "./woo-utils";

/**
 * Sync Products from WooCommerce to Local DB
 * @param mode 'full' | 'incremental'
 */
export async function syncProducts(mode: 'full' | 'incremental' = 'incremental', onProgress?: (msg: string) => void) {
    let products = [];

    // For now, even incremental touches most products to update stock/price, 
    // but in a real scenario we'd query by date_modified.
    // Given the user wants "All", let's use fetchAll if full, or just page 1 if incremental?
    // The user's request imply they want control.

    if (mode === 'full') {
        products = await fetchAllWooProducts(new URLSearchParams({ status: 'any' }), onProgress);
    } else {
        if (onProgress) onProgress("Scaricamento rapido (ultima pagina)...");
        // Incremental: Fetch last 100 items (page 1)
        const res = await fetchWooProducts(new URLSearchParams({ per_page: '100', status: 'any' }));
        products = res.products;
    }

    let count = 0;
    const total = products.length;
    for (const p of products) {
        if (count % 10 === 0 && onProgress) {
            onProgress(`Salvataggio prodotti: ${count}/${total}...`);
        }
        // Parse event date from SKU
        const eventDate = parseSkuDate(p.sku);

        await prisma.wooProduct.upsert({
            where: { id: p.id },
            update: {
                name: p.name,
                sku: p.sku,
                price: parseFloat(p.price || "0"),
                status: p.status,
                permalink: p.permalink,
                dateModified: new Date(p.date_modified),
                eventDate: eventDate
            },
            create: {
                id: p.id,
                name: p.name,
                sku: p.sku,
                price: parseFloat(p.price || "0"),
                status: p.status,
                permalink: p.permalink,
                dateCreated: new Date(p.date_created),
                dateModified: new Date(p.date_modified),
                eventDate: eventDate
            }
        });
        count++;
    }

    return { count };
}

/**
 * Sync Orders from WooCommerce to Local DB
 * @param limit Number of orders to sync (default 50 for rapid sync)
 * @param days Look back N days (overrides limit if set)
 */
export async function syncOrders(limit: number = 50, days: number | null = null, onProgress?: (msg: string) => void) {
    let orders = [];

    const params = new URLSearchParams({ status: 'any' });

    if (days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        const afterDate = date.toISOString(); // e.g. 2025-01-01T...
        params.set("after", afterDate);

        // When using date filter, we want ALL matching orders
        // even if they exceed 100.
        orders = await fetchAllWooOrders(params, onProgress);
    } else if (limit > 100) {
        // Use fetchAll if limit is high (logic for simplicity, can be more granular)
        // Or properly loop pages. But simplest is fetchAll if huge, or just per_page if <= 100
        // fetchAll recursively gets EVERYTHING.
        if (limit > 1000) {
            orders = await fetchAllWooOrders(params, onProgress);
        } else {
            // Just get one big page or multiple? API max is 100.
            // We can use fetchAll but user asked for "Rapid (50) vs Full".
            // orders = await fetchAllWooOrders(new URLSearchParams({ limit: 'all', status: 'any' })); // Re-use our "limit=all" logic? No, calling library directly.
            // Actually fetchAllWooOrders fetches EVERYTHING.
            // Let's implement a smarter "fetch N" if needed, but for now:
            // Full = fetchAllWooOrders
            // Rapid = fetchWooOrders(per_page=limit)
            // Still use fetchAll for robustness if > 100
            if (onProgress) onProgress("Recupero ultimi " + limit + " ordini...");
            params.set("per_page", "100"); // Standard page size
            // Note: fetchAll fetches EVERYTHING.
            // If we just want 200, fetchAll might be overkill if total is 5000.
            // But for now, simplified logic: > 100 means "Full/Large Batch".
            orders = await fetchAllWooOrders(params, onProgress);
        }
    } else {
        if (onProgress) onProgress("Recupero rapido ultimi ordini...");
        params.set("per_page", limit.toString());
        const res = await fetchWooOrders(params);
        orders = res.orders;
    }

    let count = 0;
    const total = orders.length;

    for (const o of orders) {
        if (count % 5 === 0 && onProgress) {
            onProgress(`Salvataggio ordini: ${count}/${total}...`);
        }
        // 1. Upsert Order
        const createdOrder = await prisma.wooOrder.upsert({
            where: { id: o.id },
            update: {
                status: o.status,
                total: parseFloat(o.total),
                currency: o.currency,
                billingFirstName: o.billing?.first_name,
                billingLastName: o.billing?.last_name,
                billingEmail: o.billing?.email,
                billingPhone: o.billing?.phone,
                billingAddress: o.billing?.address_1,
                billingCity: o.billing?.city,
                updatedAt: new Date() // Updates local timestamp
            },
            create: {
                id: o.id,
                status: o.status,
                total: parseFloat(o.total),
                currency: o.currency,
                dateCreated: new Date(o.date_created),
                billingFirstName: o.billing?.first_name,
                billingLastName: o.billing?.last_name,
                billingEmail: o.billing?.email,
                billingPhone: o.billing?.phone,
                billingAddress: o.billing?.address_1,
                billingCity: o.billing?.city,
            }
        });

        // 2. Handle Line Items (Delete existing and recreate to ensure sync?)
        // Or upsert? Recreating is safer for line items changes.
        await prisma.wooOrderItem.deleteMany({ where: { wooOrderId: o.id } });

        for (const item of o.line_items) {
            // Check if product exists locally, if not we might have a data integrity issue 
            // but we can still save the item with null relation if we want, or just link `wooProductId`.
            // Prisma will error if we define relation and ID doesn't exist? 
            // relation is properties: [wooProductId] references: [id].
            // If WooProduct(id) missing, foreign key constraint fails? 
            // No, fields are optional `wooProductId Int?` AND relation is optional `product WooProduct?`.
            // But if we set `wooProductId` to a value that doesn't exist, it WILL fail if enforcement is on.
            // Safe bet: check existence or allow it to be null if product not found? 
            // Better: only link if exists. OR try/catch.

            // Optimization: Just set wooProductId. If it fails due to FK, retry with null?
            // Actually SQLite enforces FKs.
            // Let's try finding it first? Expensive inside loop.
            // Alternative: ensure products are synced first? No, orders can contain old products.
            // Let's just create raw items without hard relation if possible?
            // Schema has `wooProductId Int?`. If we populate it, it MUST exist.

            // Strategy: Try to count on `syncProducts` being run. 
            // If not found, skip linking?

            // To be safe and fast:
            // We won't verify every product. We will set wooProductId.
            // If it crashes, we catch.
            const quantity = item.quantity;
            const total = parseFloat(item.total);

            try {
                await prisma.wooOrderItem.create({
                    data: {
                        wooOrderId: o.id,
                        wooProductId: item.product_id || null,
                        productName: item.name,
                        quantity: quantity,
                        total: total
                    }
                });
            } catch (e) {
                // Likely FK error if product missing. 
                // Retry without productId link
                await prisma.wooOrderItem.create({
                    data: {
                        wooOrderId: o.id,
                        // wooProductId: undefined, // Don't link
                        productName: item.name,
                        quantity: quantity,
                        total: total
                    }
                });
            }
        }
        count++;
    }

    return { count };
}
