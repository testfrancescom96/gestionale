import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    try {
        // Fetch existing rules
        const rules = await prisma.wooProductPricing.findMany({
            where: { wooProductId: productId },
            orderBy: { ordine: 'asc' }
        });

        return NextResponse.json(rules);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
        return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    try {
        const body = await request.json();

        // Handle "scan" action to discover variations from orders
        if (body.action === 'scan') {
            const rawItems = await prisma.wooOrderItem.findMany({
                where: { wooProductId: productId },
                select: { metaData: true, productName: true }
            });

            // Extract unique variations
            const foundVariations = new Set<string>();

            rawItems.forEach(item => {
                try {
                    const meta = JSON.parse(item.metaData || "[]");
                    if (Array.isArray(meta)) {
                        // 1. Check for Ticket Event keys
                        const serviceType = meta.find((m: any) => m.key === '_service_Tipologia biglietto');
                        if (serviceType) {
                            // Extract "Acconto Adulti" from "Acconto Adulti • 20€"
                            const val = serviceType.value || "";
                            const parts = val.split('•');
                            foundVariations.add(parts[0].trim());
                        }

                        // 2. Check for WCPA keys
                        const wcpaType = meta.find((m: any) => m.key === 'Tipologia biglietto');
                        if (wcpaType) {
                            // Extract "Blocca posto" from "Blocca posto (10€)"
                            let val = wcpaType.value || "";
                            // Regex removes (xxx €)
                            val = val.replace(/\s*\([\d,.]+\s*€\)/g, '').trim();
                            // Also handle pipe separator if present (some plugins use Label | Value)
                            const pipeParts = val.split('|');
                            val = pipeParts[0].trim();
                            foundVariations.add(val);
                        }
                    }
                } catch (e) { }
            });

            return NextResponse.json(Array.from(foundVariations));
        }

        // Handle SAVE/UPDATE rule
        const { identifier, type, fullPrice, depositPrice, nome, description } = body;

        if (!identifier || !fullPrice) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const rule = await prisma.wooProductPricing.upsert({
            where: {
                wooProductId_identifier: {
                    wooProductId: productId,
                    identifier: identifier
                }
            },
            update: {
                type,
                fullPrice: parseFloat(fullPrice),
                depositPrice: depositPrice ? parseFloat(depositPrice) : null,
                nome,
                description,
                updatedAt: new Date()
            },
            create: {
                wooProductId: productId,
                identifier,
                type,
                fullPrice: parseFloat(fullPrice),
                depositPrice: depositPrice ? parseFloat(depositPrice) : null,
                nome,
                description
            }
        });

        return NextResponse.json(rule);

    } catch (error: any) {
        console.error("Error saving pricing rule:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    // Implementation for deleting a rule if needed (by passing rule ID in query or body)
    // For simplicity, we might just assume managing via list in UI
    return NextResponse.json({ message: "Not implemented yet" });
}
