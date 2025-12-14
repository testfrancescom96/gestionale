import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wooProductId, dataViaggio, ...data } = body;

        if (!wooProductId) {
            return NextResponse.json({ error: "WooProductId is required" }, { status: 400 });
        }

        // Upsert logic: Create if new, Update if exists
        // @ts-ignore
        const viaggioOperativo = await prisma.viaggioOperativo.upsert({
            where: {
                wooProductId: parseInt(wooProductId)
            },
            update: {
                ...data, // confermato, inForse, etc.
                dataViaggio: dataViaggio ? new Date(dataViaggio) : undefined,
            },
            create: {
                wooProductId: parseInt(wooProductId),
                dataViaggio: dataViaggio ? new Date(dataViaggio) : undefined,
                ...data
            }
        });

        return NextResponse.json({ success: true, viaggioOperativo });
    } catch (error: any) {
        console.error("Error saving ViaggioOperativo:", error);
        return NextResponse.json(
            { error: error.message || "Failed to save workflow" },
            { status: 500 }
        );
    }
}
