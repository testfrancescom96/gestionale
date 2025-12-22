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
        // Get product with orders
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

        // Get field config for column selection
        const fieldConfig = await prisma.wooExportConfig.findMany();
        const columnsParam = request.nextUrl.searchParams.get('columns');
        const selectedKeys = columnsParam
            ? columnsParam.split(',').filter(k => k.trim() !== '')
            : null;
        const isSelected = (key: string) => selectedKeys === null || selectedKeys.includes(key);

        // Get value from metaData
        const getMetaValue = (metaDataStr: string | null, key: string): string | null => {
            if (!metaDataStr || !key) return null;
            try {
                const meta = JSON.parse(metaDataStr);
                if (Array.isArray(meta)) {
                    const match = meta.find((m: any) =>
                        m.key === key || m.display_key === key
                    );
                    if (match) return match.value || match.display_value;
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
                    const val = meta.find((m: any) =>
                        m.key?.toLowerCase().includes('fermata') || m.key?.toLowerCase().includes('partenza')
                    );
                    if (val) return val.value || val.display_value || '-';
                }
            } catch { }
            return '-';
        };

        // Build rows from orders
        const confirmedStatuses = ['processing', 'completed', 'on-hold'];
        const excludedStatuses = ['cancelled', 'refunded', 'failed', 'trash', 'pending'];
        const rows: any[] = [];

        for (const item of product.orderItems) {
            const order = item.order;
            if (!order || excludedStatuses.includes(order.status)) continue;

            const isConfirmed = confirmedStatuses.includes(order.status);
            const fieldNome = getMetaValue(item.metaData, '_field_Nome');
            const fieldCognome = getMetaValue(item.metaData, '_field_Cognome');
            const fieldTelefono = getMetaValue(item.metaData, '_field_Telefono');

            rows.push({
                cognome: fieldCognome || order.billingLastName || '',
                nome: fieldNome || order.billingFirstName || '',
                telefono: fieldTelefono || order.billingPhone || '',
                email: order.billingEmail || '',
                puntoPartenza: findPartenza(item.metaData),
                importo: item.total || 0,
                pax: item.quantity || 1,
                isConfirmed,
                source: 'order'
            });
        }

        // Add manual bookings
        for (const booking of product.manualBookings) {
            rows.push({
                cognome: booking.cognome,
                nome: booking.nome,
                telefono: booking.telefono || '',
                puntoPartenza: booking.puntoPartenza || '',
                importo: booking.importo || 0,
                pax: booking.numPartecipanti || 1,
                isConfirmed: true,
                source: 'manual'
            });
        }

        // Sort: confirmed first, then by partenza, then cognome
        rows.sort((a, b) => {
            if (a.isConfirmed !== b.isConfirmed) return a.isConfirmed ? -1 : 1;
            const partenzaCompare = (a.puntoPartenza || '').localeCompare(b.puntoPartenza || '');
            if (partenzaCompare !== 0) return partenzaCompare;
            return (a.cognome || '').localeCompare(b.cognome || '');
        });

        // Add row numbers
        rows.forEach((r, i) => { r.num = i + 1; });

        // Create PDF - A4 Portrait
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const eventDateStr = product.eventDate
            ? format(new Date(product.eventDate), "dd MMMM yyyy", { locale: it })
            : "Data N/D";

        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(product.name || 'Lista Passeggeri', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Data: ${eventDateStr}`, pageWidth / 2, 28, { align: 'center' });

        // Build columns based on selection
        const tableColumns: any[] = [];
        const tableBody: any[] = [];

        // Always include N°
        tableColumns.push({ header: 'N°', dataKey: 'num' });

        if (isSelected('cognome') || isSelected('Cognome') || selectedKeys === null)
            tableColumns.push({ header: 'Cognome', dataKey: 'cognome' });
        if (isSelected('nome') || isSelected('Nome') || selectedKeys === null)
            tableColumns.push({ header: 'Nome', dataKey: 'nome' });
        if (isSelected('telefono') || isSelected('Telefono') || selectedKeys === null)
            tableColumns.push({ header: 'Telefono', dataKey: 'telefono' });
        if (isSelected('puntoPartenza') || isSelected('partenza') || selectedKeys === null)
            tableColumns.push({ header: 'Partenza', dataKey: 'puntoPartenza' });
        if (isSelected('importo') || isSelected('Importo') || isSelected('pagato'))
            tableColumns.push({ header: 'Importo €', dataKey: 'importo' });
        if (isSelected('pax') || isSelected('Pax'))
            tableColumns.push({ header: 'Pax', dataKey: 'pax' });

        // Build body
        for (const row of rows) {
            const rowData: any = { num: row.num };
            if (tableColumns.find(c => c.dataKey === 'cognome')) rowData.cognome = row.cognome;
            if (tableColumns.find(c => c.dataKey === 'nome')) rowData.nome = row.nome;
            if (tableColumns.find(c => c.dataKey === 'telefono')) rowData.telefono = row.telefono;
            if (tableColumns.find(c => c.dataKey === 'puntoPartenza')) rowData.puntoPartenza = row.puntoPartenza;
            if (tableColumns.find(c => c.dataKey === 'importo')) rowData.importo = `€ ${(row.importo || 0).toFixed(2)}`;
            if (tableColumns.find(c => c.dataKey === 'pax')) rowData.pax = row.pax;
            tableBody.push(rowData);
        }

        // Generate table
        autoTable(doc, {
            startY: 35,
            head: [tableColumns.map(c => c.header)],
            body: tableBody.map(row => tableColumns.map(c => row[c.dataKey] || '')),
            theme: 'grid',
            styles: {
                fontSize: 9,
                cellPadding: 2,
                overflow: 'linebreak'
            },
            headStyles: {
                fillColor: [37, 99, 235], // Blue
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' }, // N°
            },
            alternateRowStyles: {
                fillColor: [249, 250, 251]
            },
            margin: { left: 10, right: 10 },
            didDrawPage: (data: any) => {
                // Footer with page number
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

        // Summary row
        const totalPax = rows.reduce((sum, r) => sum + (r.pax || 1), 0);
        const finalY = (doc as AutoTableJsPDF).lastAutoTable.finalY + 5;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`TOTALE PASSEGGERI: ${totalPax}`, 10, finalY);

        // Generate PDF buffer
        const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
        const safeProductName = (product.name || 'Lista').replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 30);
        const filename = `Lista_Passeggeri_${safeProductName}_${format(new Date(), 'ddMMyyyy')}.pdf`;

        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        console.error("Error generating PDF:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
