
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: returns available fields (scanned) + current config
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const limitParam = parseInt(searchParams.get("limit") || "100");
    const limit = Math.min(Math.max(limitParam, 50), 5000); // Clamp between 50 and 5000

    try {
        // 1. Get all saved configs
        const configs = await prisma.wooExportConfig.findMany();
        const configMap = new Map(configs.map(c => [c.fieldKey, c]));

        // 2. Scan distinct keys from WooOrderItem metaData
        const recentItems = await prisma.wooOrderItem.findMany({
            take: limit,
            where: { metaData: { not: null } },
            orderBy: { id: 'desc' },
            select: { metaData: true }
        });

        const foundKeys = new Set<string>();

        // 3. Scan distinct keys from WooOrder metaData (Order Level Fields)
        const recentOrders = await prisma.wooOrder.findMany({
            take: limit,
            where: { metaData: { not: null } },
            orderBy: { id: 'desc' },
            select: { metaData: true }
        });

        const processMeta = (metaStr: string | null) => {
            if (!metaStr) return;
            try {
                const meta = JSON.parse(metaStr);
                if (Array.isArray(meta)) {
                    meta.forEach((m: any) => {
                        const key = m.key || m.display_key;
                        const label = m.display_key || m.key;
                        if (key) {
                            const isInternal = key.startsWith('_');
                            const isRelevantInternal = isInternal && (
                                key.startsWith('_billing_') ||
                                key.startsWith('_shipping_') ||
                                key.includes('cf') ||
                                key.includes('piva') ||
                                key.includes('vat')
                            );

                            if (!isInternal || isRelevantInternal) {
                                foundKeys.add(JSON.stringify({ key, label }));
                            }
                        }
                    });
                }
            } catch (e) { }
        };

        recentItems.forEach(item => processMeta(item.metaData));
        recentOrders.forEach(order => processMeta(order.metaData));



        const result = [];
        // We need to deduplicate by KEY, because JSON.stringify might have different labels.
        const processedKeys = new Set<string>();

        // Priority 1: Saved Configs
        for (const [key, config] of configMap.entries()) {
            processedKeys.add(key);
            result.push({
                fieldKey: key,
                label: config.label,
                mappingType: config.mappingType,
                isSaved: true
            });
        }

        // Priority 2: Scanned Keys (if not already processed)
        for (const k of foundKeys) {
            const { key, label: hintLabel } = JSON.parse(k);
            if (!processedKeys.has(key)) {
                result.push({
                    fieldKey: key,
                    label: hintLabel || key,
                    mappingType: "COLUMN",
                    isSaved: false
                });
            }
        }

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Save/Update config
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { fieldKey, label, mappingType } = body;

        // If mappingType is "PARTENZA", unset others? Not strictly needed if we filter by type in export.
        // But for UI cleanliness, maybe we want only one Partenza? 
        // Let's keep it flexible for now, maybe multiply pickup points? 
        // Actually, logic usually expects one Partenza column. 
        // Let's settle on: Last one saved wins logic in export, or specific query.

        const config = await prisma.wooExportConfig.upsert({
            where: { fieldKey },
            update: { label, mappingType },
            create: { fieldKey, label, mappingType }
        });

        return NextResponse.json(config);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
