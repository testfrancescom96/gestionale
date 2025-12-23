// Script per verificare se il campo importo è visibile nell'API
const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    try {
        console.log('='.repeat(80));
        console.log('🔍 VERIFICA CAMPO IMPORTO NEL DATABASE');
        console.log('='.repeat(80));

        // 1. Verifica nella tabella WooExportConfig
        console.log('\n📊 1. CAMPI IN WooExportConfig:');
        const allConfigs = await prisma.wooExportConfig.findMany({
            orderBy: { displayOrder: 'asc' }
        });

        console.log(`   Totale campi configurati: ${allConfigs.length}`);

        // Cerca specificamente importo
        const importoConfig = allConfigs.find(c =>
            c.fieldKey.toLowerCase().includes('importo') ||
            c.label?.toLowerCase().includes('importo')
        );

        if (importoConfig) {
            console.log('\n   ✅ CAMPO IMPORTO TROVATO:');
            console.log(`      - fieldKey: ${importoConfig.fieldKey}`);
            console.log(`      - label: ${importoConfig.label}`);
            console.log(`      - mappingType: ${importoConfig.mappingType}`);
            console.log(`      - isDefaultSelected: ${importoConfig.isDefaultSelected}`);
            console.log(`      - displayOrder: ${importoConfig.displayOrder}`);
        } else {
            console.log('\n   ❌ CAMPO IMPORTO NON TROVATO - Devo crearlo!');

            // Crealo
            const newField = await prisma.wooExportConfig.create({
                data: {
                    fieldKey: 'importo',
                    label: 'Importo €',
                    mappingType: 'COLUMN',
                    isDefaultSelected: true,
                    displayOrder: 5
                }
            });
            console.log('   ✅ Campo importo creato:', newField);
        }

        // 2. Mostra tutti i campi che sembrano essere di tipo prezzo/importo
        console.log('\n📋 2. ALTRI CAMPI RELATIVI A PREZZI:');
        const priceFields = allConfigs.filter(c => {
            const key = (c.fieldKey || '').toLowerCase();
            const label = (c.label || '').toLowerCase();
            return key.includes('prezzo') ||
                key.includes('price') ||
                key.includes('totale') ||
                key.includes('pagato') ||
                key.includes('amount') ||
                label.includes('prezzo') ||
                label.includes('importo') ||
                label.includes('€');
        });

        if (priceFields.length > 0) {
            priceFields.forEach(f => {
                console.log(`   - ${f.fieldKey}: "${f.label}" (${f.mappingType})`);
            });
        } else {
            console.log('   (Nessun altro campo prezzo trovato)');
        }

        // 3. Verifica campi visibili (non HIDDEN)
        console.log('\n📋 3. LISTA COMPLETA CAMPI VISIBILI (primi 20):');
        const visibleFields = allConfigs.filter(c => c.mappingType !== 'HIDDEN');
        visibleFields.slice(0, 20).forEach(f => {
            const sel = f.isDefaultSelected ? '✓' : ' ';
            console.log(`   [${sel}] ${f.fieldKey}: "${f.label}"`);
        });
        if (visibleFields.length > 20) {
            console.log(`   ... e altri ${visibleFields.length - 20} campi`);
        }

        console.log('\n' + '='.repeat(80));
        console.log('📌 SOLUZIONE:');
        console.log('='.repeat(80));
        console.log(`
Se il campo "importo" non appare nella Gestione Campi:

1. Il campo "importo" è stato appena creato/verificato nel database
2. Ricarica la pagina WooCommerce nel gestionale
3. Clicca su "Aggiungi campi in Impostazioni"
4. Cerca "importo" - dovrebbe apparire ora

Se ancora non lo vedi, potrebbe essere un problema di cache.
Prova: pm2 restart gestionale
`);

    } catch (error) {
        console.error('❌ Errore:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
