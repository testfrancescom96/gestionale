import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // 1. Recupera Dati Pratica
        const pratica = await prisma.pratica.findUnique({
            where: { id },
            include: {
                cliente: true,
                partecipanti: true,
                costi: {
                    include: {
                        fornitore: true
                    }
                },
                pagamenti: true,
            },
        });

        if (!pratica || !pratica.cliente) {
            return NextResponse.json({ error: "Pratica o Cliente non trovati" }, { status: 404 });
        }

        // 1b. Applica Snapshot se presente (Dati Storici)
        // @ts-ignore
        if (pratica.datiArchiviati) {
            try {
                // @ts-ignore
                const snapshot = JSON.parse(pratica.datiArchiviati);
                if (snapshot.cliente) {
                    // @ts-ignore
                    pratica.cliente = { ...pratica.cliente, ...snapshot.cliente };
                }
                // Se ci sono altri dati storici (es. fornitore), si possono mappare qui
            } catch (e) {
                console.error("Errore parsing dati archiviati", e);
            }
        }

        // 2. Crea PDF da zero
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595, 842]); // A4
        const { width, height } = page.getSize();

        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        let yPosition = height - 50;
        const margin = 50;
        const lineHeight = 15;

        // Helper function to draw text
        const drawText = (text: string, x: number, size: number = 10, isBold: boolean = false) => {
            page.drawText(text, {
                x,
                y: yPosition,
                size,
                font: isBold ? fontBold : font,
                color: rgb(0, 0, 0),
            });
        };

        const drawLine = () => {
            page.drawLine({
                start: { x: margin, y: yPosition },
                end: { x: width - margin, y: yPosition },
                thickness: 0.5,
                color: rgb(0.8, 0.8, 0.8),
            });
        };

        // === HEADER ===
        drawText("ESTRATTO CONTO / RAPPORTINO", margin, 18, true);
        yPosition -= lineHeight * 2;

        drawText(`Pratica N° ${pratica.numero || pratica.id.substring(0, 8)}`, margin, 12, true);
        drawText(`Data: ${format(new Date(), "dd/MM/yyyy", { locale: it })}`, width - 150, 10);
        yPosition -= lineHeight * 2;

        drawLine();
        yPosition -= lineHeight;

        // === CLIENTE ===
        drawText("CLIENTE", margin, 12, true);
        yPosition -= lineHeight;
        drawText(`${pratica.cliente.cognome} ${pratica.cliente.nome}`, margin, 10);
        yPosition -= lineHeight;
        if (pratica.cliente.codiceFiscale) {
            drawText(`CF: ${pratica.cliente.codiceFiscale}`, margin, 9);
            yPosition -= lineHeight;
        }
        if (pratica.cliente.indirizzo || pratica.cliente.citta) {
            const address = [pratica.cliente.indirizzo, pratica.cliente.citta, pratica.cliente.provincia].filter(Boolean).join(", ");
            drawText(address, margin, 9);
            yPosition -= lineHeight;
        }
        yPosition -= lineHeight;

        // === DETTAGLI VIAGGIO ===
        drawText("DETTAGLI VIAGGIO", margin, 12, true);
        yPosition -= lineHeight;
        drawText(`Destinazione: ${pratica.destinazione}`, margin, 10);
        yPosition -= lineHeight;
        if (pratica.dataPartenza) {
            drawText(`Partenza: ${format(pratica.dataPartenza, "dd/MM/yyyy")}`, margin, 9);
            yPosition -= lineHeight;
        }
        if (pratica.dataRitorno) {
            drawText(`Ritorno: ${format(pratica.dataRitorno, "dd/MM/yyyy")}`, margin, 9);
            yPosition -= lineHeight;
        }
        drawText(`Partecipanti: ${pratica.numAdulti} adulti, ${pratica.numBambini} bambini`, margin, 9);
        yPosition -= lineHeight * 2;

        drawLine();
        yPosition -= lineHeight;

        // === COSTI ===
        drawText("DETTAGLIO COSTI", margin, 12, true);
        yPosition -= lineHeight;

        if (pratica.costi && pratica.costi.length > 0) {
            pratica.costi.forEach((costo) => {
                const fornitore = costo.nomeFornitore || costo.fornitore?.ragioneSociale || "N/D";
                const desc = costo.descrizione || costo.tipologia || "";
                drawText(`${fornitore} - ${desc}`, margin + 10, 9);
                drawText(`€ ${costo.importo.toFixed(2)}`, width - 150, 9);
                yPosition -= lineHeight;
            });
        } else {
            drawText("Nessun costo registrato", margin + 10, 9);
            yPosition -= lineHeight;
        }

        const totaleCosti = pratica.costoFornitore || 0;
        yPosition -= 5;
        drawLine();
        yPosition -= lineHeight;
        drawText("TOTALE COSTI:", margin + 10, 10, true);
        drawText(`€ ${totaleCosti.toFixed(2)}`, width - 150, 10, true);
        yPosition -= lineHeight * 2;

        // === PREZZO VENDITA ===
        drawText("PREZZO DI VENDITA", margin, 12, true);
        yPosition -= lineHeight;
        const prezzoVendita = pratica.prezzoVendita || 0;
        drawText(`Prezzo al Cliente: € ${prezzoVendita.toFixed(2)}`, margin + 10, 10);
        yPosition -= lineHeight * 2;

        drawLine();
        yPosition -= lineHeight;

        // === MARGINE ===
        const margine = prezzoVendita - totaleCosti;
        const percMargine = prezzoVendita > 0 ? ((margine / prezzoVendita) * 100).toFixed(2) : "0.00";

        drawText("MARGINE", margin, 12, true);
        yPosition -= lineHeight;
        drawText(`€ ${margine.toFixed(2)} (${percMargine}%)`, margin + 10, 11, true);
        yPosition -= lineHeight * 2;

        // === PAGAMENTI ===
        if (pratica.pagamenti && pratica.pagamenti.length > 0) {
            drawLine();
            yPosition -= lineHeight;
            drawText("PAGAMENTI", margin, 12, true);
            yPosition -= lineHeight;

            pratica.pagamenti.forEach((pag) => {
                const dataPag = pag.dataPagamento ? format(pag.dataPagamento, "dd/MM/yyyy") : "Non pagato";
                drawText(`${pag.tipo}: € ${pag.importo.toFixed(2)} - ${dataPag}`, margin + 10, 9);
                yPosition -= lineHeight;
            });
        }

        // === FOOTER ===
        yPosition = 50;
        drawText(`Operatore: ${pratica.operatore}`, margin, 8);
        drawText(`Generato il: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, width - 200, 8);

        // 3. Salva e Restituisci
        const pdfBytes = await pdfDoc.save();

        return new NextResponse(Buffer.from(pdfBytes), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Estratto_Conto_${pratica.numero || pratica.id}.pdf"`,
            },
        });

    } catch (error) {
        console.error("Errore generazione Estratto Conto:", error);
        return NextResponse.json(
            { error: "Errore durante la generazione dell'estratto conto" },
            { status: 500 }
        );
    }
}
