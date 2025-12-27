
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type"); // SENT | RECEIVED
        const status = searchParams.get("status"); // PAID | UNPAID

        // Build filter
        const where: any = {};
        if (type) where.type = type;
        if (status) where.status = status;

        // @ts-ignore: Prisma types lag
        const invoices = await prisma.invoice.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                cliente: true // Include linked customer if any
            }
        });

        return NextResponse.json(invoices);
    } catch (error: any) {
        console.error("Error fetching invoices:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
