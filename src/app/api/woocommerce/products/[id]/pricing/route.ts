import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Lista tariffe per un prodotto
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
        const pricing = await prisma.productPricing.findMany({
            where: { wooProductId: productId },
            orderBy: { ordine: 'asc' }
        });

        return NextResponse.json(pricing);
    } catch (error: any) {
        console.error("Error fetching pricing:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Crea/aggiorna tariffa
export async function POST(
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
        const { pricingId, nome, prezzo, ordine, attivo } = body;

        if (!nome || prezzo === undefined) {
            return NextResponse.json({ error: "Nome e prezzo sono obbligatori" }, { status: 400 });
        }

        let pricing;

        if (pricingId) {
            // Update existing
            pricing = await prisma.productPricing.update({
                where: { id: pricingId },
                data: {
                    nome,
                    prezzo: parseFloat(prezzo),
                    ordine: ordine || 0,
                    attivo: attivo ?? true
                }
            });
        } else {
            // Create new
            pricing = await prisma.productPricing.create({
                data: {
                    wooProductId: productId,
                    nome,
                    prezzo: parseFloat(prezzo),
                    ordine: ordine || 0,
                    attivo: attivo ?? true
                }
            });
        }

        return NextResponse.json(pricing);
    } catch (error: any) {
        console.error("Error saving pricing:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Elimina tariffa
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { searchParams } = request.nextUrl;
    const pricingId = searchParams.get("pricingId");

    if (!pricingId) {
        return NextResponse.json({ error: "pricingId richiesto" }, { status: 400 });
    }

    try {
        await prisma.productPricing.delete({
            where: { id: parseInt(pricingId) }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting pricing:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
