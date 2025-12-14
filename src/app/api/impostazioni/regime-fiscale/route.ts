import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const items = await prisma.regimeFiscale.findMany({
            orderBy: { nome: 'asc' }
        });
        return NextResponse.json(items);
    } catch (error) {
        return NextResponse.json({ error: "Errore nel recupero dei regimi fiscali" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { nome } = body;

        if (!nome) {
            return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });
        }

        const newItem = await prisma.regimeFiscale.create({
            data: { nome }
        });

        return NextResponse.json(newItem);
    } catch (error) {
        return NextResponse.json({ error: "Errore nella creazione del regime fiscale" }, { status: 500 });
    }
}
