import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const thisYear = now.getFullYear();
        const lastYear = thisYear - 1;

        // Stats ultimi 30 giorni
        const [
            praticheRecenti,
            praticheConfermate,
            ordiniWoo,
            clientiNuovi,
            praticheTotaliAnno,
            praticheAnnoScorso,
            totaleVenditeAnno,
            totaleVenditeAnnoScorso
        ] = await Promise.all([
            // Pratiche create negli ultimi 30 giorni
            prisma.pratica.count({
                where: { createdAt: { gte: thirtyDaysAgo } }
            }),
            // Pratiche confermate ultimi 30 giorni
            prisma.pratica.count({
                where: {
                    stato: "CONFERMATO",
                    createdAt: { gte: thirtyDaysAgo }
                }
            }),
            // Ordini WooCommerce (ultimi 30 giorni)
            prisma.wooOrder.count({
                where: { dateCreated: { gte: thirtyDaysAgo } }
            }),
            // Nuovi clienti ultimi 30 giorni
            prisma.cliente.count({
                where: { createdAt: { gte: thirtyDaysAgo } }
            }),
            // Pratiche anno corrente
            prisma.pratica.count({
                where: {
                    createdAt: {
                        gte: new Date(`${thisYear}-01-01`),
                        lt: new Date(`${thisYear + 1}-01-01`)
                    }
                }
            }),
            // Pratiche anno scorso
            prisma.pratica.count({
                where: {
                    createdAt: {
                        gte: new Date(`${lastYear}-01-01`),
                        lt: new Date(`${thisYear}-01-01`)
                    }
                }
            }),
            // Fatturato anno corrente
            prisma.pratica.aggregate({
                where: {
                    stato: "CONFERMATO",
                    createdAt: {
                        gte: new Date(`${thisYear}-01-01`),
                        lt: new Date(`${thisYear + 1}-01-01`)
                    }
                },
                _sum: { prezzoVendita: true }
            }),
            // Fatturato anno scorso
            prisma.pratica.aggregate({
                where: {
                    stato: "CONFERMATO",
                    createdAt: {
                        gte: new Date(`${lastYear}-01-01`),
                        lt: new Date(`${thisYear}-01-01`)
                    }
                },
                _sum: { prezzoVendita: true }
            })
        ]);

        // Calcola conversioni (pratiche confermate / totale)
        const conversionRate = praticheRecenti > 0
            ? ((praticheConfermate / praticheRecenti) * 100).toFixed(1)
            : "0";

        // Trend anno su anno
        const trendPratiche = praticheAnnoScorso > 0
            ? (((praticheTotaliAnno - praticheAnnoScorso) / praticheAnnoScorso) * 100).toFixed(1)
            : "100";

        const fatturatoAnno = totaleVenditeAnno._sum.prezzoVendita || 0;
        const fatturatoAnnoScorso = totaleVenditeAnnoScorso._sum.prezzoVendita || 0;
        const trendFatturato = fatturatoAnnoScorso > 0
            ? (((fatturatoAnno - fatturatoAnnoScorso) / fatturatoAnnoScorso) * 100).toFixed(1)
            : "100";

        // Top destinazioni (ultimi 30 giorni)
        const topDestinazioni = await prisma.pratica.groupBy({
            by: ['destinazione'],
            where: {
                createdAt: { gte: thirtyDaysAgo },
                destinazione: { not: "" }
            },
            _count: true,
            orderBy: { _count: { destinazione: 'desc' } },
            take: 5
        });

        // Distribuzione stati pratiche
        const statoDistribuzione = await prisma.pratica.groupBy({
            by: ['stato'],
            where: { createdAt: { gte: thirtyDaysAgo } },
            _count: true
        });

        return NextResponse.json({
            // KPI ultimi 30 giorni
            ultimi30giorni: {
                praticheCreate: praticheRecenti,
                praticheConfermate,
                ordiniWoo,
                clientiNuovi,
                conversionRate: parseFloat(conversionRate)
            },
            // Anno corrente vs anno scorso
            annuale: {
                pratiche: praticheTotaliAnno,
                praticheAnnoScorso,
                trendPratiche: parseFloat(trendPratiche),
                fatturato: fatturatoAnno,
                fatturatoAnnoScorso,
                trendFatturato: parseFloat(trendFatturato)
            },
            // Analisi
            topDestinazioni: topDestinazioni.map(d => ({
                destinazione: d.destinazione,
                count: d._count
            })),
            statoDistribuzione: statoDistribuzione.map(s => ({
                stato: s.stato,
                count: s._count
            }))
        });

    } catch (error) {
        console.error("Errore stats business:", error);
        return NextResponse.json({ error: "Errore" }, { status: 500 });
    }
}
