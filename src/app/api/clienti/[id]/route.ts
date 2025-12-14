import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Recupera singolo cliente per modifica
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const cliente = await prisma.cliente.findUnique({
            where: { id },
        });

        if (!cliente) {
            return NextResponse.json({ error: "Cliente non trovato" }, { status: 404 });
        }

        return NextResponse.json(cliente);
    } catch (error) {
        console.error("Errore recupero cliente:", error);
        return NextResponse.json(
            { error: "Errore durante il recupero del cliente" },
            { status: 500 }
        );
    }
}

// PUT: Aggiorna cliente
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();

        const cliente = await prisma.cliente.update({
            where: { id },
            data: {
                nome: body.nome,
                cognome: body.cognome,
                email: body.email || null,
                telefono: body.telefono || null,
                indirizzo: body.indirizzo || null, // Notare che nel form potrebbe essere separato in via/civico
                citta: body.citta || null,
                cap: body.cap || null,
                provincia: body.provincia || null,
                codiceFiscale: body.codiceFiscale || null,
            },
        });

        return NextResponse.json(cliente);
    } catch (error) {
        console.error("Errore modifica cliente:", error);
        return NextResponse.json(
            { error: "Errore durante la modifica del cliente" },
            { status: 500 }
        );
    }
}

// DELETE: Elimina cliente
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        // Verifica se ha pratiche associate
        const hasPratiche = await prisma.pratica.findFirst({
            where: { clienteId: id },
        });

        if (hasPratiche) {
            return NextResponse.json(
                { error: "Impossibile eliminare: il cliente ha delle pratiche associate." },
                { status: 400 }
            );
        }

        await prisma.cliente.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Errore eliminazione cliente:", error);
        return NextResponse.json(
            { error: "Errore durante l'eliminazione del cliente" },
            { status: 500 }
        );
    }
}
