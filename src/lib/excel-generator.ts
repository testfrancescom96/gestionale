import ExcelJS from 'exceljs';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Partecipante {
    id: string;
    nome: string;
    cognome: string;
    dataNascita: Date | null;
    codiceFiscale: string | null;
    nazionalita: string | null;
}

interface Pratica {
    numero: string | null;
    destinazione: string;
    dataPartenza: Date | null;
    dataRitorno: Date | null;
    cliente: {
        nome: string;
        cognome: string;
    };
}

export async function generatePassengerListExcel(pratica: Pratica, partecipanti: Partecipante[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lista Passeggeri');

    workbook.creator = 'Gestionale GO on the ROAD';
    workbook.created = new Date();

    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Lista Passeggeri - ${pratica.destinazione}`;
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells('A2:F2');
    const infoCell = worksheet.getCell('A2');
    infoCell.value = `Pratica N° ${pratica.numero || 'N/D'} - Cliente: ${pratica.cliente.nome} ${pratica.cliente.cognome}`;
    infoCell.font = { size: 11, italic: true };
    infoCell.alignment = { vertical: 'middle', horizontal: 'center' };

    if (pratica.dataPartenza || pratica.dataRitorno) {
        worksheet.mergeCells('A3:F3');
        const dateCell = worksheet.getCell('A3');
        const partenza = pratica.dataPartenza ? format(pratica.dataPartenza, 'dd/MM/yyyy', { locale: it }) : 'N/D';
        const ritorno = pratica.dataRitorno ? format(pratica.dataRitorno, 'dd/MM/yyyy', { locale: it }) : 'N/D';
        dateCell.value = `Partenza: ${partenza} - Ritorno: ${ritorno}`;
        dateCell.font = { size: 10 };
        dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    worksheet.addRow([]);

    const headerRow = worksheet.addRow(['N°', 'Cognome', 'Nome', 'Data Nascita', 'Codice Fiscale', 'Nazionalità']);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    worksheet.columns = [
        { key: 'num', width: 6 },
        { key: 'cognome', width: 20 },
        { key: 'nome', width: 20 },
        { key: 'dataNascita', width: 15 },
        { key: 'codiceFiscale', width: 20 },
        { key: 'nazionalita', width: 15 },
    ];

    partecipanti.forEach((p, index) => {
        const row = worksheet.addRow({
            num: index + 1,
            cognome: p.cognome,
            nome: p.nome,
            dataNascita: p.dataNascita ? format(p.dataNascita, 'dd/MM/yyyy', { locale: it }) : '',
            codiceFiscale: p.codiceFiscale || '',
            nazionalita: p.nazionalita || 'ITALIANA',
        });

        if (index % 2 === 0) {
            row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
        }

        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
                right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
            };
        });
    });

    const totalRow = worksheet.addRow(['', '', '', '', '', '']);
    worksheet.mergeCells(totalRow.number, 1, totalRow.number, 5);
    const totalCell = worksheet.getCell(totalRow.number, 1);
    totalCell.value = `Totale Partecipanti: ${partecipanti.length}`;
    totalCell.font = { bold: true, size: 12 };
    totalCell.alignment = { horizontal: 'right' };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
}
