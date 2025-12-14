
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const items = await prisma.tipoViaggio.findMany({
            orderBy: { nome: 'asc' }
        });
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: "Errore recupero tipi viaggio" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nome } = body;

        if (!nome) {
            return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });
        }

        const item = await prisma.tipoViaggio.create({
            data: { nome }
        });

        return NextResponse.json(item);
    } catch (error) {
        return NextResponse.json({ error: "Errore creazione tipo viaggio" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "ID obbligatorio" }, { status: 400 });
        }

        await prisma.tipoViaggio.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Errore eliminazione" }, { status: 500 });
    }
}
