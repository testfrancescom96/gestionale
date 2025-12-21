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
// Update type definition or just use options object
export async function syncProducts(options: { mode: 'full' | 'incremental', after?: Date } = { mode: 'incremental' }, onProgress?: (msg: string) => void) {
    let products: any[] = [];
    const params = new URLSearchParams({ status: 'any' });

    // Add date filter if present
    if (options.after) {
        params.set('after', options.after.toISOString());
    }

    if (options.mode === 'full') {
        products = await fetchAllWooProducts(params, onProgress);
    } else {
        if (onProgress) onProgress("Scaricamento rapido (ultima pagina)...");
        params.set('per_page', '100');
        const res = await fetchWooProducts(params);
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
                // @ts-ignore
                productType: productType,
                permalink: p.permalink,
                dateModified: new Date(p.date_modified),
                eventDate: eventDate,
                lastWooSync: new Date()
            },
            create: {
                id: p.id,
                name: p.name,
                sku: p.sku,
                price: parseFloat(p.price || "0"),
                status: p.status,
                // @ts-ignore
                productType: productType,
                permalink: p.permalink,
                dateCreated: new Date(p.date_created),
                dateModified: new Date(p.date_modified),
                eventDate: eventDate,
                lastWooSync: new Date()
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
 * Sync Orders
 */
export async function syncOrders(
    options: { mode: 'rapid' | 'full' | 'smart' | 'days' | 'product', limit?: number, days?: number, after?: Date, productId?: number },
    onProgress?: (msg: string) => void
) {
    let orders: any[] = [];
    let ids: number[] = []; // Renamed from updatedIds to ids
    const params = new URLSearchParams({ status: 'any' }); // Always fetch all statuses

    // Add date filter if present
    if (options.after) {
        params.set('after', options.after.toISOString());
    }

    if (options.mode === 'full') {
        if (onProgress) onProgress("Sync Completo: Potrebbe richiedere tempo...");
        orders = await fetchAllWooOrders(params, onProgress);
    } else if (options.mode === 'product' && options.productId) {
        if (onProgress) onProgress(`Sync mirato Evento #${options.productId}...`);
        // Fetch ALL orders for this product
        params.set('product', options.productId.toString());
        // We usually want ALL orders for the event, so use fetchAll
        orders = await fetchAllWooOrders(params, onProgress);
    } else if (options.mode === 'days') {
        const days = options.days || 30;
        // If 'after' is provided, it overrides days logic or we combine?
        // Let's use 'after' if present, otherwise calc from days
        if (!options.after) {
            const date = new Date();
            date.setDate(date.getDate() - days);
            params.set('after', date.toISOString());
        }
        orders = await fetchAllWooOrders(params, onProgress);
    } else if (options.mode === 'smart') {
        // Smart Sync: Fetch only orders modified since last successful sync
        const settings = await prisma.systemSettings.findFirst({ where: { id: 1 } });
        const lastSync = settings?.lastOrderSyncAt;

        if (lastSync) {
            // Use WooCommerce 'modified_after' parameter for true incremental sync
            params.set('modified_after', lastSync.toISOString());
            if (onProgress) onProgress(`Sync intelligente: modifiche dal ${lastSync.toLocaleString()}...`);
        } else {
            // First time: sync last 7 days
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            params.set('after', weekAgo.toISOString());
            if (onProgress) onProgress("Prima sync: ultimi 7 giorni...");
        }

        orders = await fetchAllWooOrders(params, onProgress);
    } else {
        // Rapid (by limit) - DEPRECATED but kept for compatibility
        const value = options.limit || 100;
        if (onProgress) onProgress(`Recupero ultimi ${value} ordini...`);

        if (value <= 100) {
            params.set("per_page", value.toString());
            const res = await fetchWooOrders(params);
            orders = res.orders;
        } else {
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

                    if (res.orders.length < batchSize) break;
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
    // const updatedIds: number[] = []; // This line is removed as per instruction

    if (total === 0 && onProgress) {
        onProgress("Nessuna modifica trovata.");
    }

    for (const o of orders) {
        if (count % 10 === 0 && onProgress) { // Changed from 5 to 10 as per snippet
            onProgress(`Salvataggio ordini: ${count}/${total}...`);
        }

        // Track ID
        ids.push(o.id); // Use 'ids' array
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
                customerNote: o.customer_note || null, // Note inserite dal cliente
                // @ts-ignore
                metaData: JSON.stringify(o.meta_data || []), // Capture extra fields
                updatedAt: new Date(), // Updates local timestamp
                lastWooSync: new Date()
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
                customerNote: o.customer_note || null, // Note inserite dal cliente
                // @ts-ignore
                metaData: JSON.stringify(o.meta_data || []), // Capture extra fields
                lastWooSync: new Date()
            }
        });

        // Detect change
        let changed = false;
        if (!existing) changed = true; // New
        else if (existing.status !== o.status || Math.abs(existing.total - parseFloat(o.total)) > 0.01) {
            changed = true; // Updated status or total
        }

        // The original logic pushed to updatedIds here, but now we push to 'ids' unconditionally above.
        // If the intent was to only track *changed* IDs, the `ids.push(o.id)` should be inside `if (changed)`.
        // Sticking to the provided snippet's explicit `ids.push(o.id)` and final return.
        // if (changed) {
        //     ids.push(o.id);
        // }

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

    const res = { count, updatedIds: ids }; // Return 'ids' as 'updatedIds'

    // Phase 1: Update lastBookingAt for the target product if in product mode
    if (options.mode === 'product' && options.productId && orders.length > 0) {
        // Find most recent order date
        const dates = orders.map(o => new Date(o.date_created).getTime());
        const maxDate = new Date(Math.max(...dates));

        try {
            await prisma.wooProduct.update({
                where: { id: options.productId },
                data: {
                    // @ts-ignore
                    lastBookingAt: maxDate
                }
            });
        } catch (e) {
            console.error("Failed to update lastBookingAt", e);
        }
    }

    // Update lastOrderSyncAt for smart sync mode
    if (options.mode === 'smart' && count > 0) {
        try {
            await prisma.systemSettings.upsert({
                where: { id: 1 },
                update: { lastOrderSyncAt: new Date() },
                create: { id: 1, lastOrderSyncAt: new Date() }
            });
        } catch (e) {
            console.error("Failed to update lastOrderSyncAt", e);
        }
    }

    // Auto-detect and save new fields from order metaData
    if (orders.length > 0) {
        try {
            const detectedFields = new Map<string, string>(); // key -> displayLabel

            for (const o of orders) {
                for (const item of o.line_items || []) {
                    const metaData = item.meta_data || [];
                    for (const field of metaData) {
                        const key = field.key || field.display_key;
                        const label = field.display_key || field.key || key;

                        // Skip only truly internal fields like _product_type, allow _field_* and _service_*
                        if (key && key !== '_product_type' && !detectedFields.has(key)) {
                            detectedFields.set(key, label);
                        }
                    }
                }
            }

            // Upsert detected fields into WooExportConfig
            for (const [fieldKey, label] of detectedFields) {
                await prisma.wooExportConfig.upsert({
                    where: { fieldKey: fieldKey },
                    update: {}, // Don't overwrite existing config
                    create: {
                        fieldKey: fieldKey,
                        label: label,
                        mappingType: "COLUMN" // Default visible
                    }
                });
            }

            if (detectedFields.size > 0) {
                console.log(`Auto-detected ${detectedFields.size} fields from orders`);
            }
        } catch (e) {
            console.error("Failed to auto-detect fields", e);
        }
    }

    return res;
}
