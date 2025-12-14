
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const aliquote = await prisma.aliquotaIva.findMany({
            orderBy: { valore: 'asc' }
        });
        return NextResponse.json(aliquote);
    } catch (error) {
        return NextResponse.json({ error: "Errore recupero aliquote iva" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { valore, descrizione } = body;

        if (!valore) {
            return NextResponse.json({ error: "Valore obbligatorio" }, { status: 400 });
        }

        const aliquota = await prisma.aliquotaIva.create({
            data: { valore, descrizione }
        });

        return NextResponse.json(aliquota);
    } catch (error) {
        return NextResponse.json({ error: "Errore creazione aliquota" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "ID obbligatorio" }, { status: 400 });
        }

        await prisma.aliquotaIva.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Errore eliminazione" }, { status: 500 });
    }
}
