/**
 * Script: set-display-order.js
 * Imposta l'ordine di visualizzazione predefinito per i campi più comuni
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setDisplayOrder() {
    console.log('=== IMPOSTAZIONE ORDINE VISUALIZZAZIONE CAMPI ===\n');

    // Ordine predefinito: numeri bassi = prima
    const orderMap = {
        // Nome variants (ordine 1)
        'Nome': 1,
        '_field_Nome': 1,

        // Cognome variants (ordine 2)
        'Cognome': 2,
        '_field_Cognome': 2,

        // Telefono variants (ordine 3)
        'Telefono': 3,
        '_field_Telefono': 3,
        'Recapito telefonico': 3,
        'Recapito Telefonico': 3,

        // Email (ordine 4)
        'Email': 4,
        '_field_Email': 4,

        // Partenza variants (ordine 5)
        'Partenza': 5,
        'Partenza da': 5,
        'Partenza da:': 5,
        '_service_Partenza': 5,
        '_service_Partenze:': 5,
        'puntoPartenza': 5,

        // Codice Fiscale (ordine 6)
        'Codice Fiscale': 6,
        '_field_Codice Fiscale': 6,
        '_field_Codice fiscale': 6,
        '_billing_fiscalcode': 6,

        // Data di nascita (ordine 7)
        'Data di nascita': 7,
        '_field_Data di nascita': 7,
        '_field_Data di Nascita': 7,

        // Importo/Pagato/Saldo (ordine 8-10)
        'importo': 8,
        'pagato': 9,
        'saldo': 10,

        // Note (ordine 50)
        'note': 50,
        'Note': 50,
    };

    let updated = 0;

    for (const [fieldKey, order] of Object.entries(orderMap)) {
        try {
            const result = await prisma.wooExportConfig.updateMany({
                where: { fieldKey },
                data: { displayOrder: order }
            });
            if (result.count > 0) {
                console.log(`   ✅ ${fieldKey} -> ordine ${order}`);
                updated += result.count;
            }
        } catch (e) {
            // Campo non esiste, ignora
        }
    }

    console.log(`\n=== RIEPILOGO ===`);
    console.log(`Campi aggiornati: ${updated}`);
    console.log(`\n✅ Configurazione ordine completata!`);
}

setDisplayOrder()
    .then(() => prisma.$disconnect())
    .catch(e => {
        console.error(e);
        prisma.$disconnect();
        process.exit(1);
    });
