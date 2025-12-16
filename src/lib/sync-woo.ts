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
/**
 * Sync Orders from WooCommerce to Local DB
 * @param mode 'rapid' | 'full' | 'smart' | 'days'
 * @param value Contextual value (limit for rapid, days for days)
 */
export async function syncOrders(mode: 'rapid' | 'full' | 'smart' | 'days' = 'smart', value: number = 50, onProgress?: (msg: string) => void) {
    let orders = [];
    const params = new URLSearchParams({ status: 'any' });

    if (mode === 'days') {
        const date = new Date();
        date.setDate(date.getDate() - value);
        params.set("after", date.toISOString());
        orders = await fetchAllWooOrders(params, onProgress);
    }
    else if (mode === 'smart') {
        // Smart Sync: Fetch only what changed since last update
        const lastOrder = await prisma.wooOrder.findFirst({
            orderBy: { updatedAt: 'desc' }
        });

        if (lastOrder) {
            // Buffer: Go back 1 hour to be safe
            const lastDate = new Date(lastOrder.updatedAt);
            lastDate.setHours(lastDate.getHours() - 1);
            params.set("modified_after", lastDate.toISOString());
            if (onProgress) onProgress(`Smart Sync: Cerco modifiche dopo ${lastDate.toLocaleString()}...`);
        } else {
            if (onProgress) onProgress("Smart Sync: Nessun dato locale, scarico tutto...");
            // No local data, fetch reasonable default (e.g. last 30 days or all?)
            // Let's default to last 90 days to populate initially
            const date = new Date();
            date.setDate(date.getDate() - 90);
            params.set("after", date.toISOString());
        }

        // Smart sync might return many items if long time passed, so use fetchAll
        orders = await fetchAllWooOrders(params, onProgress);
    }
    else if (mode === 'full') {
        if (onProgress) onProgress("Sync Completo: Potrebbe richiedere tempo...");
        orders = await fetchAllWooOrders(params, onProgress);
    }
    else {
        // Rapid (by limit)
        if (onProgress) onProgress(`Recupero ultimi ${value} ordini...`);
        params.set("per_page", value.toString());
        const res = await fetchWooOrders(params);
        orders = res.orders;
    }

    let count = 0;
    const total = orders.length;
    const updatedIds: number[] = [];

    if (total === 0 && onProgress) {
        onProgress("Nessuna modifica trovata.");
    }

    for (const o of orders) {
        if (count % 5 === 0 && onProgress) {
            onProgress(`Salvataggio ordini: ${count}/${total}...`);
        }

        // Check if exists to see if it's an update
        const existing = await prisma.wooOrder.findUnique({
            where: { id: o.id },
            select: { status: true, total: true }
        });

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

        // Detect change
        let changed = false;
        if (!existing) changed = true; // New
        else if (existing.status !== o.status || Math.abs(existing.total - parseFloat(o.total)) > 0.01) {
            changed = true; // Updated status or total
        }

        if (changed) {
            updatedIds.push(o.id);
        }

        // 2. Handle Line Items (Delete existing and recreate to ensure sync?)
        // Or upsert? Recreating is safer for line items changes.
        await prisma.wooOrderItem.deleteMany({ where: { wooOrderId: o.id } });

        for (const item of o.line_items) {
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

    return { count, updatedIds };
}
