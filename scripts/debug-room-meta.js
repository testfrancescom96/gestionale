// Script per analizzare ordini specifici
// Eseguire con: node scripts/debug-room-meta.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugRoomMeta() {
    // Ordini dalla screenshot che mostrano "-"
    const orderIds = [38781, 38797, 38933, 39596, 39674];

    console.log('========================================');
    console.log('Analisi ordini specifici dalla screenshot');
    console.log('========================================\n');

    // Cerca gli orderItems per questi ordini
    const items = await prisma.wooOrderItem.findMany({
        where: { wooOrderId: { in: orderIds } },
        include: { order: true }
    });

    console.log(`Trovati ${items.length} order items per ordini ${orderIds.join(', ')}\n`);

    if (items.length === 0) {
        console.log('Nessun order item trovato! Verifico ordini...');
        const orders = await prisma.wooOrder.findMany({
            where: { id: { in: orderIds } }
        });
        console.log(`Ordini esistenti: ${orders.map(o => o.id).join(', ') || 'nessuno'}`);

        // Cerca tutti gli order items del prodotto 38453
        console.log('\nCerco tutti gli items del prodotto 38453...');
        const allItems = await prisma.wooOrderItem.findMany({
            where: { productId: 38453 },
            include: { order: true },
            take: 5
        });
        console.log(`Order items totali per prodotto 38453: ${allItems.length}`);
        for (const item of allItems) {
            console.log(`  - Ordine #${item.wooOrderId}, Prodotto: ${item.productName}`);
        }
    }

    for (const item of items) {
        console.log(`\n--- Order Item - Ordine #${item.wooOrderId} ---`);
        console.log(`Product Name: ${item.productName}`);
        console.log(`Quantity: ${item.quantity}`);

        if (item.metaData) {
            try {
                const meta = JSON.parse(item.metaData);
                console.log(`MetaData entries: ${meta.length}`);

                // Cerca solo Nome/Cognome
                for (const m of meta) {
                    const key = m.display_key || m.key || '';
                    const keyLower = key.toLowerCase();
                    if (keyLower.includes('nome') || keyLower.includes('cognome')) {
                        const value = m.display_value || m.value;
                        const displayValue = typeof value === 'string' ? value : JSON.stringify(value);
                        console.log(`  ** ${key}: "${displayValue}"`);
                    }
                }
            } catch (e) {
                console.log(`  Errore parsing: ${e.message}`);
            }
        } else {
            console.log('  (nessun metaData)');
        }
    }

    await prisma.$disconnect();
}

debugRoomMeta().catch(console.error);
