import dotenv from 'dotenv';
dotenv.config();

// Keys from src/lib/woocommerce.ts logic (hardcoded there, so hardcoding here for consistency/speed in debug script)
const WOO_URL = "https://www.goontheroad.it";
const WOO_CK = "ck_8564a77bc2541057ecccba217959e4ce6cbc1b76";
const WOO_CS = "cs_ad880ebbdb8a5cffeadf669f9e45023b5ce0d579";

async function main() {
    try {
        console.log("Fetching last 5 orders from WooCommerce API...");

        const params = new URLSearchParams({
            consumer_key: WOO_CK,
            consumer_secret: WOO_CS,
            per_page: "5"
        });

        const response = await fetch(`${WOO_URL}/wp-json/wc/v3/orders?${params.toString()}`, {
            headers: {
                "Content-Type": "application/json",
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const orders: any[] = await response.json();

        console.log(`Fetched ${orders.length} orders.`);
        console.log("---------------------------------------------------");

        for (const order of orders) {
            console.log(`Order #${order.id} - Status: ${order.status}`);
            for (const item of order.line_items) {
                console.log(`  Product: ${item.name} (Total: ${item.total})`);
                console.log("  Meta Data:");
                item.meta_data.forEach((m: any) => {
                    console.log(`    - key: ${m.key}`);
                    console.log(`      value: ${m.value}`);
                    console.log(`      display_key: ${m.display_key}`);
                    console.log(`      display_value: ${m.display_value}`);
                });
                console.log("");
            }
            console.log("---------------------------------------------------");
        }

    } catch (e: any) {
        console.error("Error fetching from WooCommerce:", e.message || e);
    }
}

main();
