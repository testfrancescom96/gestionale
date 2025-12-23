// Script per analizzare dove viene memorizzato l'importo del singolo passeggero
const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    try {
        console.log('='.repeat(80));
        console.log('📊 ANALISI CAMPO IMPORTO PASSEGGERI');
        console.log('='.repeat(80));

        // Prendi alcuni order items con i loro ordini
        const orderItems = await prisma.wooOrderItem.findMany({
            take: 10,
            include: {
                order: true,
                product: true
            },
            orderBy: { id: 'desc' }
        });

        console.log(`\n🔍 Analizzando ${orderItems.length} ordini recenti...\n`);

        for (const item of orderItems) {
            console.log('-'.repeat(80));
            console.log(`📦 ORDINE #${item.orderId} - Prodotto: ${item.product?.name || 'N/A'}`);
            console.log('-'.repeat(80));

            // IMPORTO DAL DATABASE
            console.log('\n💰 CAMPI IMPORTO NEL DATABASE:');
            console.log(`   • item.total (totale riga ordine): ${item.total}`);
            console.log(`   • item.quantity (quantità): ${item.quantity}`);
            console.log(`   • Importo per persona (total/quantity): €${(item.total / item.quantity).toFixed(2)}`);

            if (item.order) {
                console.log(`   • order.total (totale ordine): ${item.order.total}`);
            }

            // ANALIZZA METADATA
            console.log('\n📝 CAMPI NEI METADATA:');
            if (item.metaData) {
                try {
                    const meta = JSON.parse(item.metaData);
                    if (Array.isArray(meta)) {
                        // Cerca campi relativi a importo/prezzo
                        const priceFields = meta.filter(m => {
                            const key = (m.key || m.display_key || '').toLowerCase();
                            const value = String(m.value || m.display_value || '');
                            return key.includes('prezzo') ||
                                key.includes('importo') ||
                                key.includes('totale') ||
                                key.includes('pagato') ||
                                key.includes('price') ||
                                key.includes('amount') ||
                                key.includes('cost') ||
                                /^\d+([,.]\d{2})?$/.test(value) || // Numeri che sembrano prezzi
                                /€/.test(value);
                        });

                        if (priceFields.length > 0) {
                            priceFields.forEach(f => {
                                console.log(`   ✓ ${f.key || f.display_key}: "${f.value || f.display_value}"`);
                            });
                        } else {
                            console.log('   (Nessun campo prezzo/importo trovato nei metadata)');
                        }

                        // Mostra tutti i campi per debug
                        console.log('\n   📋 TUTTI I CAMPI METADATA:');
                        meta.slice(0, 15).forEach(m => {
                            const key = m.key || m.display_key || '???';
                            const value = m.value || m.display_value || '';
                            if (!key.startsWith('_')) { // Salta campi interni
                                console.log(`      - ${key}: "${String(value).substring(0, 50)}"`);
                            }
                        });
                        if (meta.length > 15) {
                            console.log(`      ... e altri ${meta.length - 15} campi`);
                        }
                    }
                } catch (e) {
                    console.log('   (Errore parsing metadata)');
                }
            } else {
                console.log('   (Nessun metadata)');
            }

            console.log('');
        }

        // RIEPILOGO
        console.log('='.repeat(80));
        console.log('📌 RIEPILOGO - DOVE TROVARE L\'IMPORTO:');
        console.log('='.repeat(80));
        console.log(`
L'importo del singolo passeggero viene CALCOLATO, non memorizzato direttamente.

FONTE DATI:
-----------
1. WooOrderItem.total → Totale della riga ordine (es: €150.00 per camera doppia)
2. WooOrderItem.quantity → Quantità (es: 2 persone)
3. IMPORTO CALCOLATO = total / quantity = €75.00 per persona

NEL CODICE (passenger-list API, linea ~327):
--------------------------------------------
   importo: item.total / numPassengers   // Per multi-passeggero
   importo: item.total                   // Per singolo

COME VISUALIZZARLO:
-------------------
1. Vai su WooCommerce → Lista Passeggeri
2. Clicca "Aggiungi campi in Impostazioni" in alto a destra
3. Cerca "importo" e attivalo (metti visibile + preselezionato)
4. Torna alla lista passeggeri e vedrai la colonna "Importo €"
`);

    } catch (error) {
        console.error('❌ Errore:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
