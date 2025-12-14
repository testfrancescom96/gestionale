import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { writeFile, mkdir, readdir, stat } from "fs/promises";

// GET: Lista documenti per una pratica
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const uploadDir = path.join(process.cwd(), "public/uploads/pratiche", id);

    try {
        await mkdir(uploadDir, { recursive: true });

        const files = await readdir(uploadDir);
        const documents = await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(uploadDir, file);
                const stats = await stat(filePath);
                return {
                    name: file,
                    size: stats.size,
                    createdAt: stats.birthtime,
                    url: `/uploads/pratiche/${id}/${file}`
                };
            })
        );

        return NextResponse.json(documents);
    } catch (error) {
        console.error("Errore lettura documenti:", error);
        return NextResponse.json({ error: "Errore lettura documenti" }, { status: 500 });
    }
}

// POST: Upload documento
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "Nessun file caricato" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), "public/uploads/pratiche", id);

        await mkdir(uploadDir, { recursive: true });

        // Sanitizza nome file
        const sanitizedParams = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = path.join(uploadDir, sanitizedParams);

        await writeFile(filePath, buffer);

        return NextResponse.json({ success: true, filename: sanitizedParams });
    } catch (error) {
        console.error("Errore upload:", error);
        return NextResponse.json({ error: "Errore durante il caricamento" }, { status: 500 });
    }
}
