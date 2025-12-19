
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function backup() {
    console.log("Starting backup...");

    const data = {};

    // 1. Clienti
    data.clienti = await prisma.cliente.findMany();
    console.log(`Backed up ${data.clienti.length} Clienti`);

    // 2. Fornitori
    data.fornitori = await prisma.fornitore.findMany();
    console.log(`Backed up ${data.fornitori.length} Fornitori`);

    // 3. Pratiche (e correlati base)
    data.pratiche = await prisma.pratica.findMany({
        include: {
            partecipanti: true,
            costi: true,
            pagamenti: true,
            documenti: true,
            movimentiBancari: true,
            fattureVendita: true,
            fattureAcquisto: true,
            customFields: true
        }
    });
    console.log(`Backed up ${data.pratiche.length} Pratiche`);

    // 4. WooProduct
    data.wooProducts = await prisma.wooProduct.findMany({
        include: {
            operational: true,
            orderItems: true,
            manualBookings: true
        }
    });
    console.log(`Backed up ${data.wooProducts.length} WooProducts`);

    // 5. Settings / Config
    data.systemSettings = await prisma.systemSettings.findMany();
    data.wooExportConfig = await prisma.wooExportConfig.findMany();
    console.log("Backed up Settings");

    // 6. Manual Bookings & Order Items
    data.manualBookings = await prisma.manualBooking.findMany();
    console.log(`Backed up ${data.manualBookings.length} Manual Bookings`);

    // Cache
    data.wooOrders = await prisma.wooOrder.findMany();
    data.wooOrderItems = await prisma.wooOrderItem.findMany();
    console.log(`Backed up Orders (Cache)`);

    // Save to file
    const backupPath = path.join(process.cwd(), "backup_data.json");
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));

    console.log(`Backup saved to ${backupPath}`);
}

backup()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
