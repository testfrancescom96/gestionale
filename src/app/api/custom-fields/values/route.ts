import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST: Save/Update custom field value
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            fieldDefId,
            praticaId,
            clienteId,
            fornitoreId,
            value,
        } = body;

        // Validation
        if (!fieldDefId || !value) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Must have exactly one entity reference
        const entityRefs = [praticaId, clienteId, fornitoreId].filter(Boolean);
        if (entityRefs.length !== 1) {
            return NextResponse.json(
                { error: "Must specify exactly one entity reference" },
                { status: 400 }
            );
        }

        // Check if value already exists
        const existing = await prisma.customFieldValue.findFirst({
            where: {
                fieldDefId,
                ...(praticaId && { praticaId }),
                ...(clienteId && { clienteId }),
                ...(fornitoreId && { fornitoreId }),
            },
        });

        let fieldValue;

        if (existing) {
            // Update existing value
            fieldValue = await prisma.customFieldValue.update({
                where: { id: existing.id },
                data: { value },
            });
        } else {
            // Create new value
            fieldValue = await prisma.customFieldValue.create({
                data: {
                    fieldDefId,
                    value,
                    ...(praticaId && { praticaId }),
                    ...(clienteId && { clienteId }),
                    ...(fornitoreId && { fornitoreId }),
                },
            });
        }

        return NextResponse.json(fieldValue, { status: existing ? 200 : 201 });
    } catch (error) {
        console.error("Error saving custom field value:", error);
        return NextResponse.json(
            { error: "Failed to save custom field value" },
            { status: 500 }
        );
    }
}
