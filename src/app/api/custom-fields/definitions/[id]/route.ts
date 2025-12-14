import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// PUT: Update field definition
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await request.json();
        const {
            label,
            isGlobal,
            isRequired,
            options,
        } = body;

        const definition = await prisma.customFieldDefinition.update({
            where: { id },
            data: {
                ...(label !== undefined && { label }),
                ...(isGlobal !== undefined && { isGlobal }),
                ...(isRequired !== undefined && { isRequired }),
                ...(options !== undefined && { options: options ? JSON.stringify(options) : null }),
            },
        });

        return NextResponse.json(definition);
    } catch (error) {
        console.error("Error updating custom field definition:", error);
        return NextResponse.json(
            { error: "Failed to update custom field definition" },
            { status: 500 }
        );
    }
}

// DELETE: Delete field definition (and all values)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        await prisma.customFieldDefinition.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting custom field definition:", error);
        return NextResponse.json(
            { error: "Failed to delete custom field definition" },
            { status: 500 }
        );
    }
}
