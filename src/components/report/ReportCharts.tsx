"use client";

import { useState, useEffect } from "react";
import { BarChart2, PieChart, Users, MapPin, Loader2, TrendingUp } from "lucide-react";

interface Stats {
    fatturatoMensile: { mese: string; agenzia: number; online: number; praticheCount: number; ordiniCount: number }[];
    clientiPerCitta: { citta: string; count: number }[];
    topDestinazioni: { destinazione: string; count: number; fatturato: number }[];
    tipologie: { tipologia: string; count: number; fatturato: number }[];
    operatori: { operatore: string; pratiche: number; fatturato: number; margine: number }[];
}

export function ReportCharts() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/report/advanced-stats")
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!stats) return null;

    // Calcola max per scaling barre
    const maxFatturato = Math.max(...stats.fatturatoMensile.map(m => m.agenzia + m.online), 1);
    const maxClienti = Math.max(...stats.clientiPerCitta.map(c => c.count), 1);
    const maxDest = Math.max(...stats.topDestinazioni.map(d => d.count), 1);

    const formatMoney = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

    return (
        <div className="space-y-8">
            {/* Grafico Fatturato Mensile */}
            <div className="bg-white rounded-lg p-6 shadow-sm ring-1 ring-gray-900/5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-blue-600" />
                    Fatturato Mensile
                </h3>
                <div className="flex items-end gap-2 h-48">
                    {stats.fatturatoMensile.map((m, i) => {
                        const agenziaH = (m.agenzia / maxFatturato) * 100;
                        const onlineH = (m.online / maxFatturato) * 100;
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center group">
                                {/* Tooltip */}
                                <div className="hidden group-hover:block absolute -mt-16 bg-gray-900 text-white text-xs rounded px-2 py-1 z-10 whitespace-nowrap">
                                    <div>Agenzia: {formatMoney(m.agenzia)}</div>
                                    <div>Online: {formatMoney(m.online)}</div>
                                </div>
                                <div className="w-full flex flex-col gap-0.5" style={{ height: '160px' }}>
                                    <div
                                        className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                                        style={{ height: `${agenziaH}%` }}
                                        title={`Agenzia: ${formatMoney(m.agenzia)}`}
                                    />
                                    <div
                                        className="w-full bg-purple-500 rounded-b transition-all duration-300 hover:bg-purple-600"
                                        style={{ height: `${onlineH}%` }}
                                        title={`Online: ${formatMoney(m.online)}`}
                                    />
                                </div>
                                <span className="text-xs text-gray-500 mt-2">{m.mese}</span>
                            </div>
                        );
                    })}
                </div>
                <div className="flex gap-4 mt-4 justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded" />
                        <span className="text-xs text-gray-600">Agenzia</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500 rounded" />
                        <span className="text-xs text-gray-600">Online</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Destinazioni */}
                <div className="bg-white rounded-lg p-6 shadow-sm ring-1 ring-gray-900/5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-red-500" />
                        Top Destinazioni
                    </h3>
                    <div className="space-y-3">
                        {stats.topDestinazioni.slice(0, 5).map((d, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700 truncate">{d.destinazione}</span>
                                    <span className="text-gray-500">{d.count} pratiche</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="bg-red-500 h-2 rounded-full transition-all"
                                        style={{ width: `${(d.count / maxDest) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Clienti per Città */}
                <div className="bg-white rounded-lg p-6 shadow-sm ring-1 ring-gray-900/5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5 text-green-500" />
                        Clienti per Città
                    </h3>
                    <div className="space-y-3">
                        {stats.clientiPerCitta.slice(0, 5).map((c, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700 truncate">{c.citta}</span>
                                    <span className="text-gray-500">{c.count} clienti</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all"
                                        style={{ width: `${(c.count / maxClienti) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Performance Operatori */}
            {stats.operatori.length > 0 && (
                <div className="bg-white rounded-lg p-6 shadow-sm ring-1 ring-gray-900/5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        Performance Operatori
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-2 text-gray-500 font-medium">Operatore</th>
                                    <th className="text-right py-2 text-gray-500 font-medium">Pratiche</th>
                                    <th className="text-right py-2 text-gray-500 font-medium">Fatturato</th>
                                    <th className="text-right py-2 text-gray-500 font-medium">Margine</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.operatori.map((o, i) => (
                                    <tr key={i} className="border-b last:border-0">
                                        <td className="py-3 font-medium text-gray-900">{o.operatore}</td>
                                        <td className="py-3 text-right text-gray-600">{o.pratiche}</td>
                                        <td className="py-3 text-right text-gray-600">{formatMoney(o.fatturato)}</td>
                                        <td className="py-3 text-right font-medium text-green-600">{formatMoney(o.margine)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tipologie Viaggio */}
            {stats.tipologie.length > 0 && (
                <div className="bg-white rounded-lg p-6 shadow-sm ring-1 ring-gray-900/5">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-orange-600" />
                        Tipologie Viaggio
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {stats.tipologie.map((t, i) => (
                            <div key={i} className="text-center p-4 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-gray-900">{t.count}</p>
                                <p className="text-xs text-gray-500 uppercase truncate" title={t.tipologia}>{t.tipologia}</p>
                                <p className="text-sm text-gray-600 mt-1">{formatMoney(t.fatturato)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
