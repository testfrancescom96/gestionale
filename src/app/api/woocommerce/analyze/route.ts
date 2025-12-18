import { NextRequest, NextResponse } from "next/server";
import { fetchWooProducts, fetchWooOrders } from "@/lib/woocommerce";

// API di DEBUG per analizzare la struttura dei dati WooCommerce
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type") || "products"; // products | orders

    try {
        let sampleData: any = null;
        let allFields: Set<string> = new Set();
        let metaFields: Set<string> = new Set();

        if (type === "products") {
            const params = new URLSearchParams({ per_page: "10" });
            const { products } = await fetchWooProducts(params);

            // Analyze first product structure
            if (products.length > 0) {
                sampleData = products[0];

                // Collect all top-level fields
                Object.keys(products[0]).forEach(k => allFields.add(k));

                // Collect meta_data fields from all products
                products.forEach((p: any) => {
                    if (p.meta_data && Array.isArray(p.meta_data)) {
                        p.meta_data.forEach((m: any) => {
                            metaFields.add(m.key);
                        });
                    }
                });
            }
        } else if (type === "orders") {
            const params = new URLSearchParams({ per_page: "10", status: "any" });
            const { orders } = await fetchWooOrders(params);

            if (orders.length > 0) {
                sampleData = orders[0];

                // Top-level fields
                Object.keys(orders[0]).forEach(k => allFields.add(k));

                // Meta data from orders
                orders.forEach((o: any) => {
                    if (o.meta_data && Array.isArray(o.meta_data)) {
                        o.meta_data.forEach((m: any) => {
                            metaFields.add(m.key);
                        });
                    }

                    // Line items meta
                    if (o.line_items) {
                        o.line_items.forEach((item: any) => {
                            if (item.meta_data && Array.isArray(item.meta_data)) {
                                item.meta_data.forEach((m: any) => {
                                    metaFields.add(`line_item:${m.key}`);
                                });
                            }
                        });
                    }
                });
            }
        }

        return NextResponse.json({
            type,
            topLevelFields: Array.from(allFields).sort(),
            metaDataFields: Array.from(metaFields).sort(),
            sampleRecord: sampleData
        });

    } catch (error: any) {
        console.error("Error analyzing WooCommerce data:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
