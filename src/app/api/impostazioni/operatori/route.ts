
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        // @ts-ignore
        const operatori = await prisma.operatore.findMany({
            orderBy: { nome: 'asc' }
        });
        return NextResponse.json(operatori);
    } catch (error) {
        return NextResponse.json({ error: "Errore recupero operatori" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.nome) {
            return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });
        }

        // @ts-ignore
        const operatore = await prisma.operatore.create({
            data: {
                nome: body.nome.toUpperCase(),
                email: body.email,
            }
        });

        return NextResponse.json(operatore);
    } catch (error) {
        return NextResponse.json({ error: "Errore creazione operatore" }, { status: 500 });
    }
}
