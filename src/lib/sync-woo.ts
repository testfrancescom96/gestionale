import { prisma } from "@/lib/db";
import { fetchAllWooProducts, fetchAllWooOrders, fetchWooProducts, fetchWooOrders, fetchWooProductVariations } from "./woocommerce";
import { parseSkuDate } from "./woo-utils";

/**
 * Parse event date from variation attributes
 */
function parseVariationDate(attributes: any[]): Date | null {
    if (!attributes || !Array.isArray(attributes)) return null;

    // Look for date-related attributes
    for (const attr of attributes) {
        const name = (attr.name || attr.option || '').toLowerCase();
        const value = attr.option || attr.value || '';

        // Common date attribute names
        if (name.includes('data') || name.includes('date') || name.includes('giorno')) {
            // Try to parse the date value
            // Format: "15 Gennaio 2025", "2025-01-15", "15/01/2025", etc.
            try {
                // Try direct parse
                const d = new Date(value);
                if (!isNaN(d.getTime())) return d;

                // Try Italian format "15 Gennaio 2025"
                const italianMonths: Record<string, number> = {
                    'gennaio': 0, 'febbraio': 1, 'marzo': 2, 'aprile': 3,
                    'maggio': 4, 'giugno': 5, 'luglio': 6, 'agosto': 7,
                    'settembre': 8, 'ottobre': 9, 'novembre': 10, 'dicembre': 11
                };
                const parts = value.toLowerCase().match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
                if (parts) {
                    const day = parseInt(parts[1]);
                    const month = italianMonths[parts[2]];
                    const year = parseInt(parts[3]);
                    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                        return new Date(year, month, day);
                    }
                }
            } catch (e) {
                // Continue to next attribute
            }
        }
    }
    return null;
}

/**
 * Sync Products from WooCommerce to Local DB
 * @param mode 'full' | 'incremental'
 */
export async function syncProducts(mode: 'full' | 'incremental' = 'incremental', onProgress?: (msg: string) => void) {
    let products: any[] = [];

    if (mode === 'full') {
        products = await fetchAllWooProducts(new URLSearchParams({ status: 'any' }), onProgress);
    } else {
        if (onProgress) onProgress("Scaricamento rapido (ultima pagina)...");
        const res = await fetchWooProducts(new URLSearchParams({ per_page: '100', status: 'any' }));
        products = res.products;
    }

    let count = 0;
    let variationsCount = 0;
    const total = products.length;
    const variableProducts: any[] = [];

    for (const p of products) {
        if (count % 10 === 0 && onProgress) {
            onProgress(`Salvataggio prodotti: ${count}/${total}...`);
        }
        // Parse event date from SKU
        const eventDate = parseSkuDate(p.sku);
        const productType = p.type || 'simple';

        await prisma.wooProduct.upsert({
            where: { id: p.id },
            update: {
                name: p.name,
                sku: p.sku,
                price: parseFloat(p.price || "0"),
                status: p.status,
                productType: productType,
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
                productType: productType,
                permalink: p.permalink,
                dateCreated: new Date(p.date_created),
                dateModified: new Date(p.date_modified),
                eventDate: eventDate
            }
        });

        // Track variable products for variation sync
        if (productType === 'variable') {
            variableProducts.push(p);
        }
        count++;
    }

    // Sync variations for variable products
    if (variableProducts.length > 0 && onProgress) {
        onProgress(`Sincronizzazione variazioni per ${variableProducts.length} prodotti variabili...`);
    }

    for (const vp of variableProducts) {
        try {
            const variations = await fetchWooProductVariations(vp.id);

            for (const v of variations) {
                const eventDate = parseVariationDate(v.attributes) || parseSkuDate(v.sku);

                await prisma.wooProductVariation.upsert({
                    where: { id: v.id },
                    update: {
                        name: v.name || vp.name,
                        sku: v.sku,
                        price: parseFloat(v.price || "0"),
                        stockQuantity: v.stock_quantity,
                        stockStatus: v.stock_status,
                        attributes: JSON.stringify(v.attributes),
                        eventDate: eventDate
                    },
                    create: {
                        id: v.id,
                        parentProductId: vp.id,
                        name: v.name || vp.name,
                        sku: v.sku,
                        price: parseFloat(v.price || "0"),
                        stockQuantity: v.stock_quantity,
                        stockStatus: v.stock_status,
                        attributes: JSON.stringify(v.attributes),
                        eventDate: eventDate
                    }
                });
                variationsCount++;
            }
        } catch (e) {
            console.error(`Error syncing variations for product ${vp.id}:`, e);
        }
    }

    return { count, variationsCount };
}

/**
 * Sync Orders from WooCommerce to Local DB
 * @param mode 'rapid' | 'full' | 'smart' | 'days'
     * @param value Contextual value (limit for rapid, days for days)
     */
export async function syncOrders(mode: 'rapid' | 'full' | 'smart' | 'days' = 'smart', value: number = 50, onProgress?: (msg: string) => void) {
    let orders: any[] = [];
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

        // Fix: WooCommerce max per_page is 100. If we want more, we must paginate.
        if (value <= 100) {
            params.set("per_page", value.toString());
            const res = await fetchWooOrders(params);
            orders = res.orders;
        } else {
            // value > 100, we need to loop
            let remaining = value;
            let page = 1;

            while (remaining > 0) {
                const batchSize = Math.min(remaining, 100);
                params.set("page", page.toString());
                params.set("per_page", batchSize.toString());

                if (onProgress) onProgress(`Scaricamento ordini... (batch ${page}, ${batchSize} items)`);

                try {
                    const res = await fetchWooOrders(params);
                    if (!res.orders || res.orders.length === 0) break;

                    orders = [...orders, ...res.orders];
                    remaining -= res.orders.length;
                    page++;

                    // If we got fewer than asked, we reached end of list
                    if (res.orders.length < batchSize) break;

                    // Small delay to be gentle
                    await new Promise(r => setTimeout(r, 200));

                } catch (e) {
                    console.error("Error fetching batch:", e);
                    break;
                }
            }
        }
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
                metaData: JSON.stringify(o.meta_data || []), // Capture extra fields
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
                metaData: JSON.stringify(o.meta_data || []), // Capture extra fields
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
                        total: total,
                        metaData: JSON.stringify(item.meta_data || [])
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
                        total: total,
                        metaData: JSON.stringify(item.meta_data || [])
                    }
                });
            }
        }
        count++;
    }

    return { count, updatedIds };
}
