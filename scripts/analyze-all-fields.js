/**
 * Analisi completa di TUTTI i campi usati in TUTTI i prodotti
 * Esegui con: node scripts/analyze-all-fields.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function analyzeAllFields() {
    console.log("=== ANALISI COMPLETA CAMPI WOOCOMMERCE ===\n");

    // 1. Get all unique field keys across all orders
    const allItems = await prisma.wooOrderItem.findMany({
        select: {
            metaData: true,
            product: { select: { name: true, productType: true } }
        }
    });

    console.log(`Totale OrderItems analizzati: ${allItems.length}\n`);

    // Track all unique keys and their patterns
    const keyPatterns = new Map(); // key -> { count, products, examples, hasIndex }

    for (const item of allItems) {
        if (!item.metaData) continue;

        try {
            const meta = JSON.parse(item.metaData);
            if (!Array.isArray(meta)) continue;

            for (const field of meta) {
                const key = field.key || field.display_key || 'unknown';
                const value = field.value || field.display_value || '';
                const productType = item.product?.productType || 'unknown';

                if (!keyPatterns.has(key)) {
                    keyPatterns.set(key, {
                        count: 0,
                        products: new Set(),
                        examples: [],
                        hasIndex: /[_\-]?\d+$/.test(key), // Check if ends with number
                    });
                }

                const pattern = keyPatterns.get(key);
                pattern.count++;
                pattern.products.add(productType);

                if (pattern.examples.length < 2 && value) {
                    pattern.examples.push(String(value).substring(0, 30));
                }
            }
        } catch (e) {
            // Skip invalid JSON
        }
    }

    // Sort by count
    const sortedKeys = Array.from(keyPatterns.entries())
        .sort((a, b) => b[1].count - a[1].count);

    // Group by pattern type
    const indexed = sortedKeys.filter(([k, v]) => v.hasIndex);
    const regular = sortedKeys.filter(([k, v]) => !v.hasIndex);

    console.log("=== CAMPI REGOLARI (senza indice) ===");
    console.log("Questi campi hanno lo stesso nome per tutti i passeggeri\n");

    regular.slice(0, 30).forEach(([key, data]) => {
        console.log(`📌 ${key}`);
        console.log(`   Usato: ${data.count}x | Tipi: ${[...data.products].join(', ')}`);
        console.log(`   Esempi: ${data.examples.join(' | ')}`);
        console.log("");
    });

    if (indexed.length > 0) {
        console.log("\n=== CAMPI INDICIZZATI (con _1, _2, etc.) ===");
        console.log("Questi campi hanno indici per passeggeri multipli\n");

        indexed.slice(0, 30).forEach(([key, data]) => {
            console.log(`📌 ${key}`);
            console.log(`   Usato: ${data.count}x | Tipi: ${[...data.products].join(', ')}`);
            console.log(`   Esempi: ${data.examples.join(' | ')}`);
            console.log("");
        });
    }

    // Summary
    console.log("\n=== RIEPILOGO ===");
    console.log(`Campi regolari: ${regular.length}`);
    console.log(`Campi indicizzati: ${indexed.length}`);
    console.log(`Totale chiavi uniche: ${sortedKeys.length}`);

    // Check for passenger patterns
    const passengerPatterns = sortedKeys.filter(([k]) =>
        /nome|cognome|name|telefono|phone|cf|fiscale/i.test(k)
    );

    console.log("\n=== CAMPI PASSEGGERO RILEVATI ===");
    passengerPatterns.forEach(([key, data]) => {
        const indexed = data.hasIndex ? " [INDICIZZATO]" : "";
        console.log(`  ${key}${indexed} (${data.count}x)`);
    });

    await prisma.$disconnect();
}

analyzeAllFields().catch(console.error);
