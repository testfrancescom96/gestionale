import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const capigruppo = await prisma.capogruppo.findMany({
            orderBy: [
                { cognome: 'asc' },
                { nome: 'asc' }
            ]
        });
        return NextResponse.json(capigruppo);
    } catch (error: any) {
        console.error("Errore GET capigruppo:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { nome, cognome, telefono, email, citta, tipo, note } = body;

        if (!nome || !cognome) {
            return NextResponse.json({ error: "Nome e cognome obbligatori" }, { status: 400 });
        }

        const capogruppo = await prisma.capogruppo.create({
            data: {
                nome,
                cognome,
                telefono: telefono || null,
                email: email || null,
                citta: citta || null,
                tipo: tipo || "CAPOGRUPPO",
                note: note || null
            }
        });

        return NextResponse.json(capogruppo);
    } catch (error: any) {
        console.error("Errore POST capigruppo:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
