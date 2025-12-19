
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function restore() {
    console.log("Starting restore from backup...");

    const backupPath = path.join(process.cwd(), "backup_data.json");
    if (!fs.existsSync(backupPath)) {
        console.error("Backup file not found:", backupPath);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

    // 1. Clienti
    if (data.clienti && data.clienti.length > 0) {
        for (const c of data.clienti) {
            await prisma.cliente.upsert({
                where: { id: c.id },
                update: c,
                create: c
            });
        }
        console.log(`Restored ${data.clienti.length} Clienti`);
    }

    // 2. Fornitori
    if (data.fornitori && data.fornitori.length > 0) {
        for (const f of data.fornitori) {
            await prisma.fornitore.upsert({
                where: { id: f.id },
                update: f,
                create: f
            });
        }
        console.log(`Restored ${data.fornitori.length} Fornitori`);
    }

    // 3. Pratiche (base only - relations restored via app usage)
    if (data.pratiche && data.pratiche.length > 0) {
        for (const p of data.pratiche) {
            // Estrai le relazioni - li saltiamo per evitare errori
            const { partecipanti, costi, pagamenti, documenti, movimentiBancari, fattureVendita, fattureAcquisto, customFields, ...praticaData } = p;

            await prisma.pratica.upsert({
                where: { id: praticaData.id },
                update: praticaData,
                create: praticaData
            });
        }
        console.log(`Restored ${data.pratiche.length} Pratiche`);
    }

    // 4. WooProducts
    if (data.wooProducts && data.wooProducts.length > 0) {
        for (const wp of data.wooProducts) {
            const { operational, orderItems, manualBookings, ...productData } = wp;
            await prisma.wooProduct.upsert({
                where: { id: productData.id },
                update: productData,
                create: productData
            });
            if (operational) {
                await prisma.productOperational.upsert({
                    where: { productId: operational.productId },
                    update: operational,
                    create: operational
                });
            }
        }
        console.log(`Restored ${data.wooProducts.length} WooProducts`);
    }

    // 5. Orders (Cache)
    if (data.wooOrders && data.wooOrders.length > 0) {
        for (const o of data.wooOrders) {
            await prisma.wooOrder.upsert({
                where: { id: o.id },
                update: o,
                create: o
            });
        }
        console.log(`Restored ${data.wooOrders.length} WooOrders`);
    }

    if (data.wooOrderItems && data.wooOrderItems.length > 0) {
        for (const oi of data.wooOrderItems) {
            await prisma.wooOrderItem.upsert({
                where: { id: oi.id },
                update: oi,
                create: oi
            });
        }
        console.log(`Restored ${data.wooOrderItems.length} WooOrderItems`);
    }

    // 6. Manual Bookings
    if (data.manualBookings && data.manualBookings.length > 0) {
        for (const mb of data.manualBookings) {
            await prisma.manualBooking.upsert({
                where: { id: mb.id },
                update: mb,
                create: mb
            });
        }
        console.log(`Restored ${data.manualBookings.length} ManualBookings`);
    }

    // 7. Settings
    if (data.systemSettings && data.systemSettings.length > 0) {
        for (const s of data.systemSettings) {
            await prisma.systemSettings.upsert({
                where: { id: s.id },
                update: s,
                create: s
            });
        }
    }
    if (data.wooExportConfig && data.wooExportConfig.length > 0) {
        for (const c of data.wooExportConfig) {
            await prisma.wooExportConfig.upsert({
                where: { id: c.id },
                update: c,
                create: c
            });
        }
    }
    console.log("Restored Settings");

    console.log("Restore complete!");
}

restore()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
