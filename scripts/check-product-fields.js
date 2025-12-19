/**
 * Script diagnostico per analizzare i campi di un prodotto specifico
 * Esegui con: node scripts/check-product-fields.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// SKU del prodotto da analizzare
const TARGET_SKU = "3uominiedonne021225";

async function analyzeProduct() {
    console.log("=== ANALISI CAMPI PRODOTTO ===\n");

    // 1. Trova il prodotto per SKU
    const product = await prisma.wooProduct.findFirst({
        where: { sku: TARGET_SKU }
    });

    if (!product) {
        console.log("Prodotto non trovato! Cercando tutti i prodotti...");
        const allProducts = await prisma.wooProduct.findMany({ take: 10 });
        console.log("Primi 10 prodotti:");
        allProducts.forEach(p => console.log(`  - ${p.id}: ${p.name}`));
        await prisma.$disconnect();
        return;
    }

    console.log(`Prodotto trovato: ${product.name} (ID: ${product.id})\n`);

    // 2. Trova tutti gli order items per questo prodotto
    const orderItems = await prisma.wooOrderItem.findMany({
        where: { wooProductId: product.id },
        include: { order: true }
    });

    console.log(`Totale OrderItems: ${orderItems.length}\n`);

    if (orderItems.length === 0) {
        console.log("Nessun ordine trovato per questo prodotto!");
        await prisma.$disconnect();
        return;
    }

    // 3. Analizza tutti i campi unici
    const allFields = new Map(); // fieldKey -> { count, examples }

    for (const item of orderItems) {
        if (!item.metaData) continue;

        try {
            const meta = JSON.parse(item.metaData);
            if (!Array.isArray(meta)) continue;

            for (const field of meta) {
                const key = field.key || field.display_key || 'unknown';
                const displayKey = field.display_key || key;
                const value = field.value || field.display_value || '';

                if (!allFields.has(key)) {
                    allFields.set(key, {
                        key: key,
                        displayKey: displayKey,
                        count: 0,
                        examples: []
                    });
                }

                const fieldInfo = allFields.get(key);
                fieldInfo.count++;

                // Salva max 2 esempi di valori
                if (fieldInfo.examples.length < 2 && value) {
                    fieldInfo.examples.push(String(value).substring(0, 40));
                }
            }
        } catch (e) {
            // Skip invalid JSON
        }
    }

    // 4. Mostra tutti i campi trovati
    console.log("=== CAMPI TROVATI NEL PRODOTTO ===\n");

    const sortedFields = Array.from(allFields.values())
        .sort((a, b) => b.count - a.count);

    console.log(`Totale campi unici: ${sortedFields.length}\n`);

    for (const field of sortedFields) {
        const isCF = field.key.toLowerCase().includes('fiscal') ||
            field.key.toLowerCase().includes('cf') ||
            field.displayKey.toLowerCase().includes('fiscal') ||
            field.displayKey.toLowerCase().includes('cf');

        const marker = isCF ? "🎯 CODICE FISCALE" : "";

        console.log(`${marker ? marker + " " : ""}📌 ${field.displayKey}`);
        console.log(`   Key: "${field.key}"`);
        console.log(`   Usato in: ${field.count} ordini`);
        console.log(`   Esempi: ${field.examples.join(" | ")}`);
        console.log("");
    }

    // 5. Mostra anche un ordine completo come esempio
    console.log("\n=== ESEMPIO ORDINE COMPLETO ===\n");
    const sampleItem = orderItems.find(i => i.metaData);
    if (sampleItem) {
        console.log(`Ordine #${sampleItem.order?.id}`);
        console.log(`Prodotto: ${sampleItem.productName}`);
        console.log(`Quantità: ${sampleItem.quantity}`);
        console.log("\nMetaData RAW:");
        try {
            const meta = JSON.parse(sampleItem.metaData || "[]");
            meta.forEach((m, i) => {
                console.log(`  [${i}] key="${m.key}" display_key="${m.display_key}" value="${String(m.value || m.display_value || '').substring(0, 50)}"`);
            });
        } catch (e) {
            console.log("  (parsing error)");
        }
    }

    await prisma.$disconnect();
}

analyzeProduct().catch(console.error);
