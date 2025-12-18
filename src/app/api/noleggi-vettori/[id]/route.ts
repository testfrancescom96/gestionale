import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Singolo noleggio
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const noleggio = await prisma.noleggioVettore.findUnique({
            where: { id },
            include: {
                fornitore: { select: { ragioneSociale: true, nomeComune: true } }
            }
        });

        if (!noleggio) {
            return NextResponse.json({ error: "Noleggio non trovato" }, { status: 404 });
        }

        return NextResponse.json(noleggio);
    } catch (error) {
        console.error("Errore:", error);
        return NextResponse.json({ error: "Errore" }, { status: 500 });
    }
}

// PUT: Aggiorna noleggio
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await request.json();

        const noleggio = await prisma.noleggioVettore.update({
            where: { id },
            data: {
                fornitoreId: body.fornitoreId || null,
                nomeVettore: body.nomeVettore || null,
                dataPartenza: body.dataPartenza ? new Date(body.dataPartenza) : undefined,
                dataRientro: body.dataRientro ? new Date(body.dataRientro) : null,
                evento: body.evento,
                capienzaBus: body.capienzaBus ? parseInt(body.capienzaBus) : null,
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
            }
        });

        return NextResponse.json({ success: true, noleggio });
    } catch (error: any) {
        console.error("Errore aggiornamento:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE: Elimina noleggio
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.noleggioVettore.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Errore eliminazione:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
