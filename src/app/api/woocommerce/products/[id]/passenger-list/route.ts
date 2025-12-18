import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
        return NextResponse.json({ error: "ID prodotto non valido" }, { status: 400 });
    }

    try {
        // Fetch product
        const product = await prisma.wooProduct.findUnique({
            where: { id: productId },
            include: {
                manualBookings: true,
                orderItems: {
                    include: {
                        order: true
                    }
                }
            }
        });

        if (!product) {
            return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
        }

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Gestionale Go On The Road';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Lista Passeggeri');

        // Title row
        const eventDate = product.eventDate ? format(new Date(product.eventDate), "dd MMMM yyyy", { locale: it }) : "Data N/D";
        worksheet.mergeCells('A1:G1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `Lista Passeggeri - ${product.name}`;
        titleCell.font = { bold: true, size: 16 };
        titleCell.alignment = { horizontal: 'center' };

        worksheet.mergeCells('A2:G2');
        worksheet.getCell('A2').value = `Data: ${eventDate}`;
        worksheet.getCell('A2').font = { italic: true, size: 12 };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };

        // Empty row
        worksheet.addRow([]);



        // 1. Get Config
        const fieldConfig = await prisma.wooExportConfig.findMany();

        // Define Mapped Fields
        const columnsParam = request.nextUrl.searchParams.get('columns');
        const selectedKeys = columnsParam ? columnsParam.split(',') : null;

        // Helper to check if a field is selected (enabled by default if no param)
        const isSelected = (key: string) => !selectedKeys || selectedKeys.includes(key);

        const partenzaConfig = fieldConfig.find(c => c.mappingType === 'PARTENZA');

        // Only enable if configured AND selected
        const cfConfig = fieldConfig.find(c => c.mappingType === 'CF' && isSelected(c.fieldKey));
        const addressConfig = fieldConfig.find(c => c.mappingType === 'ADDRESS' && isSelected(c.fieldKey));
        const capConfig = fieldConfig.find(c => c.mappingType === 'CAP' && isSelected(c.fieldKey));

        // Note: System "Note" always exists, but we might want to hide the "Mapped" note field?
        // Let's treat Note Config similar to others
        const noteConfig = fieldConfig.find(c => c.mappingType === 'NOTE' && isSelected(c.fieldKey));

        // Dynamic Columns (those marked as COLUMN)
        // Filter based on query param 'columns' if present

        // If 'columns' param is present, we filter ALL fields (including standard ones like CF, Address, etc. if they match key)
        // But for now, let's keep robust logic.
        // DownloadOptionsModal sends KEYS.

        let dynamicColumns = fieldConfig.filter(c => c.mappingType === 'COLUMN');

        // Filter dynamic columns if selection acts on them
        if (selectedColumnKeys) {
            dynamicColumns = dynamicColumns.filter(c => selectedColumnKeys.includes(c.fieldKey));
        }

        // Helper to find specific field value
        const getMetaValue = (metaDataStr: string | null, key: string | undefined): string | null => {
            if (!metaDataStr || !key) return null;
            try {
                const meta = JSON.parse(metaDataStr);
                if (Array.isArray(meta)) {
                    const match = meta.find((m: any) =>
                        (m.key === key) || (m.display_key === key)
                    );
                    if (match) return match.value || match.display_value;
                }
            } catch (e) { return null; }
            return null;
        };

        const findPartenza = (metaDataStr: string | null): string => {
            // Priority: Configured > Smart Search
            if (partenzaConfig) {
                const val = getMetaValue(metaDataStr, partenzaConfig.fieldKey);
                if (val) return val;
            }
            // Fallback
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

        // Initialize row counter
        let rowNum = 1;

        // Prepare Columns
        const columns = [
            { header: 'N°', key: 'num', width: 6 },
            { header: 'Cognome', key: 'cognome', width: 18 },
            { header: 'Nome', key: 'nome', width: 18 },
            { header: 'Telefono', key: 'telefono', width: 15 },
            { header: 'Punto Partenza', key: 'puntoPartenza', width: 25 }, // Wider for bus stops
        ];

        // Add Optional Standard Columns if configured
        if (cfConfig) columns.push({ header: 'C.F.', key: 'cf', width: 18 });
        if (addressConfig) columns.push({ header: 'Indirizzo', key: 'address', width: 25 });
        if (capConfig) columns.push({ header: 'CAP', key: 'cap', width: 10 });

        // Add Dynamic Extra Columns
        dynamicColumns.forEach(col => {
            columns.push({ header: col.label, key: `dyn_${col.fieldKey}`, width: 20 });
        });

        // Always add Note and Pax at the end standardly? Or Pax before notes?
        columns.push({ header: 'Pax', key: 'pax', width: 6 });

        // Notes column (System + Mapped)
        columns.push({ header: 'Note', key: 'note', width: 25 });

        // Apply Columns to Worksheet (Header Row creation)
        const headerRow = worksheet.addRow(columns.map(c => c.header));
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

        // Set widths
        worksheet.columns = columns.map(c => ({ width: c.width }));


        // Add WooCommerce orders
        for (const item of product.orderItems) {
            const order = item.order;
            if (order) {
                const rowData: any[] = [
                    rowNum++,
                    order.billingLastName || '',
                    order.billingFirstName || '',
                    order.billingPhone || '',
                    findPartenza(item.metaData)
                ];

                // Append Optional Standard Fields
                if (cfConfig) rowData.push(getMetaValue(item.metaData, cfConfig.fieldKey) || '');
                if (addressConfig) rowData.push(getMetaValue(item.metaData, addressConfig.fieldKey) || '');
                if (capConfig) rowData.push(getMetaValue(item.metaData, capConfig.fieldKey) || '');

                // Append Dynamic Columns
                dynamicColumns.forEach(col => {
                    rowData.push(getMetaValue(item.metaData, col.fieldKey) || '');
                });

                // Pax
                rowData.push(item.quantity);

                // Notes (Combine Configured Note Field + Order ID)
                let noteContent = `Ordine #${order.id}`;
                if (noteConfig) {
                    const extraNote = getMetaValue(item.metaData, noteConfig.fieldKey);
                    if (extraNote) noteContent = `${extraNote} | ${noteContent}`;
                }
                rowData.push(noteContent);

                // Add Row
                const row = worksheet.addRow(rowData);

                // Alternate row colors (Light Gray)
                if (rowNum % 2 === 0) {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF9FAFB' } // Very light gray
                    };
                }

                // Borders
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                    };
                    cell.font = { size: 11, name: 'Calibri' };
                });
            }
        }

        // Add Manual Bookings
        // Add Manual Bookings
        for (const booking of product.manualBookings) {
            // Build base row
            const rowData: any[] = [
                rowNum++,
                booking.cognome,
                booking.nome,
                booking.telefono || '',
                booking.puntoPartenza || ''
            ];

            // Fill empty slots for Standard Optional Fields
            if (cfConfig) rowData.push(''); // No CF in manual yet
            if (addressConfig) rowData.push(''); // No Address
            if (capConfig) rowData.push(''); // No CAP

            // Fill empty slots for Dynamic Columns
            dynamicColumns.forEach(() => rowData.push(''));

            // Pax
            rowData.push(booking.numPartecipanti);

            // Notes
            rowData.push(booking.note || 'Manuale');

            const row = worksheet.addRow(rowData);

            // Mark manual bookings with light purple background
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF3E8FF' } // Light Purple
            };

            // Borders
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
                    right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
                };
                cell.font = { size: 11, name: 'Calibri' };
            });
        }

        // Summary row
        worksheet.addRow([]);
        const totalPax = product.orderItems.reduce((acc, i) => acc + i.quantity, 0) +
            product.manualBookings.reduce((acc, b) => acc + b.numPartecipanti, 0);

        const summaryRow = worksheet.addRow(['', '', '', '', 'TOTALE PASSEGGERI:', totalPax, '']);
        summaryRow.font = { bold: true, size: 12 };
        summaryRow.getCell(6).alignment = { horizontal: 'center' };
        summaryRow.getCell(6).font = { bold: true, size: 12, color: { argb: 'FF1D4ED8' } }; // Blue Text

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Generate filename
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
