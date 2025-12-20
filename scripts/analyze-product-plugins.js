/**
 * Analisi plugin e tipologie prodotto WooCommerce
 * Esegui con: node scripts/analyze-product-plugins.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function analyzeProductPlugins() {
    console.log("=== ANALISI PLUGIN E TIPOLOGIE PRODOTTO ===\n");

    // 1. Get all products
    const products = await prisma.wooProduct.findMany({
        select: {
            id: true,
            name: true,
            productType: true,
            sku: true,
            metaData: true,
        }
    });

    console.log(`Totale prodotti: ${products.length}\n`);

    // 2. Analyze product types
    const typeCount = new Map();
    products.forEach(p => {
        const type = p.productType || 'unknown';
        typeCount.set(type, (typeCount.get(type) || 0) + 1);
    });

    console.log("=== TIPOLOGIE PRODOTTO ===");
    Array.from(typeCount.entries())
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
            console.log(`  ${type}: ${count} prodotti`);
        });

    // 3. Analyze meta_data keys to identify plugins
    const metaKeyPatterns = new Map(); // key pattern -> count

    // Plugin signatures (known prefixes)
    const pluginSignatures = {
        '_ttbm_': 'Travel Tour Booking Manager',
        '_field_': 'Flexible Checkout Fields / Product Fields',
        '_service_': 'WooCommerce Product Add-ons / Services',
        '_event_': 'Event Tickets Plugin',
        'pa_': 'WooCommerce Product Attributes',
        '_yith': 'YITH Plugin Suite',
        '_wc_': 'WooCommerce Core',
        '_ticket': 'Event Tickets',
        'attribute_': 'Product Variations',
    };

    const pluginUsage = new Map();
    const unknownKeys = new Set();

    // Get all order items to analyze
    const orderItems = await prisma.wooOrderItem.findMany({
        select: { metaData: true },
        take: 5000 // Sample size
    });

    console.log(`\nAnalizzando ${orderItems.length} order items...\n`);

    for (const item of orderItems) {
        if (!item.metaData) continue;

        try {
            const meta = JSON.parse(item.metaData);
            if (!Array.isArray(meta)) continue;

            for (const field of meta) {
                const key = field.key || field.display_key || '';

                // Match against known plugin signatures
                let matched = false;
                for (const [prefix, pluginName] of Object.entries(pluginSignatures)) {
                    if (key.startsWith(prefix) || key.toLowerCase().startsWith(prefix)) {
                        const current = pluginUsage.get(pluginName) || { count: 0, keys: new Set() };
                        current.count++;
                        current.keys.add(key);
                        pluginUsage.set(pluginName, current);
                        matched = true;
                        break;
                    }
                }

                if (!matched && key && !key.startsWith('_')) {
                    // Custom/unknown fields
                    const current = pluginUsage.get('Campi Custom/Form') || { count: 0, keys: new Set() };
                    current.count++;
                    current.keys.add(key);
                    pluginUsage.set('Campi Custom/Form', current);
                }
            }
        } catch (e) {
            // Skip invalid JSON
        }
    }

    console.log("=== PLUGIN RILEVATI (basato su metadati ordini) ===\n");

    Array.from(pluginUsage.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([plugin, data]) => {
            console.log(`📦 ${plugin}`);
            console.log(`   Utilizzi: ${data.count}`);
            console.log(`   Chiavi: ${Array.from(data.keys).slice(0, 10).join(', ')}${data.keys.size > 10 ? '...' : ''}`);
            console.log("");
        });

    // 4. Product-specific analysis
    console.log("\n=== PRODOTTI PER TIPOLOGIA (dettaglio) ===\n");

    // Ticket-event products
    const ticketProducts = products.filter(p => p.productType === 'ticket-event');
    console.log(`🎫 Ticket-Event: ${ticketProducts.length} prodotti`);
    ticketProducts.slice(0, 5).forEach(p => {
        console.log(`   - ${p.name} (SKU: ${p.sku || 'N/A'})`);
    });
    if (ticketProducts.length > 5) console.log(`   ... e altri ${ticketProducts.length - 5}`);

    // Variable products
    const variableProducts = products.filter(p => p.productType === 'variable');
    console.log(`\n🔀 Variable: ${variableProducts.length} prodotti`);
    variableProducts.slice(0, 5).forEach(p => {
        console.log(`   - ${p.name} (SKU: ${p.sku || 'N/A'})`);
    });
    if (variableProducts.length > 5) console.log(`   ... e altri ${variableProducts.length - 5}`);

    // Simple products
    const simpleProducts = products.filter(p => p.productType === 'simple');
    console.log(`\n📦 Simple: ${simpleProducts.length} prodotti`);
    simpleProducts.slice(0, 5).forEach(p => {
        console.log(`   - ${p.name} (SKU: ${p.sku || 'N/A'})`);
    });
    if (simpleProducts.length > 5) console.log(`   ... e altri ${simpleProducts.length - 5}`);

    // External products
    const externalProducts = products.filter(p => p.productType === 'external');
    console.log(`\n🔗 External/Affiliato: ${externalProducts.length} prodotti`);
    externalProducts.slice(0, 5).forEach(p => {
        console.log(`   - ${p.name}`);
    });

    await prisma.$disconnect();
    console.log("\n✅ Analisi completata!");
}

analyzeProductPlugins().catch(console.error);
