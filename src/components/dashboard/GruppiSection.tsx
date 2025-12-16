import Link from "next/link";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { MapPin, Users, AlertTriangle, RefreshCw } from "lucide-react";

interface GruppiSectionProps {
    stats: {
        totalEvents: number;
        totalOrders: number;
    };
    upcomingEvents: any[];
}

export function GruppiSection({ stats, upcomingEvents }: GruppiSectionProps) {
    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <MapPin className="h-5 w-5 text-blue-700" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Viaggi di Gruppo</h2>
                </div>
                <Link href="/woocommerce" className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <RefreshCw className="h-3 w-3" /> Gestione
                </Link>
            </div>

            {/* Brief Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase">Eventi Attivi</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{stats.totalEvents}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase">Ordini Totali</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
                </div>
            </div>

            {/* Upcoming Departures List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-50 bg-blue-50/50">
                    <h3 className="font-semibold text-gray-800">Prossime Partenze</h3>
                </div>

                <div className="overflow-y-auto flex-1 p-2">
                    {upcomingEvents.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-sm">Nessun evento in programma</div>
                    ) : (
                        <div className="space-y-3">
                            {upcomingEvents.map(evt => {
                                const eventDate = evt.eventDate ? new Date(evt.eventDate) : null;
                                const op = evt.operational;

                                // Fake capacity logic if not in DB, assuming standard bus 50 if managed stock, or generic
                                const stock = evt.manage_stock ? evt.stock_quantity : 50;
                                // If stock managed, stock_quantity is remaining. So sold = capacity - remaining? 
                                // WooCommerce "stock_quantity" is remaining stock.
                                // But we don't know initial stock easily unless we have a field. 
                                // Let's use orders count for occupancy visualization "Venduti: X"
                                // For bar, if stock managed, we can guess Capacity = stock + sold.
                                // Or just show number sold.

                                // Let's rely on booking count passed in or calculated.
                                // Since I don't have order count per product efficiently here without deep query, 
                                // I will assume the parent passes pre-calculated 'sold' count if possible, 
                                // OR we visualizes just what we have.
                                // Wait, I fetch `upcomingEvents` in page.tsx. I can include order items count there.

                                const sold = evt._count?.orderItems || 0;
                                // If manage stock, use it remaining to calc gauge?
                                // Let's purely use "Sold" count for now.

                                return (
                                    <div key={evt.id} className="p-3 bg-white border rounded-lg hover:shadow-md transition-shadow relative overflow-hidden group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex gap-3">
                                                <div className="bg-blue-50 text-blue-700 rounded-md p-1.5 text-center min-w-[3rem]">
                                                    {eventDate ? (
                                                        <>
                                                            <div className="text-[10px] font-bold uppercase">{format(eventDate, "MMM", { locale: it })}</div>
                                                            <div className="text-lg font-bold leading-none">{format(eventDate, "dd")}</div>
                                                        </>
                                                    ) : (
                                                        <div className="text-xs font-bold text-gray-400">N/D</div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors" title={evt.name}>{evt.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {op?.confermato && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">CONFERMATO</span>}
                                                        {op?.inForse && <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">IN FORSE</span>}
                                                        {!op && <span className="text-[10px] font-medium text-gray-400">Standard</span>}

                                                        {/* Alerts */}
                                                        {op && (!op.messaggioRiepilogoInviato) && op.confermato && (
                                                            <span title="Manca Riepilogo" className="text-orange-500"><AlertTriangle className="h-3 w-3" /></span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-1 text-sm font-bold text-gray-700">
                                                    <Users className="h-3 w-3 text-gray-400" />
                                                    {sold}
                                                </div>
                                                <div className="text-[10px] text-gray-400">prenotati</div>
                                            </div>
                                        </div>
                                        {/* Progress Bar (Visual Flair) */}
                                        <div className="h-1 w-full bg-gray-100 rounded-full mt-2 overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min((sold / 50) * 100, 100)}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
