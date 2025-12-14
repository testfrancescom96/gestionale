import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Lista partecipanti di una pratica
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // id della pratica
) {
    const { id } = await params;

    try {
        const partecipanti = await prisma.partecipante.findMany({
            where: { praticaId: id },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json(partecipanti);
    } catch (error) {
        console.error("Errore recupero partecipanti:", error);
        return NextResponse.json(
            { error: "Errore durante il recupero dei partecipanti" },
            { status: 500 }
        );
    }
}

// POST: Aggiungi un partecipante
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();

        const partecipante = await prisma.partecipante.create({
            data: {
                praticaId: id,
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
                tipo: body.tipo || "ADULTO",
                note: body.note || null,
            },
        });

        // Aggiorna contatori pratica (opzionale, ma utile per coerenza)
        // const pratica = await prisma.pratica.findUnique({ where: { id } });
        // if (pratica) {
        //   // Logica per aggiornare numAdulti/numBambini...
        // }

        return NextResponse.json(partecipante);
    } catch (error) {
        console.error("Errore creazione partecipante:", error);
        return NextResponse.json(
            { error: "Errore durante la creazione del partecipante" },
            { status: 500 }
        );
    }
}
