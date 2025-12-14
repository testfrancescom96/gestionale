import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";
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
            },
        });

        if (!pratica || !pratica.cliente) {
            return NextResponse.json({ error: "Pratica o Cliente non trovati" }, { status: 404 });
        }

        // 2. Carica Template PDF
        const templatePath = path.join(process.cwd(), "public/templates/contratto.pdf");
        const templateBytes = fs.readFileSync(templatePath);
        const pdfDoc = await PDFDocument.load(templateBytes);
        const form = pdfDoc.getForm();

        // 3. Mappatura Campi
        const searchParams = request.nextUrl.searchParams;
        const debugMode = searchParams.get("debug") === "true";

        if (debugMode) {
            // DEBUG MODE: Scrive il nome del campo dentro il campo stesso
            form.getFields().forEach(field => {
                try {
                    if (field.constructor.name === 'PDFTextField') {
                        (field as any).setText(field.getName());
                    }
                } catch (e) { }
            });
        } else {
            // NORMAL MODE
            const safeSet = (fieldName: string, value: string | undefined | null) => {
                if (!value) return;
                try {
                    const field = form.getTextField(fieldName);
                    if (field) field.setText(value);
                } catch (e) {
                    console.warn(`Campo ${fieldName} non trovato nel PDF`);
                }
            };

            // --- CLIENTE ---
            // Gestione Snapshot (Dati Storici)
            let clienteData = pratica.cliente;
            // @ts-ignore: Field exists in DB
            if (pratica.datiArchiviati) {
                try {
                    // @ts-ignore
                    const snapshot = JSON.parse(pratica.datiArchiviati);
                    if (snapshot.cliente) {
                        // Use snapshot data but fallback to primitives if needed (snapshot should be full object)
                        clienteData = { ...clienteData, ...snapshot.cliente };
                    }
                } catch (e) {
                    console.error("Errore parsing dati archiviati", e);
                }
            }

            // Nota: doppio spazio nel nome campo come da log ispezione
            safeSet('COGNOME  NOME', `${clienteData.cognome} ${clienteData.nome}`);
            safeSet('CODICE FISCALE', clienteData.codiceFiscale);

            let natoA = "";
            if (clienteData.luogoNascita) natoA += clienteData.luogoNascita;
            if (clienteData.dataNascita) {
                // Handle different date formats or string dates from JSON
                const d = typeof clienteData.dataNascita === 'string' ? new Date(clienteData.dataNascita) : clienteData.dataNascita;
                if (d) {
                    const dataN = format(d, "dd/MM/yyyy");
                    natoA += natoA ? ` il ${dataN}` : dataN;
                }
            }
            safeSet('LUOGO E DATA DI NASCITA', natoA);

            safeSet('TELEFONO', clienteData.telefono);
            safeSet('INDIRIZZO', clienteData.indirizzo);
            safeSet('CITTA', clienteData.citta);
            safeSet('CAP', clienteData.cap);
            safeSet('INDIRIZZO EMAIL  PEC', clienteData.email);

            // --- PRATICA / VIAGGIO ---
            safeSet('Destinazione Itinerario', pratica.destinazione);

            if (pratica.dataPartenza) safeSet('Dal', format(pratica.dataPartenza, "dd/MM/yyyy"));
            if (pratica.dataRitorno) safeSet('Al', format(pratica.dataRitorno, "dd/MM/yyyy"));

            // Calcolo Durata/Notti
            if (pratica.dataPartenza && pratica.dataRitorno) {
                const diffTime = Math.abs(pratica.dataRitorno.getTime() - pratica.dataPartenza.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                safeSet('Durata Giorni', diffDays.toString());
                safeSet('Notti', (diffDays > 0 ? diffDays - 1 : 0).toString());
            }

            safeSet('Partenza Da', pratica.cittaPartenza);
            safeSet('OPERATORE ADV_2', pratica.operatore);
            safeSet('Codice Prenotazione Elettronica', pratica.numero ? pratica.numero.toString() : pratica.id.substring(0, 8));

            // --- PARTECIPANTI (Concatenati in un campo note o denominazione per ora) ---
            // Cerchiamo di metterli in un campo visibile se esiste, o accodiamo a denominazione
            if (pratica.partecipanti && pratica.partecipanti.length > 0) {
                const listaPartecipanti = pratica.partecipanti
                    .map(p => `${p.cognome} ${p.nome}`)
                    .join(", ");
                // Provo a metterlo in "Pacchetto" o "Denominazione" se liberi, 
                // in attesa di mapping preciso dall'utente.
                safeSet('Pacchetto', `Partecipanti: ${listaPartecipanti}`);
            }

            // PREZZI (Solo se mappati)
            if (pratica.prezzoVendita) {
                // TODO: Sostituire con ID campo corretto dopo feedback debug
                // safeSet('465416', pratica.prezzoVendita.toString()); 
            }
        }

        // 4. Salva e Restituisci
        const pdfBytes = await pdfDoc.save();

        return new NextResponse(Buffer.from(pdfBytes), {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Contratto_${pratica.numero || pratica.id}.pdf"`,
            },
        });

    } catch (error) {
        console.error("Errore generazione PDF:", error);
        return NextResponse.json(
            { error: "Errore durante la generazione del contratto" },
            { status: 500 }
        );
    }
}
