import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Recupera singolo fornitore con servizi
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const fornitore = await prisma.fornitore.findUnique({
            where: { id },
            include: { servizi: true } // Importante: includere i servizi
        });

        if (!fornitore) {
            return NextResponse.json({ error: "Fornitore non trovato" }, { status: 404 });
        }

        return NextResponse.json(fornitore);
    } catch (error) {
        console.error("Errore recupero fornitore:", error);
        return NextResponse.json(
            { error: "Errore durante il recupero del fornitore" },
            { status: 500 }
        );
    }
}

// PUT: Aggiorna fornitore e i suoi servizi
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();

        // Transaction per gestire update fornitore e replace servizi
        const result = await prisma.$transaction(async (tx) => {
            // 1. Aggiorna dati anagrafici
            const updatedFornitore = await tx.fornitore.update({
                where: { id },
                data: {
                    ragioneSociale: body.ragioneSociale,
                    nomeComune: body.nomeComune || null,
                    tipoFornitore: body.tipoFornitore,
                    email: body.email || null,
                    telefono: body.telefono || null,
                    sitoWeb: body.sitoWeb || null,
                    via: body.via || null,
                    civico: body.civico || null,
                    indirizzo: body.indirizzo || null,
                    citta: body.citta || null,
                    cap: body.cap || null,
                    provincia: body.provincia || null,
                    partitaIVA: body.partitaIVA || null,
                    codiceFiscale: body.codiceFiscale || null,
                    pec: body.pec || null,
                    codiceSDI: body.codiceSDI || null,
                    tipologiaFatturazione: body.tipologiaFatturazione || "ORDINARIA",
                    applicaRitenuta: body.applicaRitenuta || false,
                    percentualeRitenuta: body.percentualeRitenuta || 0,
                    note: body.note || null,
                },
            });

            // 2. Gestione Servizi (Strategia: Delete All + Create New per semplicità)
            // Se volessimo essere fini, faremmo update per id esistenti, ma questo è più robusto per liste piccole
            if (body.servizi) {
                await tx.servizioFornitore.deleteMany({
                    where: { fornitoreId: id }
                });

                if (body.servizi.length > 0) {
                    await tx.servizioFornitore.createMany({
                        data: body.servizi.map((s: any) => ({
                            fornitoreId: id,
                            nome: s.nome,
                            aliquotaIva: s.aliquotaIva,
                            descrizione: s.descrizione || null,
                        }))
                    });
                }
            }

            return updatedFornitore;
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("Errore modifica fornitore:", error);
        return NextResponse.json(
            { error: "Errore durante la modifica del fornitore" },
            { status: 500 }
        );
    }
}

// DELETE: Elimina fornitore
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        // Verifica dipendenze (Pratiche, Fatture)
        const hasPratiche = await prisma.pratica.findFirst({
            where: { fornitoreId: id },
        });

        if (hasPratiche) {
            return NextResponse.json(
                { error: "Impossibile eliminare: il fornitore è associato a delle pratiche." },
                { status: 400 }
            );
        }

        await prisma.fornitore.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Errore eliminazione fornitore:", error);
        return NextResponse.json(
            { error: "Errore durante l'eliminazione del fornitore" },
            { status: 500 }
        );
    }
}
