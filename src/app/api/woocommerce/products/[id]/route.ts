import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const body = await request.json();

        // Allowed fields to update
        const updateData: any = {};

        if (typeof body.isPinned === 'boolean') {
            updateData.isPinned = body.isPinned;
        }

        // If no valid fields, return error or empty
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const product = await prisma.wooProduct.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(product);

    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json(
            { error: "Failed to update product" },
            { status: 500 }
        );
    }
}
