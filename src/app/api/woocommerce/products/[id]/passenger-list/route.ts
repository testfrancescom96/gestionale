
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
        // If columns param exists (even if empty string), use it; otherwise allow all
        const selectedKeys = columnsParam !== null
            ? columnsParam.split(',').filter(k => k.trim() !== '')
            : null;
        const isSelected = (key: string) => selectedKeys === null || selectedKeys.includes(key);

        // Build alias map: aliasKey -> primaryKey
        // If a field has aliasOf set, it means: use primaryKey's value if this field is empty
        const aliasMap = new Map<string, string>();
        fieldConfig.forEach(f => {
            if ((f as any).aliasOf) {
                aliasMap.set(f.fieldKey, (f as any).aliasOf);
            }
        });

        const partenzaConfig = fieldConfig.find(c => c.mappingType === 'PARTENZA');
        const cfConfig = fieldConfig.find(c => c.mappingType === 'CF' && isSelected(c.fieldKey));
        const addressConfig = fieldConfig.find(c => c.mappingType === 'ADDRESS' && isSelected(c.fieldKey));
        const capConfig = fieldConfig.find(c => c.mappingType === 'CAP' && isSelected(c.fieldKey));
        const noteConfig = fieldConfig.find(c => c.mappingType === 'NOTE' && isSelected(c.fieldKey));

        let dynamicColumns = fieldConfig.filter(c => c.mappingType === 'COLUMN');
        if (selectedKeys) {
            dynamicColumns = dynamicColumns.filter(c => selectedKeys.includes(c.fieldKey));
        }

        // Get value from metaData, with alias support
        const getMetaValue = (metaDataStr: string | null, key: string | undefined): string | null => {
            if (!metaDataStr || !key) return null;
            try {
                const meta = JSON.parse(metaDataStr);
                if (Array.isArray(meta)) {
                    // First try the direct key
                    let match = meta.find((m: any) => (m.key === key) || (m.display_key === key));
                    if (match) return match.value || match.display_value;

                    // If not found and this key has an alias (is secondary), try the primary key
                    const primaryKey = aliasMap.get(key);
                    if (primaryKey) {
                        match = meta.find((m: any) => (m.key === primaryKey) || (m.display_key === primaryKey));
                        if (match) return match.value || match.display_value;
                    }

                    // Also check if any field aliases TO this key (this key is primary)
                    // Look for secondary keys that alias to this one
                    for (const [secondaryKey, targetKey] of aliasMap.entries()) {
                        if (targetKey === key) {
                            match = meta.find((m: any) => (m.key === secondaryKey) || (m.display_key === secondaryKey));
                            if (match) return match.value || match.display_value;
                        }
                    }
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

        // Consolidate Order Items and Manual Bookings for Sorting
        let rawRows: any[] = [];

        // Confirmed statuses (count in total, show first)
        const confirmedStatuses = ['processing', 'completed', 'on-hold'];

        // Orders - skip cancelled and refunded
        const excludedStatuses = ['cancelled', 'refunded', 'failed', 'trash'];

        for (const item of product.orderItems) {
            const order = item.order;
            if (order) {
                // Skip cancelled/refunded orders
                if (excludedStatuses.includes(order.status)) {
                    continue;
                }

                const isConfirmed = confirmedStatuses.includes(order.status);

                // Use metaData fields (_field_*) if available, otherwise billing info
                const fieldNome = getMetaValue(item.metaData, '_field_Nome');
                const fieldCognome = getMetaValue(item.metaData, '_field_Cognome');
                const fieldTelefono = getMetaValue(item.metaData, '_field_Telefono');

                const row: any = {
                    // num assigned later
                    cognome: fieldCognome || order.billingLastName || '',
                    nome: fieldNome || order.billingFirstName || '',
                    telefono: fieldTelefono || order.billingPhone || '',
                    email: order.billingEmail || '',
                    puntoPartenza: findPartenza(item.metaData),
                    importo: item.total || 0, // Payment amount from order
                    source: 'order',
                    orderId: order.id,
                    orderStatus: order.status,
                    isConfirmed: isConfirmed,
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
                if (!isConfirmed) {
                    noteContent = `⚠️ ${order.status.toUpperCase()} | ${noteContent}`;
                }
                if (noteConfig) {
                    const extraNote = getMetaValue(item.metaData, noteConfig.fieldKey);
                    if (extraNote) noteContent = `${extraNote} | ${noteContent}`;
                }
                row.note = noteContent;
                rawRows.push(row);
            }
        }

        // Manual Bookings
        for (const booking of product.manualBookings) {
            const row: any = {
                // num assigned later
                cognome: booking.cognome,
                nome: booking.nome,
                telefono: booking.telefono || '',
                puntoPartenza: booking.puntoPartenza || '',
                importo: booking.importo || 0,
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
            rawRows.push(row);
        }

        // ---------------------------------------------------------
        // LOGICA ORDINAMENTO
        // 0. Confirmed first, non-confirmed at end
        // 1. Punto di Ritrovo (Alphabetical)
        // 2. Order ID (Group Unity)
        // 3. Cognome (Alphabetical)
        // ---------------------------------------------------------
        rawRows.sort((a, b) => {
            // 0. Confirmed status (confirmed first)
            if (a.isConfirmed !== b.isConfirmed) {
                return a.isConfirmed ? -1 : 1;
            }

            // 1. Punto Partenza
            const pA = (a.puntoPartenza || '').toLowerCase();
            const pB = (b.puntoPartenza || '').toLowerCase();
            if (pA < pB) return -1;
            if (pA > pB) return 1;

            // 2. Order ID (if both exist)
            const oA = a.orderId || 0;
            const oB = b.orderId || 0;
            if (oA !== oB) {
                return oA - oB;
            }

            // 3. Cognome
            const nA = (a.cognome || '').toLowerCase();
            const nB = (b.cognome || '').toLowerCase();
            if (nA < nB) return -1;
            if (nA > nB) return 1;

            return 0;
        });

        // Assign Row Numbers after sorting
        const dataRows = rawRows.map((r, idx) => ({ ...r, num: idx + 1 }));

        // JSON Response
        if (isJson) {
            // Build columns respecting the selected keys
            const columns: { header: string; key: string; isDynamic?: boolean }[] = [];

            // Helper to check if column is selected
            const colSelected = (key: string) => selectedKeys === null || selectedKeys.includes(key);

            // Always include row number
            columns.push({ header: 'N°', key: 'num' });

            // Base columns - only if selected
            if (colSelected('cognome') || colSelected('_billing_name'))
                columns.push({ header: 'Cognome', key: 'cognome' });
            if (colSelected('nome') || colSelected('_billing_name'))
                columns.push({ header: 'Nome', key: 'nome' });
            if (colSelected('telefono') || colSelected('_billing_phone'))
                columns.push({ header: 'Telefono', key: 'telefono' });
            if (colSelected('email') || colSelected('Email') || colSelected('_billing_email'))
                columns.push({ header: 'Email', key: 'email' });
            if (colSelected('puntoPartenza') || colSelected('_service_Partenza') || colSelected('partenza'))
                columns.push({ header: 'Punto Partenza', key: 'puntoPartenza' });

            if (cfConfig && colSelected(cfConfig.fieldKey))
                columns.push({ header: 'C.F.', key: 'cf' });
            if (addressConfig && colSelected(addressConfig.fieldKey))
                columns.push({ header: 'Indirizzo', key: 'address' });
            if (capConfig && colSelected(capConfig.fieldKey))
                columns.push({ header: 'CAP', key: 'cap' });

            // Add Consolidated Columns - only if any of their keys is selected
            for (const [label, keys] of consolidatedCols.entries()) {
                if (keys.some(k => colSelected(k))) {
                    columns.push({ header: label, key: label, isDynamic: true });
                }
            }

            if (colSelected('pax') || colSelected('_quantity'))
                columns.push({ header: 'Pax', key: 'pax' });
            if (colSelected('importo') || colSelected('Importo') || colSelected('totale') || colSelected('pagato'))
                columns.push({ header: 'Pagato €', key: 'importo' });
            if (colSelected('note'))
                columns.push({ header: 'Note', key: 'note' });

            // Calculate counts
            const confirmedCount = dataRows.filter(r => r.isConfirmed !== false).reduce((sum, r) => sum + (r.pax || 1), 0);
            const totalCount = dataRows.reduce((sum, r) => sum + (r.pax || 1), 0);

            return NextResponse.json({
                productName: product.name,
                eventDate: product.eventDate ? format(new Date(product.eventDate), "dd MMMM yyyy", { locale: it }) : "Data N/D",
                confirmedCount,
                totalCount,
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
