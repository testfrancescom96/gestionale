import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validazione base
        if (!body.clienteId) {
            return NextResponse.json(
                { error: "Cliente mancante. Seleziona un cliente." },
                { status: 400 }
            );
        }
        if (!body.destinazione || !body.operatore) {
            return NextResponse.json(
                { error: "Destinazione e operatore sono obbligatori" },
                { status: 400 }
            );
        }

        // Crea la pratica nel database
        const pratica = await prisma.pratica.create({
            data: {
                // Cliente
                clienteId: body.clienteId || undefined,

                // Dati Richiesta
                dataRichiesta: new Date(),
                operatore: body.operatore,

                // Tipologia Viaggio
                tipologia: body.tipologia,
                destinazione: body.destinazione,
                periodoRichiesto: body.periodoRichiesto || null,
                dataPartenza: body.dataPartenza ? new Date(body.dataPartenza) : null,
                dataRitorno: body.dataRitorno ? new Date(body.dataRitorno) : null,

                // Partecipanti
                numPartecipanti: body.numAdulti + body.numBambini,
                numAdulti: body.numAdulti || 1,
                numBambini: body.numBambini || 0,
                etaBambini: body.etaBambini || null,
                tipologiaCamera: body.tipologiaCamera || null,

                // Partenza/Trasporto
                cittaPartenza: body.cittaPartenza || null,

                // Budget e Prezzi
                budgetCliente: body.budgetCliente || null,
                prezzoVendita: body.prezzoVendita || null,
                costoFornitore: body.costoFornitore || null,
                commissione: null,
                margine: body.margineCalcolato || null,
                margineCalcolato: body.margineCalcolato || null,
                percentualeMargine: body.percentualeMargine || null,

                // Fornitore
                fornitoreId: body.fornitoreId || null,
                nomeFornitore: body.nomeFornitore || null,

                // IVA e Fatturazione
                regimeIVA: body.regimeIVA || "74TER",
                aliquotaIVA: body.aliquotaIVA || 0,

                // Note e Feedback
                note: body.note || null,
                richiesteSpeciali: null,

                // Stato
                stato: body.stato || "DA_ELABORARE",
                feedbackCliente: body.feedbackCliente || null,

                // Acconti e Saldi
                richiedeAcconto: body.richiedeAcconto || false,
                percentualeAcconto: body.percentualeAcconto || 30,
                importoAcconto: body.importoAcconto || null,
                importoSaldo: body.importoSaldo || null,
            },
            include: {
                cliente: true,
                fornitore: true,
            },
        });

        // 2. Auto-generazione Slot Partecipanti
        // Creiamo subito le righe vuote per facilitare l'inserimento
        const partecipantiDaCreare = [];

        // Slot Adulti
        for (let i = 0; i < (body.numAdulti || 1); i++) {
            partecipantiDaCreare.push({
                praticaId: pratica.id,
                nome: `Partecipante ${i + 1} (Adulto)`,
                cognome: "Da Inserire",
                tipo: "ADULTO",
                nazionalita: "IT"
            });
        }

        // Slot Bambini
        for (let i = 0; i < (body.numBambini || 0); i++) {
            partecipantiDaCreare.push({
                praticaId: pratica.id,
                nome: `Partecipante ${i + 1 + (body.numAdulti || 1)} (Bambino)`,
                cognome: "Da Inserire",
                tipo: "BAMBINO",
                nazionalita: "IT"
            });
        }

        if (partecipantiDaCreare.length > 0) {
            await prisma.partecipante.createMany({
                data: partecipantiDaCreare
            });
        }

        return NextResponse.json({
            success: true,
            pratica,
        });
    } catch (error) {
        console.error("Errore creazione pratica:", error);
        return NextResponse.json(
            { error: "Errore durante il salvataggio della pratica" },
            { status: 500 }
        );
    }
}
