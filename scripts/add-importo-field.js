// Script per aggiungere il campo 'importo' alla configurazione export
const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    try {
        console.log('🔍 Verifico campi esistenti...');

        // Verifica campi esistenti
        const existingFields = await prisma.wooExportConfig.findMany();
        console.log(`📋 Campi esistenti nel database: ${existingFields.length}`);

        for (const field of existingFields) {
            console.log(`  - ${field.fieldKey}: ${field.label} (${field.mappingType})`);
        }

        // Verifica se esiste già 'importo'
        const importoField = await prisma.wooExportConfig.findUnique({
            where: { fieldKey: 'importo' }
        });

        if (importoField) {
            console.log('✅ Campo "importo" già esiste:', importoField);
        } else {
            console.log('⚠️ Campo "importo" non trovato. Lo creo...');

            const newField = await prisma.wooExportConfig.create({
                data: {
                    fieldKey: 'importo',
                    label: 'Importo €',
                    mappingType: 'COLUMN',
                    isDefaultSelected: true,
                    displayOrder: 10
                }
            });

            console.log('✅ Campo "importo" creato:', newField);
        }

        // Verifica anche pax
        const paxField = await prisma.wooExportConfig.findUnique({
            where: { fieldKey: 'pax' }
        });

        if (!paxField) {
            console.log('⚠️ Campo "pax" non trovato. Lo creo...');

            await prisma.wooExportConfig.create({
                data: {
                    fieldKey: 'pax',
                    label: 'Pax',
                    mappingType: 'COLUMN',
                    isDefaultSelected: false,
                    displayOrder: 11
                }
            });

            console.log('✅ Campo "pax" creato');
        }

        console.log('\n📊 Campi finali:');
        const finalFields = await prisma.wooExportConfig.findMany({
            orderBy: { displayOrder: 'asc' }
        });

        for (const field of finalFields) {
            const selected = field.isDefaultSelected ? '✓' : ' ';
            console.log(`  [${selected}] ${field.fieldKey}: "${field.label}" (${field.mappingType}) - Ordine: ${field.displayOrder}`);
        }

    } catch (error) {
        console.error('❌ Errore:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
