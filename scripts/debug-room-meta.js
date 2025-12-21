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

                // Mostra tutte le chiavi con tipo
                for (const m of meta) {
                    const key = m.display_key || m.key || '(no key)';
                    const rawValue = m.display_value !== undefined ? m.display_value : m.value;

                    // Handle different value types
                    let displayValue;
                    if (rawValue === null || rawValue === undefined) {
                        displayValue = '(null)';
                    } else if (typeof rawValue === 'object') {
                        displayValue = `[OBJECT] ${JSON.stringify(rawValue).substring(0, 100)}`;
                    } else if (typeof rawValue === 'string') {
                        displayValue = `"${rawValue.substring(0, 60)}${rawValue.length > 60 ? '...' : ''}"`;
                    } else {
                        displayValue = String(rawValue);
                    }

                    // Evidenzia i campi Nome/Cognome
                    const keyLower = key.toLowerCase();
                    if (keyLower.includes('nome') || keyLower.includes('cognome')) {
                        console.log(`  ⭐ ${key}: ${displayValue}`);
                    } else {
                        console.log(`     ${key}: ${displayValue}`);
                    }
                }
            } catch (e) {
                console.log('   Errore parsing metaData:', e.message);
                console.log('   Raw metaData (first 500 chars):', item.metaData.substring(0, 500));
            }
        } else {
            console.log('   (nessun metaData)');
        }
    }

    await prisma.$disconnect();
}

debugRoomMeta().catch(console.error);
