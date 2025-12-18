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

        // Header row
        const headerRow = worksheet.addRow(['N°', 'Cognome', 'Nome', 'Telefono', 'Punto Partenza', 'Pax', 'Note']);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        headerRow.alignment = { horizontal: 'center' };

        // Column widths
        worksheet.columns = [
            { key: 'num', width: 6 },
            { key: 'cognome', width: 18 },
            { key: 'nome', width: 18 },
            { key: 'telefono', width: 15 },
            { key: 'puntoPartenza', width: 20 },
            { key: 'pax', width: 6 },
            { key: 'note', width: 25 }
        ];

        let rowNum = 1;

        // Add WooCommerce orders
        for (const item of product.orderItems) {
            const order = item.order;
            if (order) {
                const row = worksheet.addRow([
                    rowNum++,
                    order.billingLastName || '',
                    order.billingFirstName || '',
                    order.billingPhone || '',
                    '-', // Punto partenza non disponibile da WooCommerce
                    item.quantity,
                    `Ordine #${order.id}`
                ]);
                // Alternate row colors
                if (rowNum % 2 === 0) {
                    row.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF2F2F2' }
                    };
                }
            }
        }

        // Add Manual Bookings
        for (const booking of product.manualBookings) {
            const row = worksheet.addRow([
                rowNum++,
                booking.cognome,
                booking.nome,
                booking.telefono || '',
                booking.puntoPartenza || '',
                booking.numPartecipanti,
                booking.note || 'Manuale'
            ]);
            // Mark manual bookings with light green background
            row.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE2EFDA' }
            };
        }

        // Add borders to all data cells
        const lastRow = worksheet.rowCount;
        for (let r = 4; r <= lastRow; r++) {
            for (let c = 1; c <= 7; c++) {
                const cell = worksheet.getCell(r, c);
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            }
        }

        // Summary row
        worksheet.addRow([]);
        const summaryRow = worksheet.addRow(['', '', '', '', 'TOTALE:', rowNum - 1, '']);
        summaryRow.font = { bold: true };

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
