import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        // Fetch from LOCAL DB
        const orders = await prisma.wooOrder.findMany({
            include: {
                lineItems: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                dateCreated: 'desc'
            }
        });

        // Map to match structure vaguely if needed, but the frontend lists orders. 
        // We might need to map billing flattened fields to nested object if frontend expects `billing: { ... }`
        const mappedOrders = orders.map(o => ({
            ...o,
            billing: {
                first_name: o.billingFirstName,
                last_name: o.billingLastName,
                email: o.billingEmail,
                phone: o.billingPhone,
                address_1: o.billingAddress,
                city: o.billingCity
            },
            line_items: o.lineItems.map(l => ({
                id: l.id,
                name: l.productName,
                product_id: l.wooProductId,
                quantity: l.quantity,
                total: l.total.toString() // Woo API sends string often, but number is fine usually.
            }))
        }));

        return NextResponse.json({
            orders: mappedOrders,
            total: orders.length,
            source: 'local_cache'
        });

    } catch (error: any) {
        console.error("Error fetching Local Woo orders:", error);
        return NextResponse.json(
            { error: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}
