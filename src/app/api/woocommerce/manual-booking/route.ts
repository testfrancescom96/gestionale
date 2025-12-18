import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Lista prenotazioni manuali per un prodotto
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const productId = searchParams.get("productId");

    if (!productId) {
        return NextResponse.json({ error: "productId richiesto" }, { status: 400 });
    }

    try {
        const bookings = await prisma.manualBooking.findMany({
            where: { wooProductId: parseInt(productId) },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ bookings });
    } catch (error: any) {
        console.error("Error fetching manual bookings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Crea prenotazione manuale
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            wooProductId,
            cognome,
            nome,
            telefono,
            email,
            puntoPartenza,
            numPartecipanti,
            codiceFiscale,
            camera,
            note,
            importo,
            customData
        } = body;

        if (!wooProductId || !cognome || !nome) {
            return NextResponse.json(
                { error: "wooProductId, cognome e nome sono obbligatori" },
                { status: 400 }
            );
        }

        const booking = await prisma.manualBooking.create({
            data: {
                wooProductId: parseInt(wooProductId),
                cognome,
                nome,
                telefono: telefono || null,
                email: email || null,
                puntoPartenza: puntoPartenza || null,
                numPartecipanti: numPartecipanti || 1,
                codiceFiscale: codiceFiscale || null,
                camera: camera || null,
                note: note || null,
                importo: importo ? parseFloat(importo) : null,
                customData: customData ? JSON.stringify(customData) : null
            }
        });

        return NextResponse.json({ success: true, booking });
    } catch (error: any) {
        console.error("Error creating manual booking:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Elimina prenotazione manuale
export async function DELETE(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "id richiesto" }, { status: 400 });
    }

    try {
        await prisma.manualBooking.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting manual booking:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
