import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Get all custom field values for a specific entity instance
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ entityType: string; entityId: string }> }
) {
    const { entityType, entityId } = await params;

    try {
        // Validate entity type
        const entityTypeUpper = entityType.toUpperCase();
        if (!["PRATICA", "CLIENTE", "FORNITORE"].includes(entityTypeUpper)) {
            return NextResponse.json(
                { error: "Invalid entity type" },
                { status: 400 }
            );
        }

        // Build where clause based on entity type
        const whereClause: any = {};
        if (entityTypeUpper === "PRATICA") {
            whereClause.praticaId = entityId;
        } else if (entityTypeUpper === "CLIENTE") {
            whereClause.clienteId = entityId;
        } else if (entityTypeUpper === "FORNITORE") {
            whereClause.fornitoreId = entityId;
        }

        const values = await prisma.customFieldValue.findMany({
            where: whereClause,
            include: {
                fieldDef: true,
            },
        });

        return NextResponse.json(values);
    } catch (error) {
        console.error("Error fetching custom field values:", error);
        return NextResponse.json(
            { error: "Failed to fetch custom field values" },
            { status: 500 }
        );
    }
}
