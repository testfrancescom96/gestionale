/**
 * Script: analyze-room-product.js
 * Analizza il prodotto 38453 per capire la struttura delle prenotazioni camere
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeRoomProduct() {
    console.log('=== ANALISI PRODOTTO CAMERE 38453 ===\n');

    // 1. Get product info
    const product = await prisma.wooProduct.findUnique({
        where: { id: 38453 },
        include: {
            variations: true,
            orderItems: {
                take: 10,
                include: {
                    order: {
                        select: {
                            id: true,
                            billingFirstName: true,
                            billingLastName: true,
                            status: true,
                            metaData: true
                        }
                    }
                }
            },
            manualBookings: {
                take: 5
            }
        }
    });

    if (!product) {
        console.log('❌ Prodotto 38453 non trovato!');
        return;
    }

    console.log('📦 PRODOTTO:');
    console.log(`   ID: ${product.id}`);
    console.log(`   Nome: ${product.name}`);
    console.log(`   SKU: ${product.sku}`);
    console.log(`   Tipo: ${product.productType}`);
    console.log(`   Prezzo: ${product.price}`);
    console.log(`   Stock: ${product.stockQuantity}`);

    // 2. Check variations (room types)
    console.log(`\n🏨 VARIAZIONI (TIPI CAMERA): ${product.variations.length}`);
    product.variations.forEach((v, i) => {
        console.log(`   ${i + 1}. ${v.name} - €${v.price} (stock: ${v.stockQuantity})`);
        if (v.attributes) {
            try {
                const attrs = JSON.parse(v.attributes);
                console.log(`      Attributi: ${JSON.stringify(attrs)}`);
            } catch (e) { }
        }
    });

    // 3. Check order items (bookings)
    console.log(`\n📋 ORDINI RECENTI: ${product.orderItems.length}`);
    product.orderItems.forEach((item, i) => {
        console.log(`   ${i + 1}. Ordine #${item.order.id} - ${item.order.billingFirstName} ${item.order.billingLastName}`);
        console.log(`      Prodotto: ${item.productName}`);
        console.log(`      Quantità: ${item.quantity}`);
        console.log(`      Totale: €${item.total}`);

        // Parse metaData to see room selection
        if (item.metaData) {
            try {
                const meta = JSON.parse(item.metaData);
                console.log('      MetaData:');
                meta.forEach((m) => {
                    const key = m.display_key || m.key;
                    const value = m.display_value || m.value;
                    if (key && !key.startsWith('_')) {
                        console.log(`         - ${key}: ${value}`);
                    }
                });
            } catch (e) { }
        }
        console.log('');
    });

    // 4. Check product metaData for structure
    console.log('📝 PRODUCT METADATA:');
    if (product.metaData) {
        try {
            const meta = JSON.parse(product.metaData);
            if (Array.isArray(meta)) {
                meta.slice(0, 20).forEach((m) => {
                    const key = m.key || m.display_key;
                    if (key && !key.startsWith('_')) {
                        console.log(`   ${key}: ${JSON.stringify(m.value).slice(0, 100)}`);
                    }
                });
            }
        } catch (e) {
            console.log('   (parse error)');
        }
    }

    console.log('\n=== ANALISI COMPLETATA ===');
}

analyzeRoomProduct()
    .then(() => prisma.$disconnect())
    .catch(e => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
