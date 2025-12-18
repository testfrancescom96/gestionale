
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: returns available fields (scanned) + current config
export async function GET() {
    try {
        // 1. Get all saved configs
        const configs = await prisma.wooExportConfig.findMany();
        const configMap = new Map(configs.map(c => [c.fieldKey, c]));

        // 2. Scan distinct keys from WooOrderItem metaData
        // Ideally this should be a distinct query, but with JSON string it's hard.
        // We'll scan the last 200 items to find common keys.
        const recentItems = await prisma.wooOrderItem.findMany({
            take: 200,
            where: { metaData: { not: null } },
            orderBy: { id: 'desc' },
            select: { metaData: true }
        });

        const foundKeys = new Set<string>();

        recentItems.forEach(item => {
            if (!item.metaData) return;
            try {
                const meta = JSON.parse(item.metaData);
                if (Array.isArray(meta)) {
                    meta.forEach((m: any) => {
                        const key = m.key || m.display_key;
                        const label = m.display_key || m.key; // Use display key as label hint
                        if (key && !key.startsWith('_')) { // Skip internal Woo meta
                            foundKeys.add(JSON.stringify({ key, label }));
                        }
                    });
                }
            } catch (e) { }
        });

        // 3. Merge results
        const result = [];
        for (const k of foundKeys) {
            const { key, label: hintLabel } = JSON.parse(k);
            const saved = configMap.get(key);

            result.push({
                fieldKey: key,
                label: saved?.label || hintLabel || key,
                isPartenza: saved?.isPartenza || false,
                isVisible: saved?.isVisible || true, // Default true for discovered fields? Maybe make default true
                isSaved: !!saved
            });
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
        const { fieldKey, label, isPartenza, isVisible } = body;

        // If isPartenza is true, we should probably unset others to avoid conflicts?
        // Or just let the user decide. Let's ensure only one isPartenza for cleanliness, but not strictly required by logic.
        if (isPartenza) {
            await prisma.wooExportConfig.updateMany({
                where: { isPartenza: true },
                data: { isPartenza: false }
            });
        }

        const config = await prisma.wooExportConfig.upsert({
            where: { fieldKey },
            update: { label, isPartenza, isVisible },
            create: { fieldKey, label, isPartenza, isVisible }
        });

        return NextResponse.json(config);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
