import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        // Fetch last 10 order items with their metadata
        const items = await prisma.wooOrderItem.findMany({
            take: 20,
            orderBy: { id: 'desc' },
            include: {
                order: true
            },
            where: {
                order: {
                    status: { in: ['processing', 'completed'] }
                }
            }
        });

        const analysis = items.map(item => {
            let meta = [];
            try {
                meta = item.metaData ? JSON.parse(item.metaData) : [];
            } catch (e) {
                meta = [{ error: "Invalid JSON", raw: item.metaData }];
            }

            return {
                orderId: item.orderId,
                productName: item.productName,
                total: item.total,
                metaDataKeys: Array.isArray(meta) ? meta.map((m: any) => ({
                    key: m.key,
                    display_key: m.display_key,
                    value: m.value,
                    display_value: m.display_value
                })) : meta
            };
        });

        return NextResponse.json({
            count: analysis.length,
            items: analysis
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
