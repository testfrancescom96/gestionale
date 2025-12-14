import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Recupera tutti i clienti o cerca per nome/telefono
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");

        let clienti;

        if (query) {
            // Ricerca per nome, cognome o telefono
            clienti = await prisma.cliente.findMany({
                where: {
                    OR: [
                        { nome: { contains: query } },
                        { cognome: { contains: query } },
                        { telefono: { contains: query } },
                        { email: { contains: query } },
                    ],
                },
                orderBy: [
                    { cognome: "asc" },
                    { nome: "asc" },
                ],
                take: 50, // Increase limit to find more results
            });
        } else {
            // Restituisci tutti i clienti
            clienti = await prisma.cliente.findMany({
                orderBy: [
                    { cognome: "asc" },
                    { nome: "asc" },
                ],
            });
        }

        return NextResponse.json({ clienti });
    } catch (error) {
        console.error("Errore recupero clienti:", error);
        return NextResponse.json(
            { error: "Errore durante il recupero dei clienti" },
            { status: 500 }
        );
    }
}

// POST - Crea un nuovo cliente
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validazione
        // Validazione (Nome e Cognome obbligatori, il resto opzionale per preventivi)
        if (!body.nome || !body.cognome) {
            return NextResponse.json(
                { error: "Nome e cognome sono obbligatori" },
                { status: 400 }
            );
        }

        // Crea il cliente nel database
        const cliente = await prisma.cliente.create({
            data: {
                nome: body.nome,
                cognome: body.cognome,
                email: body.email || null,
                telefono: body.telefono || null,
                indirizzo: body.via ? `${body.via}, ${body.civico || ''}` : null,
                citta: body.citta || null,
                cap: body.cap || null,
                provincia: body.provincia || null,
                codiceFiscale: body.codiceFiscale || null,
                dataNascita: body.dataNascita ? new Date(body.dataNascita) : null,
            },
        });

        return NextResponse.json({
            success: true,
            cliente,
        });
    } catch (error: any) {
        console.error("Errore creazione cliente:", error);

        // Gestione errore duplicato (Prisma P2002)
        if (error.code === 'P2002' && error.meta?.target?.includes('codiceFiscale')) {
            return NextResponse.json(
                { error: "Esiste già un cliente con questo Codice Fiscale" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Errore durante la creazione del cliente" },
            { status: 500 }
        );
    }
}
