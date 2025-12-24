const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyzeOrders() {
    const orderIds = [27352, 27439];

    for (const orderId of orderIds) {
        console.log(`\n========== ORDINE #${orderId} ==========`);

        const order = await prisma.wooOrder.findUnique({
            where: { id: orderId },
            include: { lineItems: true }
        });

        if (!order) {
            console.log(`Ordine ${orderId} non trovato nel database`);
            continue;
        }

        console.log(`Status: ${order.status}`);
        console.log(`Totale Ordine: ${order.total}`);
        console.log(`Cliente: ${order.billingFirstName} ${order.billingLastName}`);

        console.log(`\n--- Line Items (${order.lineItems.length}) ---`);
        for (const item of order.lineItems) {
            console.log(`\nProdotto: ${item.productName}`);
            console.log(`  Quantita: ${item.quantity}`);
            console.log(`  Total (netto DB): ${item.total}`);
            console.log(`  TotalTax (DB): ${item.totalTax || 0}`);
            console.log(`  Lordo calc (total + tax): ${(item.total || 0) + (item.totalTax || 0)}`);
            console.log(`  Lordo vecchio (total * 1.10): ${((item.total || 0) * 1.10).toFixed(3)}`);
        }
    }

    await prisma.$disconnect();
}

analyzeOrders().catch(console.error);
