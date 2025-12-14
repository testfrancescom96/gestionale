
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const items = await prisma.tipoFeedback.findMany({
            orderBy: { nome: 'asc' }
        });
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: "Errore nel recupero dei feedback" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { nome } = body;

        if (!nome) {
            return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });
        }

        const newItem = await prisma.tipoFeedback.create({
            data: { nome }
        });

        return NextResponse.json(newItem);
    } catch (error) {
        return NextResponse.json({ error: "Errore durante la creazione" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID mancante" }, { status: 400 });
        }

        await prisma.tipoFeedback.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Errore durante l'eliminazione" }, { status: 500 });
    }
}
