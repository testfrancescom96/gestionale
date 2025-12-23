// Script completo per configurare tutti i campi essenziali
const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    try {
        console.log('🔍 Configurazione campi export...\n');

        // Campi essenziali da creare
        const essentialFields = [
            { fieldKey: '_field_Cognome', label: 'Cognome', mappingType: 'COLUMN', isDefaultSelected: true, displayOrder: 1 },
            { fieldKey: '_field_Nome', label: 'Nome', mappingType: 'COLUMN', isDefaultSelected: true, displayOrder: 2 },
            { fieldKey: '_field_Telefono', label: 'Telefono', mappingType: 'COLUMN', isDefaultSelected: true, displayOrder: 3 },
            { fieldKey: '_service_Partenza', label: 'Punto Partenza', mappingType: 'PARTENZA', isDefaultSelected: true, displayOrder: 4 },
            { fieldKey: 'importo', label: 'Importo €', mappingType: 'COLUMN', isDefaultSelected: true, displayOrder: 5 },
            { fieldKey: 'email', label: 'Email', mappingType: 'COLUMN', isDefaultSelected: false, displayOrder: 6 },
            { fieldKey: 'pax', label: 'Pax', mappingType: 'COLUMN', isDefaultSelected: false, displayOrder: 7 },
        ];

        for (const field of essentialFields) {
            const existing = await prisma.wooExportConfig.findUnique({
                where: { fieldKey: field.fieldKey }
            });

            if (existing) {
                console.log(`  ✓ ${field.fieldKey} già esiste`);
            } else {
                await prisma.wooExportConfig.create({ data: field });
                console.log(`  + ${field.fieldKey} creato`);
            }
        }

        console.log('\n📊 Configurazione finale:');
        const finalFields = await prisma.wooExportConfig.findMany({
            orderBy: { displayOrder: 'asc' }
        });

        for (const field of finalFields) {
            const selected = field.isDefaultSelected ? '✓' : ' ';
            console.log(`  [${selected}] ${field.label} (${field.fieldKey})`);
        }

        console.log(`\n✅ Totale: ${finalFields.length} campi configurati`);

    } catch (error) {
        console.error('❌ Errore:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
