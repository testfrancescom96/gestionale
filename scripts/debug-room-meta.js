// Script per analizzare i metadati di un prodotto camera
// Eseguire con: node scripts/debug-room-meta.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugRoomMeta() {
    // Prodotto con camere - ID 38453
    const productId = 38453;

    const product = await prisma.wooProduct.findUnique({
        where: { id: productId },
        include: {
            orderItems: {
                include: { order: true },
                take: 3 // Solo primi 3 ordini
            }
        }
    });

    if (!product) {
        console.log('Prodotto non trovato');
        return;
    }

    console.log('========================================');
    console.log(`Prodotto: ${product.name} (ID: ${product.id})`);
    console.log(`Order Items: ${product.orderItems.length}`);
    console.log('========================================\n');

    for (const item of product.orderItems) {
        console.log(`\n--- Order Item - Ordine #${item.wooOrderId} ---`);
        console.log(`Product Name in Item: ${item.productName}`);
        console.log(`Quantity: ${item.quantity}`);

        if (item.metaData) {
            try {
                const meta = JSON.parse(item.metaData);
                console.log(`\nMetaData (${meta.length} entries):`);

                // Mostra tutte le chiavi
                for (const m of meta) {
                    const key = m.display_key || m.key || '(no key)';
                    const value = m.display_value || m.value || '(no value)';

                    // Evidenzia i campi Nome/Cognome
                    if (key.toLowerCase().includes('nome') || key.toLowerCase().includes('cognome')) {
                        console.log(`  ⭐ ${key}: "${value}"`);
                    } else {
                        console.log(`     ${key}: "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`);
                    }
                }
            } catch (e) {
                console.log('   Errore parsing metaData:', e.message);
            }
        } else {
            console.log('   (nessun metaData)');
        }
    }

    await prisma.$disconnect();
}

debugRoomMeta().catch(console.error);
