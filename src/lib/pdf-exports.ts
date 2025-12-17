import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export async function generatePassengerListPdf(pratica: any, partecipanti: any[]) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;
    const margin = 50;

    // Header
    page.drawText("LISTA PASSEGGERI / PARTECIPANTI", { x: margin, y, size: 18, font: fontBold });
    y -= 30;

    // Pratica Info
    page.drawText(`Pratica N°: ${pratica.numero || "-"}`, { x: margin, y, size: 12, font });
    page.drawText(`Destinazione: ${pratica.destinazione}`, { x: margin + 200, y, size: 12, font });
    y -= 20;
    const dateStr = pratica.dataPartenza ? format(new Date(pratica.dataPartenza), "dd/MM/yyyy", { locale: it }) : "-";
    page.drawText(`Data Partenza: ${dateStr}`, { x: margin, y, size: 12, font });

    // Group Leader / Bus Info (if in notes or custom fields?? for now placeholders)
    // User requested "Titolo", "Vettore", "Autista", "Contatto", "Note". 
    // We'll use Pratica's generic Note or we might need specific fields later.
    // Assuming "Vettore" is Fornitore.
    y -= 30;
    page.drawLine({
        start: { x: margin, y: y + 10 },
        end: { x: width - margin, y: y + 10 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
    });

    const fornitoreName = pratica.fornitore?.ragioneSociale || pratica.nomeFornitore || "-";
    page.drawText(`Referente/Autista: ${fornitoreName}`, { x: margin, y, size: 10, font });
    page.drawText(`Contatto: ${pratica.fornitore?.telefono || "-"}`, { x: margin + 250, y, size: 10, font });
    y -= 20;

    if (pratica.note) {
        page.drawText(`Note Viaggio: ${pratica.note.replace(/\n/g, " ")}`, { x: margin, y, size: 10, font, color: rgb(0.4, 0.4, 0.4) });
        y -= 30;
    }

    // Table Header
    y -= 10;
    const colX = [margin, margin + 120, margin + 220, margin + 320, margin + 420];
    const headers = ["COGNOME NOME", "DATA NASCITA", "DOCUMENTO", "TEL/NOTE", "SISTEM."];

    // Draw Header Background
    page.drawRectangle({
        x: margin - 5,
        y: y - 5,
        width: width - (margin * 2) + 10,
        height: 20,
        color: rgb(0.95, 0.95, 0.95),
    });

    headers.forEach((h, i) => {
        page.drawText(h, { x: colX[i], y, size: 9, font: fontBold });
    });
    y -= 20;

    // Rows
    for (const p of partecipanti) {
        if (y < 50) {
            // New Page
            // ... (Simple implementation, assumes single page for now or 40 pax max)
            // TODO: Add pagination logic if needed
        }

        const name = `${p.cognome} ${p.nome}`.toUpperCase();
        const dob = p.dataNascita ? format(new Date(p.dataNascita), "dd/MM/yyyy") : "-";
        const doc = p.numeroDocumento ? `${p.tipoDocumento || "Doc"} ${p.numeroDocumento}` : "-";
        const notes = p.note || "-"; // Phone usually in Client, here maybe Note?
        const room = p.sistemazione || "-";

        page.drawText(name, { x: colX[0], y, size: 9, font });
        page.drawText(dob, { x: colX[1], y, size: 9, font });
        page.drawText(doc, { x: colX[2], y, size: 9, font });

        // Truncate notes
        const safeNotes = notes.length > 15 ? notes.substring(0, 15) + "..." : notes;
        page.drawText(safeNotes, { x: colX[3], y, size: 9, font });

        page.drawText(room, { x: colX[4], y, size: 9, font });

        // Line
        y -= 5;
        page.drawLine({
            start: { x: margin, y },
            end: { x: width - margin, y },
            thickness: 0.5,
            color: rgb(0.9, 0.9, 0.9),
        });
        y -= 15;
    }

    // Footer
    page.drawText(`Generato il ${format(new Date(), "dd/MM/yyyy HH:mm")}`, {
        x: margin,
        y: 30,
        size: 8,
        font,
        color: rgb(0.6, 0.6, 0.6),
    });

    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
}
