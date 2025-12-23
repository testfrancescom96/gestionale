import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Type for autoTable
type AutoTableJsPDF = jsPDF & {
    lastAutoTable: { finalY: number };
};

interface PassengerRow {
    cognome?: string;
    nome?: string;
    telefono?: string;
    email?: string;
    puntoPartenza?: string;
    importo?: number;
    pax?: number;
    [key: string]: string | number | boolean | undefined;
}

// Generate PDF from provided rows (shared logic)
function generatePDF(
    rows: PassengerRow[],
    productName: string,
    eventDateStr: string,
    selectedColumns: string[]
): Uint8Array {
    // Add row numbers
    rows.forEach((r, i) => { r.num = i + 1; });

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(productName || 'Lista Passeggeri', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${eventDateStr}`, pageWidth / 2, 28, { align: 'center' });

    // Define all possible columns with their display names and aliases
    const allColumns: { id: string; header: string; aliases: string[]; getter: (row: PassengerRow) => string }[] = [
        { id: 'num', header: 'N°', aliases: ['num', 'n°', 'numero'], getter: (r) => String(r.num || '') },
        { id: 'cognome', header: 'Cognome', aliases: ['cognome', '_field_cognome', 'surname', 'last_name'], getter: (r) => String(r.cognome || '') },
        { id: 'nome', header: 'Nome', aliases: ['nome', '_field_nome', 'name', 'first_name'], getter: (r) => String(r.nome || '') },
        { id: 'telefono', header: 'Telefono', aliases: ['telefono', '_field_telefono', 'phone', 'tel', 'recapito telefonico'], getter: (r) => String(r.telefono || '') },
        { id: 'puntoPartenza', header: 'Partenza', aliases: ['puntopartenza', 'partenza', '_service_partenza', 'punto partenza', 'fermata'], getter: (r) => String(r.puntoPartenza || '') },
        { id: 'email', header: 'Email', aliases: ['email', '_field_email'], getter: (r) => String(r.email || '') },
        { id: 'importo', header: 'Importo €', aliases: ['importo', 'pagato', 'totale', 'prezzo'], getter: (r) => `€ ${(Number(r.importo) || 0).toFixed(2)}` },
        { id: 'pax', header: 'Pax', aliases: ['pax', 'quantity', 'quantità'], getter: (r) => String(r.pax || 1) },
    ];

    // Log selected columns for debugging
    console.log('PDF Export - Selected columns:', selectedColumns);

    // Normalize selection function - handles various field name formats
    const isColumnSelected = (colId: string, aliases: string[]): boolean => {
        if (selectedColumns.length === 0) return true; // All if empty

        // Check each selected column against the column's aliases
        const matched = selectedColumns.some(sel => {
            const selLower = sel.toLowerCase();
            const selNormalized = selLower
                .replace('_field_', '')
                .replace('_service_', '')
                .replace(/[_-]/g, ' ')
                .trim();

            // Check direct match first
            if (aliases.some(alias => alias.toLowerCase() === selLower)) return true;
            // Check normalized match
            if (aliases.some(alias => alias.toLowerCase() === selNormalized)) return true;
            // Check if column id is in the selection
            if (selNormalized === colId.toLowerCase()) return true;

            return false;
        });

        return matched;
    };

    // Always include num column, then filter the rest
    const columnsToUse = [
        allColumns[0], // Always N°
        ...allColumns.slice(1).filter(c => isColumnSelected(c.id, c.aliases))
    ];

    console.log('PDF Export - Columns matched:', columnsToUse.map(c => c.id));

    // If still only N°, add defaults
    if (columnsToUse.length === 1) {
        console.log('PDF Export - No columns matched, using defaults');
        const defaults = ['cognome', 'nome', 'telefono', 'puntoPartenza'];
        for (const d of defaults) {
            const col = allColumns.find(c => c.id === d);
            if (col) columnsToUse.push(col);
        }
    }

    // Build table data
    const headers = columnsToUse.map(c => c.header);
    const body = rows.map(row => columnsToUse.map(c => c.getter(row)));

    // Generate table
    autoTable(doc, {
        startY: 35,
        head: [headers],
        body: body,
        theme: 'grid',
        styles: {
            fontSize: 9,
            cellPadding: 2,
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: [37, 99, 235],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251]
        },
        margin: { left: 10, right: 10 },
        didDrawPage: () => {
            const pageCount = doc.getNumberOfPages();
            const currentPage = doc.getCurrentPageInfo().pageNumber;
            doc.setFontSize(8);
            doc.setTextColor(128);
            doc.text(
                `Pagina ${currentPage} di ${pageCount}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }
    });

    // Summary
    const totalPax = rows.reduce((sum, r) => sum + (Number(r.pax) || 1), 0);
    const finalY = (doc as AutoTableJsPDF).lastAutoTable.finalY + 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(`TOTALE PASSEGGERI: ${totalPax}`, 10, finalY);

    return new Uint8Array(doc.output('arraybuffer'));
}

