import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Lista tutti i noleggi vettore
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fornitoreId = searchParams.get("fornitoreId");
        const year = searchParams.get("year");

        const whereClause: any = {};

        if (fornitoreId) {
            whereClause.fornitoreId = fornitoreId;
        }

        if (year) {
            const startDate = new Date(`${year}-01-01`);
            const endDate = new Date(`${parseInt(year) + 1}-01-01`);
            whereClause.dataPartenza = {
                gte: startDate,
                lt: endDate
            };
        }

        const noleggi = await prisma.noleggioVettore.findMany({
            where: whereClause,
            include: {
                fornitore: {
                    select: { ragioneSociale: true, nomeComune: true }
                }
            },
            orderBy: { dataPartenza: "desc" }
        });

        // Calcola statistiche
        const stats = {
            totaleNoleggi: noleggi.length,
            totaleNoleggio: noleggi.reduce((sum, n) => sum + (n.costoNoleggio || 0), 0),
            totaleZTL: noleggi.reduce((sum, n) => sum + (n.costoZTL || 0), 0),
            totalePagato: noleggi.filter(n => n.pagato).reduce((sum, n) => sum + (n.costoNoleggio || 0) + (n.costoZTL || 0), 0),
            daPagare: noleggi.filter(n => !n.pagato).reduce((sum, n) => sum + (n.costoNoleggio || 0) + (n.costoZTL || 0), 0),
        };

        return NextResponse.json({ noleggi, stats });
    } catch (error) {
        console.error("Errore recupero noleggi:", error);
        return NextResponse.json({ error: "Errore durante il recupero" }, { status: 500 });
    }
}

// POST: Crea nuovo noleggio
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.dataPartenza || !body.evento) {
            return NextResponse.json(
                { error: "Data partenza e evento sono obbligatori" },
                { status: 400 }
            );
        }

        const noleggio = await prisma.noleggioVettore.create({
            data: {
                fornitoreId: body.fornitoreId || null,
                nomeVettore: body.nomeVettore || null,
                dataPartenza: new Date(body.dataPartenza),
                dataRientro: body.dataRientro ? new Date(body.dataRientro) : null,
                evento: body.evento,
                capienzaBus: body.capienzaBus ? parseInt(body.capienzaBus) : null,
                hasBagno: body.hasBagno || false,
                hasPrese: body.hasPrese || false,
                targaBus: body.targaBus || null,
                noteBus: body.noteBus || null,
                numAutisti: body.numAutisti || 1,
                costoNoleggio: parseFloat(body.costoNoleggio) || 0,
                costoZTL: parseFloat(body.costoZTL) || 0,
                costoExtra: parseFloat(body.costoExtra) || 0,
                numeroFattura: body.numeroFattura || null,
                fatturaRicevuta: body.fatturaRicevuta || false,
                pagato: body.pagato || false,
                dataPagamento: body.dataPagamento ? new Date(body.dataPagamento) : null,
                importoPagato: body.importoPagato ? parseFloat(body.importoPagato) : null,
                metodoPagamento: body.metodoPagamento || null,
                note: body.note || null,
                wooProductId: body.wooProductId ? parseInt(body.wooProductId) : null,
            },
            include: {
                fornitore: { select: { ragioneSociale: true } }
            }
        });

        return NextResponse.json({ success: true, noleggio });
    } catch (error: any) {
        console.error("Errore creazione noleggio:", error);
        return NextResponse.json({ error: error.message || "Errore durante la creazione" }, { status: 500 });
    }
}
