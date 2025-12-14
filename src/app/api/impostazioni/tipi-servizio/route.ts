
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const tipi = await prisma.tipoServizio.findMany({
            orderBy: { nome: 'asc' }
        });
        return NextResponse.json(tipi);
    } catch (error) {
        return NextResponse.json({ error: "Errore recupero tipi servizio" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nome, descrizione, defaultAliquota } = body;

        if (!nome) {
            return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });
        }

        const tipo = await prisma.tipoServizio.create({
            data: {
                nome,
                descrizione,
                defaultAliquota: defaultAliquota || null
            }
        });

        return NextResponse.json(tipo);
    } catch (error) {
        return NextResponse.json({ error: "Errore creazione tipo servizio" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "ID obbligatorio" }, { status: 400 });
        }

        await prisma.tipoServizio.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Errore eliminazione" }, { status: 500 });
    }
}