// POST: Receive data from frontend (recommended method)
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
        return NextResponse.json({ error: "ID prodotto non valido" }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { passengers, productName, eventDate, columns } = body;

        // DEBUG: Log what we receive
        console.log('=== PDF EXPORT DEBUG ===');
        console.log('Product:', productName);
        console.log('Columns received:', columns);
        console.log('Passengers count:', passengers?.length);
        if (passengers && passengers.length > 0) {
            console.log('First passenger keys:', Object.keys(passengers[0]));
            console.log('First passenger data:', JSON.stringify(passengers[0], null, 2));
        }
        console.log('========================');

        if (!passengers || !Array.isArray(passengers)) {
            return NextResponse.json({ error: "Dati passeggeri mancanti" }, { status: 400 });
        }

        // Handle eventDate - it might already be formatted or be a Date/ISO string
        let eventDateStr = "Data N/D";
        if (eventDate) {
            try {
                // If it's already a formatted string like "04 gennaio 2025", use it directly
                if (typeof eventDate === 'string' && /^\d{2}\s+\w+\s+\d{4}$/.test(eventDate)) {
                    eventDateStr = eventDate;
                } else {
                    const dateObj = new Date(eventDate);
                    if (!isNaN(dateObj.getTime())) {
                        eventDateStr = format(dateObj, "dd MMMM yyyy", { locale: it });
                    } else {
                        // Use as-is if it's a string but not parseable
                        eventDateStr = String(eventDate);
                    }
                }
            } catch {
                eventDateStr = String(eventDate) || "Data N/D";
            }
        }

        const pdfBuffer = generatePDF(
            passengers,
            productName || 'Lista Passeggeri',
            eventDateStr,
            columns || []
        );

        const safeProductName = (productName || 'Lista').replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 30);
        const filename = `Lista_Passeggeri_${safeProductName}_${format(new Date(), 'ddMMyyyy')}.pdf`;

        return new NextResponse(pdfBuffer as unknown as BodyInit, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: unknown) {
        console.error("Error generating PDF:", error);
        const message = error instanceof Error ? error.message : 'Errore sconosciuto';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// GET: Fallback method (uses simplified extraction - may be incomplete)
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
        return NextResponse.json({ error: "ID prodotto non valido" }, { status: 400 });
    }

    try {
        const product = await prisma.wooProduct.findUnique({
            where: { id: productId },
            include: {
                manualBookings: true,
                orderItems: { include: { order: true } }
            }
        });

        if (!product) {
            return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
        }

        const fieldConfig = await prisma.wooExportConfig.findMany();
        const columnsParam = request.nextUrl.searchParams.get('columns');
        const selectedKeys = columnsParam
            ? columnsParam.split(',').filter(k => k.trim() !== '')
            : [];

        const getMetaValue = (metaDataStr: string | null, key: string): string | null => {
            if (!metaDataStr || !key) return null;
            try {
                const meta = JSON.parse(metaDataStr);
                if (Array.isArray(meta)) {
                    const match = meta.find((m: { key?: string; display_key?: string; value?: string; display_value?: string }) =>
                        m.key === key || m.display_key === key
                    );
                    if (match) return match.value || match.display_value || null;
                }
            } catch { return null; }
            return null;
        };

        const findPartenza = (metaDataStr: string | null): string => {
            const partenzaConfig = fieldConfig.find(c => c.mappingType === 'PARTENZA');
            if (partenzaConfig) {
                const val = getMetaValue(metaDataStr, partenzaConfig.fieldKey);
                if (val) return val;
            }
            if (!metaDataStr) return '-';
            try {
                const meta = JSON.parse(metaDataStr);
                if (Array.isArray(meta)) {
                    const val = meta.find((m: { key?: string; value?: string; display_value?: string }) =>
                        m.key?.toLowerCase().includes('fermata') || m.key?.toLowerCase().includes('partenza')
                    );
                    if (val) return val.value || val.display_value || '-';
                }
            } catch { }
            return '-';
        };


        const excludedStatuses = ['cancelled', 'refunded', 'failed', 'trash', 'pending'];
        const rows: PassengerRow[] = [];

        for (const item of product.orderItems) {
            const order = item.order;
            if (!order || excludedStatuses.includes(order.status)) continue;

            rows.push({
                cognome: getMetaValue(item.metaData, '_field_Cognome') || order.billingLastName || '',
                nome: getMetaValue(item.metaData, '_field_Nome') || order.billingFirstName || '',
                telefono: getMetaValue(item.metaData, '_field_Telefono') || order.billingPhone || '',
                email: order.billingEmail || '',
                puntoPartenza: findPartenza(item.metaData),
                importo: item.total || 0,
                pax: item.quantity || 1
            });
        }

        for (const booking of product.manualBookings) {
            rows.push({
                cognome: booking.cognome,
                nome: booking.nome,
                telefono: booking.telefono || '',
                puntoPartenza: booking.puntoPartenza || '',
                importo: booking.importo || 0,
                pax: booking.numPartecipanti || 1
            });
        }

        rows.sort((a, b) => {
            const partenzaCompare = (a.puntoPartenza || '').localeCompare(b.puntoPartenza || '');
            if (partenzaCompare !== 0) return partenzaCompare;
            return (a.cognome || '').localeCompare(b.cognome || '');
        });

        const eventDateStr = product.eventDate
            ? format(new Date(product.eventDate), "dd MMMM yyyy", { locale: it })
            : "Data N/D";

        const pdfBuffer = generatePDF(rows, product.name, eventDateStr, selectedKeys);

        const safeProductName = (product.name || 'Lista').replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 30);
        const filename = `Lista_Passeggeri_${safeProductName}_${format(new Date(), 'ddMMyyyy')}.pdf`;

        return new NextResponse(pdfBuffer as unknown as BodyInit, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: unknown) {
        console.error("Error generating PDF:", error);
        const message = error instanceof Error ? error.message : 'Errore sconosciuto';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
