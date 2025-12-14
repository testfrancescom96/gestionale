import { prisma } from "@/lib/db";
import { DollarSign, TrendingUp, Briefcase } from "lucide-react";

export default async function ReportPage() {
    const currenYear = new Date().getFullYear();
    const startDate = new Date(currenYear, 0, 1);
    const endDate = new Date(currenYear + 1, 0, 1);

    // Totale Pratiche Anno Corrente
    const totalPratiche = await prisma.pratica.count({
        where: {
            dataRichiesta: {
                gte: startDate,
                lt: endDate,
            },
            NOT: { stato: "ANNULLATA" }
        }
    });

    // Aggregati finanziari Anno Corrente
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

    const volumeAffari = aggregati._sum.prezzoVendita || 0;
    const margineTotale = aggregati._sum.margineCalcolato || 0;
    const percentualeMargineMedio = volumeAffari > 0 ? (margineTotale / volumeAffari) * 100 : 0;

    return (
        <div className="p-8">
            <h1 className="mb-6 text-3xl font-bold text-gray-900">Report {currenYear}</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                {/* Card Volume Affari */}
                <div className="overflow-hidden rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-blue-100 p-3">
                            <DollarSign className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Volume d'Affari</p>
                            <p className="text-2xl font-bold text-gray-900">€ {volumeAffari.toFixed(2)}</p>
                        </div>
                    </div>
                </div>

                {/* Card Margine */}
                <div className="overflow-hidden rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-green-100 p-3">
                            <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Margine Totale</p>
                            <p className="text-2xl font-bold text-gray-900">
                                € {margineTotale.toFixed(2)}
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                    ({percentualeMargineMedio.toFixed(1)}%)
                                </span>
                            </p>
                            <p className="text-xs text-red-500 font-medium mt-1">
                                Netto stima IVA: € {(margineTotale / 1.22).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Card Totale Pratiche */}
                <div className="overflow-hidden rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-purple-100 p-3">
                            <Briefcase className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pratiche Gestite</p>
                            <p className="text-2xl font-bold text-gray-900">{totalPratiche}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-lg bg-yellow-50 p-4 border border-yellow-200">
                <p className="text-sm text-yellow-800">
                    <strong>Nota:</strong> Questa è una versione base della reportistica.
                    In futuro potremo aggiungere grafici mensili, breakdown per fornitore e analisi per destinazione.
                </p>
            </div>
        </div>
    );
}
