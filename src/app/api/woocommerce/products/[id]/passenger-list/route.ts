
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

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

        // Check format
        const formatType = request.nextUrl.searchParams.get('format');
        const isJson = formatType === 'json';

        // 1. Get Config
        const fieldConfig = await prisma.wooExportConfig.findMany();
        const columnsParam = request.nextUrl.searchParams.get('columns');
        const selectedKeys = columnsParam ? columnsParam.split(',') : null;
        const isSelected = (key: string) => !selectedKeys || selectedKeys.includes(key);

        const partenzaConfig = fieldConfig.find(c => c.mappingType === 'PARTENZA');
        const cfConfig = fieldConfig.find(c => c.mappingType === 'CF' && isSelected(c.fieldKey));
        const addressConfig = fieldConfig.find(c => c.mappingType === 'ADDRESS' && isSelected(c.fieldKey));
        const capConfig = fieldConfig.find(c => c.mappingType === 'CAP' && isSelected(c.fieldKey));
        const noteConfig = fieldConfig.find(c => c.mappingType === 'NOTE' && isSelected(c.fieldKey));

        let dynamicColumns = fieldConfig.filter(c => c.mappingType === 'COLUMN');
        if (selectedKeys) {
            dynamicColumns = dynamicColumns.filter(c => selectedKeys.includes(c.fieldKey));
        }

        const getMetaValue = (metaDataStr: string | null, key: string | undefined): string | null => {
            if (!metaDataStr || !key) return null;
            try {
                const meta = JSON.parse(metaDataStr);
                if (Array.isArray(meta)) {
                    const match = meta.find((m: any) => (m.key === key) || (m.display_key === key));
                    if (match) return match.value || match.display_value;
                }
            } catch (e) { return null; }
            return null;
        };

        const findPartenza = (metaDataStr: string | null): string => {
            if (partenzaConfig) {
                const val = getMetaValue(metaDataStr, partenzaConfig.fieldKey);
                if (val) return val;
            }
            if (!metaDataStr) return '-';
            try {
                const meta = JSON.parse(metaDataStr);
                if (Array.isArray(meta)) {
                    const found = meta.find((m: any) => {
                        const key = (m.key || m.display_key || '').toLowerCase();
                        return key.includes('partenza') || key.includes('fermata') || key.includes('luogo') || key.includes('ritiro');
                    });
                    return found ? (found.value || found.display_value) : '-';
                }
            } catch (e) { }
            return '-';
        };

        // Consolidate Dynamic Columns by Label (Normalization)
        const consolidatedCols = new Map<string, string[]>(); // Label -> Keys[]

        dynamicColumns.forEach(col => {
            const keys = consolidatedCols.get(col.label) || [];
            keys.push(col.fieldKey);
            consolidatedCols.set(col.label, keys);
        });

        const getConsolidatedValue = (metaDataStr: string | null, keys: string[]): string => {
            for (const key of keys) {
                const val = getMetaValue(metaDataStr, key);
                if (val) return val;
            }
            return '';
        };

        // Prepare Data
        const dataRows: any[] = [];
        let rowNum = 1;

        // Orders
        for (const item of product.orderItems) {
            const order = item.order;
            if (order) {
                const row: any = {
                    num: rowNum++,
                    cognome: order.billingLastName || '',
                    nome: order.billingFirstName || '',
                    telefono: order.billingPhone || '',
                    puntoPartenza: findPartenza(item.metaData),
                    source: 'order',
                    orderId: order.id,
                    pax: item.quantity,
                    note: '',
                    dynamic: {}
                };
                if (cfConfig) row.cf = getMetaValue(item.metaData, cfConfig.fieldKey) || '';
                if (addressConfig) row.address = getMetaValue(item.metaData, addressConfig.fieldKey) || '';
                if (capConfig) row.cap = getMetaValue(item.metaData, capConfig.fieldKey) || '';

                // Populate dynamic fields by Label (Consolidated)
                for (const [label, keys] of consolidatedCols.entries()) {
                    row.dynamic[label] = getConsolidatedValue(item.metaData, keys);
                }

                let noteContent = `Ordine #${order.id}`;
                if (noteConfig) {
                    const extraNote = getMetaValue(item.metaData, noteConfig.fieldKey);
                    if (extraNote) noteContent = `${extraNote} | ${noteContent}`;
                }
                row.note = noteContent;
                dataRows.push(row);
            }
        }

        // Manual Bookings
        for (const booking of product.manualBookings) {
            const row: any = {
                num: rowNum++,
                cognome: booking.cognome,
                nome: booking.nome,
                telefono: booking.telefono || '',
                puntoPartenza: booking.puntoPartenza || '',
                source: 'manual',
                pax: booking.numPartecipanti,
                note: booking.note || 'Manuale',
                dynamic: {}
            };
            if (cfConfig) row.cf = '';
            if (addressConfig) row.address = '';
            if (capConfig) row.cap = '';
            for (const [label] of consolidatedCols.entries()) {
                row.dynamic[label] = '';
            }
            dataRows.push(row);
        }

        // JSON Response
        if (isJson) {
            const columns: { header: string; key: string; isDynamic?: boolean }[] = [
                { header: 'N°', key: 'num' },
                { header: 'Cognome', key: 'cognome' },
                { header: 'Nome', key: 'nome' },
                { header: 'Telefono', key: 'telefono' },
                { header: 'Punto Partenza', key: 'puntoPartenza' },
            ];
            if (cfConfig) columns.push({ header: 'C.F.', key: 'cf' });
            if (addressConfig) columns.push({ header: 'Indirizzo', key: 'address' });
            if (capConfig) columns.push({ header: 'CAP', key: 'cap' });

            // Add Consolidated Columns
            for (const [label] of consolidatedCols.entries()) {
                columns.push({ header: label, key: label, isDynamic: true });
            }

            columns.push({ header: 'Pax', key: 'pax' });
            columns.push({ header: 'Note', key: 'note' });

            return NextResponse.json({
                productName: product.name,
                eventDate: product.eventDate ? format(new Date(product.eventDate), "dd MMMM yyyy", { locale: it }) : "Data N/D",
                columns,
                rows: dataRows
            });
        }

        // Excel Response
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Lista Passeggeri');
        const eventDateStr = product.eventDate ? format(new Date(product.eventDate), "dd MMMM yyyy", { locale: it }) : "Data N/D";

        worksheet.mergeCells('A1:G1');
        worksheet.getCell('A1').value = `Lista Passeggeri - ${product.name}`;
        worksheet.getCell('A1').font = { bold: true, size: 16 };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        worksheet.mergeCells('A2:G2');
        worksheet.getCell('A2').value = `Data: ${eventDateStr}`;
        worksheet.getCell('A2').font = { italic: true, size: 12 };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };
        worksheet.addRow([]);

        const headerCols = [
            { header: 'N°', key: 'num', width: 6 },
            { header: 'Cognome', key: 'cognome', width: 18 },
            { header: 'Nome', key: 'nome', width: 18 },
            { header: 'Telefono', key: 'telefono', width: 15 },
            { header: 'Punto Partenza', key: 'puntoPartenza', width: 25 },
        ];
        if (cfConfig) headerCols.push({ header: 'C.F.', key: 'cf', width: 18 });
        if (addressConfig) headerCols.push({ header: 'Indirizzo', key: 'address', width: 25 });
        if (capConfig) headerCols.push({ header: 'CAP', key: 'cap', width: 10 });

        for (const [label] of consolidatedCols.entries()) {
            headerCols.push({ header: label, key: label, width: 20 });
        }

        headerCols.push({ header: 'Pax', key: 'pax', width: 6 });
        headerCols.push({ header: 'Note', key: 'note', width: 25 });

        worksheet.columns = headerCols.map(c => ({ width: c.width }));
        const headerRow = worksheet.addRow(headerCols.map(c => c.header));
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

        dataRows.forEach((d, idx) => {
            const rowValues = [d.num, d.cognome, d.nome, d.telefono, d.puntoPartenza];
            if (cfConfig) rowValues.push(d.cf);
            if (addressConfig) rowValues.push(d.address);
            if (capConfig) rowValues.push(d.cap);
            for (const [label] of consolidatedCols.entries()) {
                rowValues.push(d.dynamic[label] || '');
            }
            rowValues.push(d.pax);
            rowValues.push(d.note);

            const row = worksheet.addRow(rowValues);
            if (d.source === 'manual') row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
            else if (d.num % 2 === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; // Use d.num for alternating

            row.eachCell(cell => {
                cell.border = { top: { style: 'thin', color: { argb: 'FFE5E7EB' } }, left: { style: 'thin', color: { argb: 'FFE5E7EB' } }, bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } }, right: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
                cell.font = { size: 11, name: 'Calibri' };
            });
        });

        worksheet.addRow([]);
        const totalPax = dataRows.reduce((acc, r) => acc + (r.pax || 0), 0);
        const summaryRow = worksheet.addRow(['', '', '', '', 'TOTALE PASSEGGERI:', totalPax, '']);
        summaryRow.font = { bold: true, size: 12 };
        summaryRow.getCell(6).alignment = { horizontal: 'center' };
        summaryRow.getCell(6).font = { bold: true, size: 12, color: { argb: 'FF1D4ED8' } };

        const buffer = await workbook.xlsx.writeBuffer();
        const safeProductName = product.name.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 30);
        const filename = `Lista_Passeggeri_${safeProductName}_${format(new Date(), 'ddMMyyyy')}.xlsx`;

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        console.error("Error generating passenger list:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
