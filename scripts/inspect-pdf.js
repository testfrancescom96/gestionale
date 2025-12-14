const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

async function inspectPdf() {
    try {
        const pdfPath = path.join(__dirname, '../public/templates/contratto.pdf');
        const pdfBytes = fs.readFileSync(pdfPath);

        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();
        const fields = form.getFields();

        console.log('--- Campi del PDF ---');
        fields.forEach(field => {
            const type = field.constructor.name;
            const name = field.getName();
            console.log(`Name: ${name} | Type: ${type}`);
        });
        console.log('--- Fine Campi ---');

    } catch (error) {
        console.error('Errore ispezione PDF:', error);
    }
}

inspectPdf();
