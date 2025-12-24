import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const endOfYear = new Date(currentYear + 1, 0, 1);

        // 1. Fatturato per mese (ultimi 12 mesi)
        const pratichePerMese = await prisma.$queryRaw<{ mese: number; totale: number; count: number }[]>`
            SELECT 
                CAST(EXTRACT(MONTH FROM "dataRichiesta") AS INTEGER) as mese,
                SUM(COALESCE("prezzoVendita", 0)) as totale,
                COUNT(*) as count
            FROM "Pratica"
            WHERE "dataRichiesta" >= ${startOfYear}::timestamp
            AND "dataRichiesta" < ${endOfYear}::timestamp
            AND "stato" != 'ANNULLATA'
            GROUP BY EXTRACT(MONTH FROM "dataRichiesta")
            ORDER BY mese
        `;

        // ... (intermediate code preserved implicitly, but I need to be careful not to overwrite the middle if possible, but replace_file_content replaces a block)
        // Since I need to replace two separate blocks, I should use multi_replace or big block.
        // Actually, the previous tool call viewed the whole file.
        // I will use replace_file_content for the whole file or large chunk to ensure correctness.
        // Or better, use multi_replace_file_content.

        // Wait, startOfYear.toISOString() in raw query parameter might be passed as string. 
        // Prisma raw query params automatically handle types but for Postgres explicit cast might be safer or just passing Date object.
        // Prisma supports passing Date objects directly in template tags.
        // In the original code: ${startOfYear.toISOString()} was used.
        // I will switch to passing Date objects directly which is better supported by Prisma Client.

        // Let's use multi_replace.

        // 2. Clienti per città
        const clientiPerCitta = await prisma.cliente.groupBy({
            by: ['citta'],
            where: {
                citta: { not: null }
            },
            _count: true,
            orderBy: { _count: { citta: 'desc' } },
            take: 10
        });

        // 3. Top destinazioni
        const topDestinazioni = await prisma.pratica.groupBy({
            by: ['destinazione'],
            where: {
                dataRichiesta: { gte: startOfYear, lt: endOfYear },
                destinazione: { not: "" }
            },
            _count: true,
            _sum: { prezzoVendita: true },
            orderBy: { _count: { destinazione: 'desc' } },
            take: 10
        });

        // 4. Tipologie viaggio
        const tipologie = await prisma.pratica.groupBy({
            by: ['tipologia'],
            where: {
                dataRichiesta: { gte: startOfYear, lt: endOfYear }
            },
            _count: true,
            _sum: { prezzoVendita: true }
        });

        // 5. Operatori performance
        const operatori = await prisma.pratica.groupBy({
            by: ['operatore'],
            where: {
                dataRichiesta: { gte: startOfYear, lt: endOfYear },
                stato: "CONFERMATO"
            },
            _count: true,
            _sum: { prezzoVendita: true, margineCalcolato: true }
        });

        // 6. Ordini WooCommerce per mese
        const ordiniPerMese = await prisma.$queryRaw<{ mese: number; totale: number; count: number }[]>`
            SELECT 
                CAST(EXTRACT(MONTH FROM "dateCreated") AS INTEGER) as mese,
                SUM("total") as totale,
                COUNT(*) as count
            FROM "WooOrder"
            WHERE "dateCreated" >= ${startOfYear}::timestamp
            AND "dateCreated" < ${endOfYear}::timestamp
            AND "status" IN ('completed', 'processing')
            GROUP BY EXTRACT(MONTH FROM "dateCreated")
            ORDER BY mese
        `;

        // Formatta dati per grafici
        const mesiNomi = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];

        const fatturatoMensile = mesiNomi.map((nome, i) => {
            const pratica = pratichePerMese.find(p => p.mese === i + 1);
            const ordine = ordiniPerMese.find(o => o.mese === i + 1);
            return {
                mese: nome,
                agenzia: pratica?.totale || 0,
                online: ordine?.totale || 0,
                praticheCount: pratica?.count || 0,
                ordiniCount: ordine?.count || 0
            };
        });

        return NextResponse.json({
            fatturatoMensile,
            clientiPerCitta: clientiPerCitta.map(c => ({
                citta: c.citta || "Non specificato",
                count: c._count
            })),
            topDestinazioni: topDestinazioni.map(d => ({
                destinazione: d.destinazione,
                count: d._count,
                fatturato: d._sum.prezzoVendita || 0
            })),
            tipologie: tipologie.map(t => ({
                tipologia: t.tipologia,
                count: t._count,
                fatturato: t._sum.prezzoVendita || 0
            })),
            operatori: operatori.map(o => ({
                operatore: o.operatore,
                pratiche: o._count,
                fatturato: o._sum.prezzoVendita || 0,
                margine: o._sum.margineCalcolato || 0
            }))
        });

    } catch (error: any) {
        console.error("Errore stats avanzate:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
