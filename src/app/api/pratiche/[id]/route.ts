import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(
    request: NextRequest,
) {
    // Extract ID from URL path
    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
        return NextResponse.json(
            { error: "ID pratica non fornito" },
            { status: 400 }
        );
    }

    try {
        const body = await request.json();

        // Check Logic: Snapshotting
        // We trigger snapshot mainly when moving to ARCHIVIATA/CONCLUSA, or if valid snapshot is missing on an already archived practice
        let datiArchiviati = undefined;

        // Check if we are in/moving to an archived state
        const targetStato = body.stato; // The new state
        const isArchiving = targetStato === "ARCHIVIATA" || targetStato === "CONCLUSA";

        if (isArchiving) {
            const currentPratica = await prisma.pratica.findUnique({
                where: { id },
                select: {
                    // @ts-ignore: Field exists in DB
                    datiArchiviati: true,
                    clienteId: true,
                    fornitoreId: true
                }
            });

            // If no snapshot exists, create one
            // @ts-ignore
            if (!currentPratica?.datiArchiviati) {
                const cId = body.clienteId || currentPratica?.clienteId;
                const fId = body.fornitoreId || currentPratica?.fornitoreId;

                if (cId) {
                    const cliente = await prisma.cliente.findUnique({ where: { id: cId } });
                    let fornitore = null;
                    if (fId) {
                        fornitore = await prisma.fornitore.findUnique({ where: { id: fId } });
                    }
                    datiArchiviati = JSON.stringify({ cliente, fornitore, savedAt: new Date().toISOString() });
                }
            }
        }

        // Gestione Costi Multi-Fornitore
        let updateData: any = {
            // @ts-ignore
            datiArchiviati,

            // Cliente
            clienteId: body.clienteId || undefined,

            // Dati Richiesta
            operatore: body.operatore,

            // Tipologia Viaggio
            tipologia: body.tipologia,
            destinazione: body.destinazione,
            periodoRichiesto: body.periodoRichiesto || null,
            dataPartenza: body.dataPartenza ? new Date(body.dataPartenza) : null,
            dataRitorno: body.dataRitorno ? new Date(body.dataRitorno) : null,

            // Partecipanti
            numPartecipanti: (body.numAdulti || 0) + (body.numBambini || 0),
            numAdulti: body.numAdulti,
            numBambini: body.numBambini,
            etaBambini: body.etaBambini || null,
            tipologiaCamera: body.tipologiaCamera || null,

            // Partenza/Trasporto
            cittaPartenza: body.cittaPartenza || null,

            // Budget e Prezzi
            budgetCliente: body.budgetCliente || null,
            prezzoVendita: body.prezzoVendita || null,

            // Il valore margine viene ricalcolato dal client, lo salviamo
            margine: body.margineCalcolato || null,
            margineCalcolato: body.margineCalcolato || null,
            percentualeMargine: body.percentualeMargine || null,

            // Fornitore (Backward Compatibility / Main Supplier)
            fornitoreId: body.fornitoreId || null,
            nomeFornitore: body.nomeFornitore || null,

            // IVA e Fatturazione
            regimeIVA: body.regimeIVA || "74TER",
            aliquotaIVA: body.aliquotaIVA || 0,

            // Note e Feedback
            note: body.note || null,

            // Stato
            stato: body.stato,
            feedbackCliente: body.feedbackCliente || null,

            // Acconti e Saldi
            richiedeAcconto: body.richiedeAcconto,
            percentualeAcconto: body.percentualeAcconto,
            importoAcconto: body.importoAcconto || null,
            importoSaldo: body.importoSaldo || null,
        };

        // Handle Costi Array if present
        if (body.costi && Array.isArray(body.costi)) {
            // Calculate total cost
            const totalCost = body.costi.reduce((acc: number, c: any) => acc + (Number(c.importo) || 0), 0);
            updateData.costoFornitore = totalCost;

            // Prepare nested writes for CostoPratica
            // Strategy: Delete all existing and recreate (simplest for now to ensure sync)
            await prisma.costoPratica.deleteMany({ where: { praticaId: id } });

            updateData.costi = {
                create: body.costi.map((c: any) => ({
                    fornitoreId: c.fornitoreId || null,
                    nomeFornitore: c.nomeFornitore || null,
                    tipologia: c.tipologia || "ALTRO",
                    descrizione: c.descrizione || "",
                    importo: Number(c.importo) || 0
                }))
            };
        } else {
            // Legacy/Direct update support
            if (body.costoFornitore !== undefined) {
                updateData.costoFornitore = body.costoFornitore;
            }
        }

        // Handle Partecipanti Array
        if (body.partecipanti && Array.isArray(body.partecipanti)) {
            // Delete existing
            await prisma.partecipante.deleteMany({ where: { praticaId: id } });

            // Create new
            updateData.partecipanti = {
                create: body.partecipanti.map((p: any) => ({
                    nome: p.nome || "",
                    cognome: p.cognome || "",
                    dataNascita: p.dataNascita ? new Date(p.dataNascita) : null,
                    tipo: p.tipo || "ADULTO",
                    sistemazione: p.sistemazione || null // New field
                }))
            };
        }

        // Update della pratica
        const pratica = await prisma.pratica.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({
            success: true,
            pratica,
        });
    } catch (error) {
        console.error("Errore modifica pratica:", error);
        return NextResponse.json(
            { error: "Errore durante la modifica della pratica" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest
) {
    // Extract ID from URL path because params are not reliably passed in all Next.js versions/route handlers without strict typing
    const id = request.nextUrl.pathname.split('/').pop();

    if (!id) {
        return NextResponse.json(
            { error: "ID pratica non fornito" },
            { status: 400 }
        );
    }

    try {
        await prisma.pratica.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "Pratica eliminata con successo"
        });
    } catch (error) {
        console.error("Errore eliminazione pratica:", error);
        return NextResponse.json(
            { error: "Errore durante l'eliminazione della pratica" },
            { status: 500 }
        );
    }
}
