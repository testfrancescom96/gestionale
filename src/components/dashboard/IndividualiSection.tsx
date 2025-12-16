import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowUpRight, Clock, CalendarDays, AlertCircle } from "lucide-react";

interface IndividualiSectionProps {
    stats: {
        totalOpen: number;
        departingSoon: number;
        overduePayments: number;
    };
    recentPratiche: any[];
}

export function IndividualiSection({ stats, recentPratiche }: IndividualiSectionProps) {
    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center gap-2 pb-2 border-b border-indigo-100">
                <div className="bg-indigo-100 p-2 rounded-lg">
                    <CalendarDays className="h-5 w-5 text-indigo-700" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Pratiche Individuali</h2>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase">In Lavorazione</p>
                    <p className="text-2xl font-bold text-indigo-600 mt-1">{stats.totalOpen}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase">In Partenza (7gg)</p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-2xl font-bold text-gray-900">{stats.departingSoon}</p>
                        {stats.departingSoon > 0 && <span className="animate-pulse h-2 w-2 rounded-full bg-orange-500"></span>}
                    </div>
                </div>
            </div>

            {/* Recent List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Recenti</h3>
                    <Link href="/pratiche" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                        Vedi tutte
                    </Link>
                </div>

                <div className="overflow-y-auto flex-1 p-2">
                    {recentPratiche.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">Nessuna pratica recente</div>
                    ) : (
                        <div className="space-y-2">
                            {recentPratiche.map((p) => (
                                <Link
                                    key={p.id}
                                    href={`/pratiche/${p.id}`}
                                    className="block p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-gray-900 text-sm">#{p.numero} - {p.cliente.nome} {p.cliente.cognome}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.stato === 'CONFERMATO' ? 'bg-green-100 text-green-700' :
                                                p.stato === 'ANNULLATO' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {p.stato}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600 mb-2 truncate">
                                        {p.destinazione || "Destinazione N/D"}
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(p.updatedAt), "dd MMM", { locale: it })}
                                        </span>
                                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
