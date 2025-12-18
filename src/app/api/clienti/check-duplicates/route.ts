import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const cf = searchParams.get("cf");
    const cognome = searchParams.get("cognome");

    try {
        // Check for duplicate CF
        if (cf && cf.length >= 10) {
            const existing = await prisma.cliente.findFirst({
                where: { codiceFiscale: cf },
                select: {
                    id: true,
                    nome: true,
                    cognome: true,
                    codiceFiscale: true
                }
            });

            if (existing) {
                return NextResponse.json({
                    cfDuplicate: existing
                });
            }
        }

        // Search clients by cognome for suggestions
        if (cognome && cognome.length >= 2) {
            const matches = await prisma.cliente.findMany({
                where: {
                    cognome: { contains: cognome }
                },
                select: {
                    id: true,
                    nome: true,
                    cognome: true,
                    codiceFiscale: true,
                    telefono: true
                },
                take: 10,
                orderBy: { cognome: 'asc' }
            });

            return NextResponse.json({
                cognomeSuggestions: matches
            });
        }

        return NextResponse.json({ cfDuplicate: null, cognomeSuggestions: [] });

    } catch (error: any) {
        console.error("Errore check duplicati:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
