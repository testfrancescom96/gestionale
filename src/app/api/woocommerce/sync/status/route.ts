import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/woocommerce/sync/status
 * Returns the last sync timestamps for products and orders
 */
export async function GET() {
    try {
        // Get or create system settings
        let settings = await prisma.systemSettings.findUnique({
            where: { id: 1 }
        });

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: { id: 1 }
            });
        }

        return NextResponse.json({
            lastOrderSyncAt: settings.lastOrderSyncAt,
            lastProductSyncAt: settings.lastProductSyncAt,
        });
    } catch (error) {
        console.error("Error fetching sync status:", error);
        return NextResponse.json({ error: "Errore nel recupero stato sync" }, { status: 500 });
    }
}

/**
 * PATCH /api/woocommerce/sync/status
 * Updates the last sync timestamp for orders or products
 */
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        // Support both old format (type) and new format (updateOrders/updateProducts)
        const { type, updateOrders, updateProducts } = body;

        const now = new Date();
        const updateData: { lastOrderSyncAt?: Date; lastProductSyncAt?: Date } = {};

        // New format
        if (updateOrders) {
            updateData.lastOrderSyncAt = now;
        }
        if (updateProducts) {
            updateData.lastProductSyncAt = now;
        }

        // Old format (backwards compatibility)
        if (type === 'orders' || type === 'both') {
            updateData.lastOrderSyncAt = now;
        }
        if (type === 'products' || type === 'both') {
            updateData.lastProductSyncAt = now;
        }

        // Upsert system settings
        const settings = await prisma.systemSettings.upsert({
            where: { id: 1 },
            update: updateData,
            create: { id: 1, ...updateData }
        });

        return NextResponse.json({
            lastOrderSyncAt: settings.lastOrderSyncAt,
            lastProductSyncAt: settings.lastProductSyncAt,
        });
    } catch (error) {
        console.error("Error updating sync status:", error);
        return NextResponse.json({ error: "Errore nell'aggiornamento stato sync" }, { status: 500 });
    }
}
