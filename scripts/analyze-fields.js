/**
 * Script diagnostico per analizzare tutti i campi usati negli ordini WooCommerce
 * Esegui con: node scripts/analyze-fields.js
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function analyzeFields() {
    console.log("=== ANALISI CAMPI WOOCOMMERCE ===\n");

    // 1. Recupera tutti gli order items con metaData
    const orderItems = await prisma.wooOrderItem.findMany({
        select: {
            id: true,
            productName: true,
            metaData: true,
            wooProductId: true
        }
    });

    console.log(`Totale OrderItems nel DB: ${orderItems.length}\n`);

    // 2. Analizza tutti i campi unici
    const allFields = new Map(); // fieldKey -> { count, examples, products }

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
                        examples: [],
                        products: new Set()
                    });
                }

                const fieldInfo = allFields.get(key);
                fieldInfo.count++;
                fieldInfo.products.add(item.wooProductId);

                // Salva max 3 esempi di valori
                if (fieldInfo.examples.length < 3 && value && !fieldInfo.examples.includes(value)) {
                    fieldInfo.examples.push(String(value).substring(0, 50));
                }
            }
        } catch (e) {
            // Skip invalid JSON
        }
    }

    // 3. Ordina per frequenza
    const sortedFields = Array.from(allFields.values())
        .sort((a, b) => b.count - a.count);

    console.log("=== TUTTI I CAMPI TROVATI ===\n");
    console.log(`Totale campi unici: ${sortedFields.length}\n`);

    for (const field of sortedFields) {
        console.log(`📌 ${field.displayKey}`);
        console.log(`   Key: ${field.key}`);
        console.log(`   Usato in: ${field.count} ordini, ${field.products.size} prodotti`);
        console.log(`   Esempi: ${field.examples.join(", ")}`);
        console.log("");
    }

    // 4. Confronta con WooExportConfig
    console.log("\n=== CAMPI IN WOOEXPORTCONFIG ===\n");

    const configs = await prisma.wooExportConfig.findMany();
    console.log(`Campi configurati: ${configs.length}\n`);

    for (const c of configs) {
        console.log(`- ${c.label} (key: ${c.fieldKey}, tipo: ${c.mappingType})`);
    }

    // 5. Campi mancanti
    console.log("\n=== CAMPI NON CONFIGURATI ===\n");

    const configuredKeys = new Set(configs.map(c => c.fieldKey));
    const missingFields = sortedFields.filter(f => !configuredKeys.has(f.key) && !configuredKeys.has(f.displayKey));

    console.log(`Campi trovati ma non in config: ${missingFields.length}\n`);
    for (const f of missingFields.slice(0, 20)) {
        console.log(`- ${f.displayKey} (${f.count} ordini)`);
    }

    await prisma.$disconnect();
}

analyzeFields().catch(console.error);
