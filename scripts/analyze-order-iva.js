// Script per analizzare l'ordine 43803 e capire il problema IVA
const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
    const orderId = 43803;

    try {
        console.log('='.repeat(80));
        console.log(`📊 ANALISI ORDINE #${orderId} - PROBLEMA IVA`);
        console.log('='.repeat(80));

        // 1. Trova l'ordine
        const order = await prisma.wooOrder.findFirst({
            where: { wooId: orderId },
            include: {
                items: true
            }
        });

        if (!order) {
            console.log(`❌ Ordine #${orderId} non trovato nel database`);
            return;
        }

        console.log('\n📦 DATI ORDINE:');
        console.log(`   wooId: ${order.wooId}`);
        console.log(`   status: ${order.status}`);
        console.log(`   total (DB): ${order.total}`);
        console.log(`   currency: ${order.currency}`);
        console.log(`   dateCreated: ${order.dateCreated}`);

        // 2. Analizza i campi metadata
        console.log('\n💰 ANALISI TOTALI:');
        if (order.metaData) {
            try {
                const meta = JSON.parse(order.metaData);
                console.log('   Metadata ordine trovato:');

                // Cerca campi relativi a totali/iva
                const priceFields = meta.filter((m) => {
                    const key = (m.key || '').toLowerCase();
                    return key.includes('total') ||
                        key.includes('tax') ||
                        key.includes('iva') ||
                        key.includes('amount') ||
                        key.includes('subtotal');
                });

                if (priceFields.length > 0) {
                    priceFields.forEach(f => {
                        console.log(`   - ${f.key}: ${f.value}`);
                    });
                } else {
                    console.log('   (Nessun campo prezzo specifico nei metadata)');
                }
            } catch (e) {
                console.log('   Errore parsing metadata ordine');
            }
        }

        // 3. Analizza gli item dell'ordine
        console.log('\n📋 ITEMS DELL\'ORDINE:');
        for (const item of order.items) {
            console.log(`\n   ITEM ID: ${item.id}`);
            console.log(`   - total (campo DB): ${item.total}`);
            console.log(`   - quantity: ${item.quantity}`);
            console.log(`   - productId: ${item.wooProductId}`);

            if (item.metaData) {
                try {
                    const meta = JSON.parse(item.metaData);
                    console.log('   - Metadata item:');

                    // Cerca campi relativi a prezzi
                    const priceFields = meta.filter((m) => {
                        const key = (m.key || '').toLowerCase();
                        const value = String(m.value || '').toLowerCase();
                        return key.includes('prezzo') ||
                            key.includes('price') ||
                            key.includes('total') ||
                            key.includes('amount') ||
                            key.includes('subtotal') ||
                            value.includes('€') ||
                            value.includes('iva');
                    });

                    priceFields.forEach(f => {
                        const val = String(f.value || f.display_value || '').substring(0, 100);
                        console.log(`     • ${f.key}: "${val}"`);
                    });

                    // Mostra tutti i campi per debug
                    console.log('   - TUTTI I CAMPI (primi 10):');
                    meta.slice(0, 10).forEach(m => {
                        const key = m.key || m.display_key || '???';
                        const val = String(m.value || m.display_value || '').substring(0, 50);
                        console.log(`     • ${key}: "${val}"`);
                    });

                } catch (e) {
                    console.log('   Errore parsing metadata item');
                }
            }
        }

        // 4. Calcolo differenze
        console.log('\n' + '='.repeat(80));
        console.log('📌 ANALISI FINALE:');
        console.log('='.repeat(80));

        const totalDB = parseFloat(order.total) || 0;
        const expectedWithIVA = 20.00;
        const ivaRate = 0.10; // 10% presumibilmente

        console.log(`
PROBLEMA RILEVATO:
-----------------
- Importo visualizzato nel gestionale: €${totalDB.toFixed(2)}
- Importo atteso (da WooCommerce): €${expectedWithIVA.toFixed(2)}
- Differenza: €${(expectedWithIVA - totalDB).toFixed(2)}

POSSIBILI CAUSE:
----------------
1. WooCommerce invia l'importo al NETTO dell'IVA
2. Il campo 'total' nel DB contiene il subtotale (senza IVA)
3. L'IVA è in un campo separato non utilizzato

SOLUZIONE:
----------
Se WooCommerce invia 'total' al netto IVA, devo usare un campo diverso
o calcolare: importo_lordo = total + (total * aliquota_iva)
`);

    } catch (error) {
        console.error('❌ Errore:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
