/**
 * Script per impostare isDefaultSelected sui campi principali
 * Esegui con: node scripts/set-default-fields.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Campi che dovrebbero essere pre-selezionati di default
const DEFAULT_SELECTED_KEYS = [
    // Campi passeggero principali
    '_field_Nome',
    '_field_Cognome',
    '_field_Telefono',
    'Nome',
    'Cognome',
    'Telefono',

    // Partenza
    '_service_Partenza',
    'Partenza da',

    // Quantità
    '_quantity',
];

// Campi da nascondere (HIDDEN)
const HIDDEN_KEYS = [
    '_product_type',
    '_reduced_stock',
    '_event_id',
    '_ttbm_id',
    '_ttbm_date',
    '_ttbm_hotel_info',
    '_ttbm_ticket_info',
    '_ttbm_user_info',
    '_ttbm_service_info',
    'Qty',
    'Prezzo',
    'Travel Data',
    'Travel Posizione',
];

// Alias da impostare: secondaryKey -> primaryKey
const ALIASES = {
    'Nome': '_field_Nome',
    'Cognome': '_field_Cognome',
    'Telefono': '_field_Telefono',
    'Partenza da': '_service_Partenza',
    'Codice Fiscale': '_field_Codice Fiscale',
    '_field_Codice fiscale': '_field_Codice Fiscale',
};

async function setDefaultFields() {
    console.log("=== CONFIGURAZIONE CAMPI DEFAULT ===\n");

    // 1. Set isDefaultSelected for main fields
    console.log("📌 Impostazione campi pre-selezionati...");
    for (const key of DEFAULT_SELECTED_KEYS) {
        const result = await prisma.wooExportConfig.updateMany({
            where: { fieldKey: key },
            data: { isDefaultSelected: true }
        });
        if (result.count > 0) {
            console.log(`   ✅ ${key} -> pre-selezionato`);
        }
    }

    // 2. Set HIDDEN for internal fields
    console.log("\n🚫 Nascondimento campi interni...");
    for (const key of HIDDEN_KEYS) {
        const result = await prisma.wooExportConfig.updateMany({
            where: { fieldKey: key },
            data: { mappingType: 'HIDDEN' }
        });
        if (result.count > 0) {
            console.log(`   ✅ ${key} -> nascosto`);
        }
    }

    // 3. Set aliases
    console.log("\n🔗 Impostazione alias...");
    for (const [secondary, primary] of Object.entries(ALIASES)) {
        const result = await prisma.wooExportConfig.updateMany({
            where: { fieldKey: secondary },
            data: { aliasOf: primary }
        });
        if (result.count > 0) {
            console.log(`   ✅ ${secondary} -> alias di ${primary}`);
        }
    }

    // 4. Summary
    const stats = await prisma.wooExportConfig.groupBy({
        by: ['mappingType'],
        _count: true
    });

    const defaultCount = await prisma.wooExportConfig.count({
        where: { isDefaultSelected: true }
    });

    const aliasCount = await prisma.wooExportConfig.count({
        where: { aliasOf: { not: null } }
    });

    console.log("\n=== RIEPILOGO ===");
    console.log(`Pre-selezionati: ${defaultCount}`);
    console.log(`Con alias: ${aliasCount}`);
    stats.forEach(s => {
        console.log(`${s.mappingType}: ${s._count}`);
    });

    await prisma.$disconnect();
    console.log("\n✅ Configurazione completata!");
}

setDefaultFields().catch(console.error);
