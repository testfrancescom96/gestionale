import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DELETE: Rimuovi partecipante
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        await prisma.partecipante.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Errore eliminazione partecipante:", error);
        return NextResponse.json(
            { error: "Errore durante l'eliminazione del partecipante" },
            { status: 500 }
        );
    }
}

// PUT: Aggiorna partecipante
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();

        const partecipante = await prisma.partecipante.update({
            where: { id },
            data: {
                nome: body.nome,
                cognome: body.cognome,
                dataNascita: body.dataNascita ? new Date(body.dataNascita) : null,
                codiceFiscale: body.codiceFiscale || null,
                luogoNascita: body.luogoNascita || null,
                nazionalita: body.nazionalita || "IT",
                tipoDocumento: body.tipoDocumento || null,
                numeroDocumento: body.numeroDocumento || null,
                scadenzaDocumento: body.scadenzaDocumento ? new Date(body.scadenzaDocumento) : null,
                rilasciatoA: body.rilasciatoA || null,
                tipo: body.tipo,
                note: body.note || null,
            },
        });

        return NextResponse.json(partecipante);
    } catch (error) {
        console.error("Errore modifica partecipante:", error);
        return NextResponse.json(
            { error: "Errore durante la modifica del partecipante" },
            { status: 500 }
        );
    }
}
