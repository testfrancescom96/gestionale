
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function backup() {
    console.log("Starting backup...");

    const data: any = {};

    // 1. Clienti
    data.clienti = await prisma.cliente.findMany();
    console.log(`Backed up ${data.clienti.length} Clienti`);

    // 2. Fornitori
    data.fornitori = await prisma.fornitore.findMany();
    console.log(`Backed up ${data.fornitori.length} Fornitori`);

    // 3. Pratiche (e correlati base)
    data.pratiche = await prisma.pratica.findMany({
        include: {
            passeggeri: true
        }
    });
    console.log(`Backed up ${data.pratiche.length} Pratiche`);

    // 4. WooProduct (Local Cache + Metadata like lastBookingAt, isPinned)
    // Important: We need to preserve local metadata even if we could re-fetch products.
    data.wooProducts = await prisma.wooProduct.findMany({
        include: {
            operational: true,
            wooExportConfig: false // This is distinct settings, handle separately
        }
    });
    console.log(`Backed up ${data.wooProducts.length} WooProducts`);

    // 5. Settings / Config
    data.wooSettings = await prisma.wooSettings.findMany();
    data.wooExportConfig = await prisma.wooExportConfig.findMany();
    console.log("Backed up Settings");

    // 6. Manual Bookings & Order Items?
    // Start afresh with Orders sync usually safer, BUT we have MANUAL BOOKINGS which are local-only!
    // We MUST backup ManualBookings.
    data.manualBookings = await prisma.manualBooking.findMany();
    console.log(`Backed up ${data.manualBookings.length} Manual Bookings`);

    // OrderItems are cache. We could skip, but cleaner to keep everything if possible.
    // Let's dump them to be safe, but re-sync might be better for consistency.
    // Let's dump them.
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
