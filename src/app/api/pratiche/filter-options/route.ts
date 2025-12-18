import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Get unique operatori
        const operatoriResult = await prisma.pratica.findMany({
            select: { operatore: true },
            distinct: ['operatore'],
            where: { operatore: { not: "" } }
        });

        // Get unique tipologie
        const tipologieResult = await prisma.pratica.findMany({
            select: { tipologia: true },
            distinct: ['tipologia'],
            where: { tipologia: { not: "" } }
        });

        // Get unique destinazioni
        const destinazioniResult = await prisma.pratica.findMany({
            select: { destinazione: true },
            distinct: ['destinazione'],
            where: { destinazione: { not: "" } },
            orderBy: { destinazione: 'asc' }
        });

        return NextResponse.json({
            operatori: operatoriResult.map(o => o.operatore).filter(Boolean),
            tipologie: tipologieResult.map(t => t.tipologia).filter(Boolean),
            destinazioni: destinazioniResult.map(d => d.destinazione).filter(Boolean)
        });

    } catch (error: any) {
        console.error("Errore filter-options:", error);
        return NextResponse.json({ operatori: [], tipologie: [], destinazioni: [] });
    }
}
