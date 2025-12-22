import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";

// GET: Lista share links per un prodotto
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const productId = searchParams.get("productId");

    if (!productId) {
        return NextResponse.json({ error: "productId richiesto" }, { status: 400 });
    }

    try {
        const shares = await prisma.sharedPassengerList.findMany({
            where: { wooProductId: parseInt(productId) },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(shares);
    } catch (error: any) {
        console.error("Error fetching shares:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Crea nuovo link di condivisione
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            wooProductId,
            productId, // Also accept productId for compatibility
            nome,
            selectedColumns,
            showSaldo = true,
            showAcconto = false,
            expiresInDays
        } = body;

        // Accept either wooProductId or productId
        const finalProductId = wooProductId || productId;

        if (!finalProductId || !selectedColumns) {
            return NextResponse.json(
                { error: "wooProductId/productId e selectedColumns sono obbligatori" },
                { status: 400 }
            );
        }

        // Generate secure token
        const token = randomBytes(16).toString('hex');

        // Calculate expiration
        let expiresAt = null;
        if (expiresInDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        }

        const share = await prisma.sharedPassengerList.create({
            data: {
                wooProductId: parseInt(finalProductId),
                token,
                nome: nome || null,
                selectedColumns: JSON.stringify(selectedColumns),
                showSaldo,
                showAcconto,
                expiresAt
            }
        });

        // Return with full URL
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gestionale.goontheroad.it';
        const shareUrl = `${baseUrl}/share/${token}`;

        return NextResponse.json({
            success: true,
            share,
            shareUrl
        });
    } catch (error: any) {
        console.error("Error creating share:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Elimina share link
export async function DELETE(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "id richiesto" }, { status: 400 });
    }

    try {
        await prisma.sharedPassengerList.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting share:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
