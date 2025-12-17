import { prisma } from "@/lib/db";
import { DollarSign, TrendingUp, Briefcase, ShoppingBag, PieChart } from "lucide-react";
import { getWooCommerceRevenue } from "@/lib/woocommerce";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
    const currenYear = new Date().getFullYear();
    const startDate = new Date(currenYear, 0, 1);
    const endDate = new Date(currenYear + 1, 0, 1);

    // 1. Fetch Internal Data (Prisma)
    const totalPratiche = await prisma.pratica.count({
        where: {
            dataRichiesta: {
                gte: startDate,
                lt: endDate,
            },
            NOT: { stato: "ANNULLATA" }
        }
    });

    const aggregati = await prisma.pratica.aggregate({
        where: {
            dataRichiesta: {
                gte: startDate,
                lt: endDate,
            },
            NOT: { stato: "ANNULLATA" }
        },
        _sum: {
            prezzoVendita: true,
            margineCalcolato: true,
        }
    });

    const volumeAffariAgenzia = aggregati._sum.prezzoVendita || 0;
    const margineAgenzia = aggregati._sum.margineCalcolato || 0;

    // 2. Fetch External Data (WooCommerce)
    let wooRevenue = 0;
    let wooCount = 0;
    try {
        const wooData = await getWooCommerceRevenue(currenYear);
        wooRevenue = wooData.revenue;
        wooCount = wooData.count;
    } catch (e) {
        console.error("Failed to load Woo Report", e);
    }

    // 3. Totals
    const volumeAffariTotale = volumeAffariAgenzia + wooRevenue;
    const margineTotale = margineAgenzia; // Woo doesn't give us margin explicitly without COGS logic, counting purely as Revenue for now, or separately?
    // Using Margin only for Agency for now as logical safe step.

    const percentualeMargineAgenzia = volumeAffariAgenzia > 0 ? (margineAgenzia / volumeAffariAgenzia) * 100 : 0;

    return (
        <div className="p-8">
            <h1 className="mb-6 text-3xl font-bold text-gray-900">Report Finanziario {currenYear}</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {/* Card Volume Affari TOTALE */}
                <div className="overflow-hidden rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 lg:col-span-2">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-blue-100 p-3">
                            <PieChart className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Fatturato Complessivo (Agenzia + Online)</p>
                            <p className="text-3xl font-bold text-gray-900">€ {volumeAffariTotale.toFixed(2)}</p>
                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                                <span>Agenzia: <strong>€ {volumeAffariAgenzia.toFixed(2)}</strong></span>
                                <span>Online: <strong>€ {wooRevenue.toFixed(2)}</strong></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card Margine (Solo Agenzia per ora) */}
                <div className="overflow-hidden rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-green-100 p-3">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Margine Agenzia</p>
                            <p className="text-2xl font-bold text-gray-900">
                                € {margineTotale.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                                Resa: {percentualeMargineAgenzia.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card Totale Pratiche + Ordini */}
                <div className="overflow-hidden rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-purple-100 p-3">
                            <Briefcase className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pratiche & Ordini</p>
                            <p className="text-2xl font-bold text-gray-900">{totalPratiche + wooCount}</p>
                            <p className="text-xs text-gray-500">{totalPratiche} interne + {wooCount} online</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Dettaglio Agenzia */}
                <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-gray-400" />
                        Dettaglio Agenzia
                    </h3>
                    <dl className="divide-y divide-gray-100">
                        <div className="flex justify-between py-3">
                            <dt className="text-sm text-gray-500">Pratiche Gestite</dt>
                            <dd className="text-sm font-medium text-gray-900">{totalPratiche}</dd>
                        </div>
                        <div className="flex justify-between py-3">
                            <dt className="text-sm text-gray-500">Volume Traffico</dt>
                            <dd className="text-sm font-medium text-gray-900">€ {volumeAffariAgenzia.toFixed(2)}</dd>
                        </div>
                        <div className="flex justify-between py-3">
                            <dt className="text-sm text-gray-500">Margine Operativo</dt>
                            <dd className="text-sm font-medium text-gray-900">€ {margineAgenzia.toFixed(2)}</dd>
                        </div>
                        <div className="flex justify-between py-3 bg-gray-50 -mx-6 px-6">
                            <dt className="text-sm font-medium text-gray-900">Stima Netto IVA (74ter)</dt>
                            <dd className="text-sm font-bold text-green-600">€ {(margineAgenzia / 1.22).toFixed(2)}</dd>
                        </div>
                    </dl>
                </div>

                {/* Dettaglio E-Commerce */}
                <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-gray-400" />
                        Dettaglio E-Commerce
                    </h3>
                    <dl className="divide-y divide-gray-100">
                        <div className="flex justify-between py-3">
                            <dt className="text-sm text-gray-500">Ordini Totali (Completed)</dt>
                            <dd className="text-sm font-medium text-gray-900">{wooCount}</dd>
                        </div>
                        <div className="flex justify-between py-3">
                            <dt className="text-sm text-gray-500">Incasso Lordo</dt>
                            <dd className="text-sm font-medium text-gray-900">€ {wooRevenue.toFixed(2)}</dd>
                        </div>
                        <div className="flex justify-between py-3">
                            <dt className="text-sm text-gray-500">Margine E-Commerce</dt>
                            <dd className="text-sm text-gray-400 italic">Non calcolato (mancanza costi)</dd>
                        </div>
                    </dl>
                    <div className="mt-4 rounded-md bg-blue-50 p-3">
                        <p className="text-xs text-blue-700">
                            I dati vengono recuperati in tempo reale da WooCommerce per l'anno {currenYear}.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
