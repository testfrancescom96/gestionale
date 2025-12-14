
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Lista fornitore + Conteggio Pratiche
export async function GET() {
    try {
        const fornitori = await prisma.fornitore.findMany({
            orderBy: { ragioneSociale: "asc" },
            include: {
                _count: {
                    select: { pratiche: true },
                },
            },
        });
        return NextResponse.json(fornitori);
    } catch (error) {
        return NextResponse.json({ error: "Errore recupero fornitori" }, { status: 500 });
    }
}

// POST: Crea nuovo fornitore
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Controllo P.IVA duplicata SOLO SE PRESENTE
        if (body.partitaIVA) {
            const existing = await prisma.fornitore.findUnique({
                where: { partitaIVA: body.partitaIVA },
            });

            if (existing) {
                return NextResponse.json(
                    { error: "Un fornitore con questa Partita IVA esiste già." },
                    { status: 400 }
                );
            }
        }

        const fornitore = await prisma.fornitore.create({
            data: {
                ragioneSociale: body.ragioneSociale || body.denominazione, // Supporto entrambi i campi
                nomeComune: body.nomeComune || null,
                tipoFornitore: body.tipoFornitore || "ALTRO",
                email: body.email || null,
                telefono: body.telefono || null,
                sitoWeb: body.sitoWeb || null,
                via: body.via || null,
                civico: body.civico || null,
                indirizzo: body.indirizzo || null, // Se hai unificato usa questo
                citta: body.citta || null,
                cap: body.cap || null,
                provincia: body.provincia || null,
                partitaIVA: body.partitaIVA,
                codiceFiscale: body.codiceFiscale || null,
                pec: body.pec || null,
                codiceSDI: body.codiceSDI || null,
                tipologiaFatturazione: body.tipologiaFatturazione || "ORDINARIA",
                applicaRitenuta: body.applicaRitenuta || false,
                percentualeRitenuta: body.percentualeRitenuta || 0,
                note: body.note || null,
            },
            // include: { servizi: true }
        });

        return NextResponse.json(fornitore);
    } catch (error) {
        console.error("Errore creazione fornitore:", error);
        return NextResponse.json(
            { error: "Errore durante la creazione del fornitore" },
            { status: 500 }
        );
    }
}
