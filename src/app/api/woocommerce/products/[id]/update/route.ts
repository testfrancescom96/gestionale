import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { updateWooProduct } from "@/lib/woocommerce";

interface UpdatePayload {
    name?: string;
    description?: string;
    regular_price?: string;
    sale_price?: string;
    stock_quantity?: number;
    manage_stock?: boolean;
    menu_order?: number;
    meta_data?: { key: string; value: string }[];
}

/**
 * PUT /api/woocommerce/products/[id]/update
 * Aggiorna un prodotto sia localmente che su WooCommerce
 */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
        return NextResponse.json({ error: "ID prodotto non valido" }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { updates, modifiedBy } = body;

        if (!updates || Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "Nessuna modifica specificata" }, { status: 400 });
        }

        // 1. Get current product state
        const currentProduct = await prisma.wooProduct.findUnique({
            where: { id: productId }
        });

        if (!currentProduct) {
            return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
        }

        // Cast to any to access new fields that may not be in old schema
        const cp = currentProduct as any;

        // 2. Prepare local update and log entries
        const localUpdates: any = {};
        const logEntries: any[] = [];
        const wooUpdates: UpdatePayload = {};

        // Map fields to local and WooCommerce formats
        if (updates.name !== undefined && updates.name !== currentProduct.name) {
            localUpdates.name = updates.name;
            wooUpdates.name = updates.name;
            logEntries.push({
                productId,
                fieldName: 'name',
                oldValue: currentProduct.name,
                newValue: updates.name,
                modifiedBy
            });
        }

        if (updates.description !== undefined && updates.description !== cp.description) {
            localUpdates.description = updates.description;
            wooUpdates.description = updates.description;
            logEntries.push({
                productId,
                fieldName: 'description',
                oldValue: cp.description || '',
                newValue: updates.description,
                modifiedBy
            });
        }

        if (updates.regularPrice !== undefined) {
            const newPrice = parseFloat(updates.regularPrice);
            const oldPrice = cp.regularPrice ?? currentProduct.price;
            if (newPrice !== oldPrice) {
                localUpdates.regularPrice = newPrice;
                localUpdates.price = newPrice; // Also update main price
                wooUpdates.regular_price = updates.regularPrice.toString();
                logEntries.push({
                    productId,
                    fieldName: 'regularPrice',
                    oldValue: oldPrice?.toString() || '',
                    newValue: updates.regularPrice.toString(),
                    modifiedBy
                });
            }
        }

        if (updates.salePrice !== undefined) {
            const newPrice = updates.salePrice ? parseFloat(updates.salePrice) : null;
            if (newPrice !== cp.salePrice) {
                localUpdates.salePrice = newPrice;
                wooUpdates.sale_price = updates.salePrice?.toString() || '';
                logEntries.push({
                    productId,
                    fieldName: 'salePrice',
                    oldValue: cp.salePrice?.toString() || '',
                    newValue: updates.salePrice?.toString() || '',
                    modifiedBy
                });
            }
        }

        if (updates.stockQuantity !== undefined) {
            const newStock = parseInt(updates.stockQuantity);
            if (newStock !== cp.stockQuantity) {
                localUpdates.stockQuantity = newStock;
                wooUpdates.stock_quantity = newStock;
                wooUpdates.manage_stock = true;
                logEntries.push({
                    productId,
                    fieldName: 'stockQuantity',
                    oldValue: cp.stockQuantity?.toString() || '',
                    newValue: newStock.toString(),
                    modifiedBy
                });
            }
        }

        if (updates.manageStock !== undefined && updates.manageStock !== cp.manageStock) {
            localUpdates.manageStock = updates.manageStock;
            wooUpdates.manage_stock = updates.manageStock;
            logEntries.push({
                productId,
                fieldName: 'manageStock',
                oldValue: (cp.manageStock ?? false).toString(),
                newValue: updates.manageStock.toString(),
                modifiedBy
            });
        }

        // Handle menuOrder (posizione menu per ordinamento)
        if (updates.menuOrder !== undefined) {
            const newOrder = parseInt(updates.menuOrder) || 0;
            const oldOrder = cp.menuOrder ?? 0;
            if (newOrder !== oldOrder) {
                localUpdates.menuOrder = newOrder;
                wooUpdates.menu_order = newOrder;
                logEntries.push({
                    productId,
                    fieldName: 'menuOrder',
                    oldValue: oldOrder.toString(),
                    newValue: newOrder.toString(),
                    modifiedBy
                });
            }
        }

        // Handle meta_data updates (custom fields)
        if (updates.metaData && Array.isArray(updates.metaData)) {
            const currentMeta = cp.metaData ? JSON.parse(cp.metaData) : [];
            const newMetaArray: { key: string; value: string }[] = [];

            for (const meta of updates.metaData) {
                const existing = currentMeta.find((m: any) => m.key === meta.key);
                if (!existing || existing.value !== meta.value) {
                    newMetaArray.push({ key: meta.key, value: meta.value });
                    logEntries.push({
                        productId,
                        fieldName: `metaData.${meta.key}`,
                        oldValue: existing?.value || '',
                        newValue: meta.value,
                        modifiedBy
                    });
                }
            }

            if (newMetaArray.length > 0) {
                wooUpdates.meta_data = newMetaArray;
                // Merge with existing local metaData
                const mergedMeta = [...currentMeta];
                for (const newMeta of newMetaArray) {
                    const idx = mergedMeta.findIndex((m: any) => m.key === newMeta.key);
                    if (idx >= 0) {
                        mergedMeta[idx] = newMeta;
                    } else {
                        mergedMeta.push(newMeta);
                    }
                }
                localUpdates.metaData = JSON.stringify(mergedMeta);
            }
        }

        if (logEntries.length === 0) {
            return NextResponse.json({
                success: true,
                message: "Nessuna modifica effettiva rilevata",
                changes: 0
            });
        }

        // 3. Update WooCommerce first
        let syncError: string | null = null;
        let syncedAt: Date | null = null;

        try {
            await updateWooProduct(productId, wooUpdates);
            syncedAt = new Date();
        } catch (wooError: any) {
            console.error("WooCommerce sync error:", wooError);
            syncError = wooError.message || "Errore sync WooCommerce";
        }

        // 4. Update local database
        await prisma.wooProduct.update({
            where: { id: productId },
            data: {
                ...localUpdates,
                lastWooSync: syncedAt || undefined
            }
        });

        // 5. Create log entries
        try {
            await (prisma as any).productModificationLog.createMany({
                data: logEntries.map(log => ({
                    ...log,
                    syncedToWoo: !!syncedAt,
                    syncedAt,
                    syncError
                }))
            });
        } catch (logError) {
            console.error("Error creating logs (table may not exist yet):", logError);
        }

        return NextResponse.json({
            success: true,
            changes: logEntries.length,
            syncedToWoo: !!syncedAt,
            syncError,
            message: syncedAt
                ? `${logEntries.length} modifiche salvate e sincronizzate con WooCommerce`
                : `${logEntries.length} modifiche salvate localmente. Sync fallito: ${syncError}`
        });

    } catch (error: any) {
        console.error("Error updating product:", error);
        return NextResponse.json({
            error: "Errore durante l'aggiornamento",
            details: error.message
        }, { status: 500 });
    }
}

/**
 * GET /api/woocommerce/products/[id]/update
 * Ottiene lo storico delle modifiche per un prodotto
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
        const logs = await (prisma as any).productModificationLog.findMany({
            where: { productId },
            orderBy: { modifiedAt: 'desc' },
            take: 50
        });

        return NextResponse.json(logs || []);

    } catch (error: any) {
        console.error("Error fetching modification logs:", error);
        // Return empty array if table doesn't exist yet
        return NextResponse.json([]);
    }
}
