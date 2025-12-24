import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Fetching last 20 order items...");
        const orderCount = await prisma.wooOrder.count();
        const itemCount = await prisma.wooOrderItem.count();
        console.log(`Total Orders in DB: ${orderCount}`);
        console.log(`Total Order Items in DB: ${itemCount}`);

        const items = await prisma.wooOrderItem.findMany({
            take: 5,
            orderBy: { id: 'desc' },
            include: { order: true }
        });

        console.log(`Found ${items.length} items. Analyzing metadata...`);
        console.log("---------------------------------------------------");

        for (const item of items) {
            console.log(`\nProd: ${item.productName} (Order #${item.orderId})`);
            console.log(`Total: ${item.total} | Tax: ${item.totalTax}`);

            if (item.metaData) {
                try {
                    const meta = JSON.parse(item.metaData);
                    if (Array.isArray(meta)) {
                        meta.forEach((m: any) => {
                            // Filter out uninteresting standard woo fields to reduce noise if needed, 
                            // but for now we want everything to see plugins.
                            // Standard variations usually have keys like "pa_color" or just "Color"
                            console.log(`   - [${m.key}] (${m.display_key}): ${m.value}`);
                        });
                    } else {
                        console.log("   Metadata is object:", meta);
                    }
                } catch (e) {
                    console.log("   Metadata JSON parse error");
                }
            } else {
                console.log("   No metadata");
            }
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
