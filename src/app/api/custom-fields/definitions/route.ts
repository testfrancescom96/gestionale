import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: List all field definitions
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const entity = searchParams.get("entity"); // Filter by PRATICA, CLIENTE, FORNITORE
    const isGlobal = searchParams.get("global"); // Filter by global/local

    try {
        const definitions = await prisma.customFieldDefinition.findMany({
            where: {
                ...(entity && { entity }),
                ...(isGlobal !== null && { isGlobal: isGlobal === "true" }),
            },
            orderBy: [
                { isGlobal: "desc" }, // Global first
                { createdAt: "asc" },
            ],
        });

        return NextResponse.json(definitions);
    } catch (error) {
        console.error("Error fetching custom field definitions:", error);
        return NextResponse.json(
            { error: "Failed to fetch custom field definitions" },
            { status: 500 }
        );
    }
}

// POST: Create new field definition
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            entity,
            fieldName,
            fieldType,
            label,
            isGlobal = true,
            isRequired = false,
            options,
            createdBy,
        } = body;

        // Validation
        if (!entity || !fieldName || !fieldType || !label || !createdBy) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (!["PRATICA", "CLIENTE", "FORNITORE"].includes(entity)) {
            return NextResponse.json(
                { error: "Invalid entity type" },
                { status: 400 }
            );
        }

        if (!["TEXT", "NUMBER", "DATE", "SELECT", "TEXTAREA"].includes(fieldType)) {
            return NextResponse.json(
                { error: "Invalid field type" },
                { status: 400 }
            );
        }

        // Create field definition
        const definition = await prisma.customFieldDefinition.create({
            data: {
                entity,
                fieldName,
                fieldType,
                label,
                isGlobal,
                isRequired,
                options: options ? JSON.stringify(options) : null,
                createdBy,
            },
        });

        return NextResponse.json(definition, { status: 201 });
    } catch (error: any) {
        console.error("Error creating custom field definition:", error);

        // Handle unique constraint violation
        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "Field name already exists for this entity" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create custom field definition" },
            { status: 500 }
        );
    }
}
