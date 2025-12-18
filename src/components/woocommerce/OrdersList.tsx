import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Loader2, RefreshCw, ArrowRight, Eye, CheckCircle, ChevronDown, ChevronRight, Settings } from "lucide-react";
import { groupOrdersByDate, YearGroup } from "@/lib/woo-utils";

import { OrderEditModal } from "./OrderEditModal";

export function OrdersList() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [syncLimit, setSyncLimit] = useState(100);
    const [progressMsg, setProgressMsg] = useState("");
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [groupedOrders, setGroupedOrders] = useState<YearGroup[]>([]);
    const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
    const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});
    const [editingOrder, setEditingOrder] = useState<any | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/woocommerce/orders");
            const data = await res.json();
            if (data.orders) {
                setOrders(data.orders);
                setGroupedOrders(groupOrdersByDate(data.orders));
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const toggleYear = (year: number) => {
        setExpandedYears(prev => ({
            ...prev,
            [year]: !prev[year]
        }));
    };

    const toggleMonth = (monthKey: string) => {
        setExpandedMonths(prev => ({
            ...prev,
            [monthKey]: !prev[monthKey]
        }));
    };

    const handleSync = async (e: React.MouseEvent, orderId: string) => {
        e.stopPropagation();
        setSyncingId(orderId);
        try {
            const res = await fetch("/api/woocommerce/sync/order-to-pratica", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });
            const data = await res.json();

            if (res.ok) {
                alert(`Successo! Pratica #${data.message} creata.`);
            } else {
                alert(`Errore: ${data.error}`);
            }
        } catch (error) {
            console.error("Error syncing order:", error);
            alert("Errore di connessione durante la sincronizzazione.");
        } finally {
            setSyncingId(null);
        }
    };

    // Sync WooCommerce con streaming
    const triggerSync = async (type: 'rapid' | 'full' | 'days30', limit?: number) => {
        setSyncing(true);
        setProgressMsg("Avvio connessione...");

        const params = new URLSearchParams();
        params.set("type", "all");

        if (type === 'rapid') {
            params.set("limit", (limit || syncLimit).toString());
            params.set("order_mode", "rapid");
            params.set("mode", "incremental");
        } else if (type === 'days30') {
            params.set("days", "30");
            params.set("order_mode", "days");
            params.set("mode", "incremental");
        } else if (type === 'full') {
            params.set("limit", "10000");
            params.set("order_mode", "full");
            params.set("mode", "full");
        }

        const eventSource = new EventSource(`/api/woocommerce/sync/stream?${params.toString()}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.status === 'progress' || data.status === 'info') {
                    setProgressMsg(data.message);
                } else if (data.status === 'done') {
                    eventSource.close();
                    fetchOrders();
                    setSyncing(false);
                    setProgressMsg("");
                    const count = data.result?.updatedIds?.length || 0;
                    alert(`Sincronizzazione completata! ${count} ordini aggiornati.`);
                } else if (data.status === 'error') {
                    eventSource.close();
                    setSyncing(false);
                    setProgressMsg("");
                    alert("Errore: " + data.message);
                }
            } catch (e) {
                console.error("SSE Parse Error", e);
            }
        };

        eventSource.onerror = () => {
            eventSource.close();
            setSyncing(false);
            setProgressMsg("");
            fetchOrders();
        };
    };

    if (loading && !syncing) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
                <div>
                    <h3 className="font-semibold text-gray-800">Tutti gli Ordini WooCommerce</h3>
                    {syncing && progressMsg && (
                        <p className="text-sm text-blue-600 mt-1">{progressMsg}</p>
                    )}
                </div>

                {/* Sync Dropdown */}
                <div className="relative group">
                    <div className="flex rounded-md shadow-sm">
                        <button
                            onClick={() => triggerSync('rapid')}
                            disabled={syncing}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-l-lg text-sm font-medium transition-colors border-r border-blue-700"
                        >
                            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Sync in corso...' : `Aggiorna (${syncLimit})`}
                        </button>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 rounded-r-lg disabled:opacity-50">
                            <ChevronDown className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Dropdown Menu - Fixed Gap Issue */}
                    <div className="absolute right-0 top-full pt-2 w-80 hidden group-hover:block z-50">
                        <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden">
                            <div className="p-3 bg-gray-50 border-b border-gray-100">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Opzioni Sincronizzazione</p>
                            </div>

                            <button
                                onClick={() => { setSyncLimit(100); triggerSync('rapid', 100); }}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm text-gray-700 border-b"
                            >
                                <span className="font-bold block text-blue-700">🔄 Ultimi 100 Ordini</span>
                                <span className="text-xs text-gray-500">Controlla i 100 ordini più recenti.</span>
                            </button>

                            <button
                                onClick={() => { setSyncLimit(200); triggerSync('rapid', 200); }}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm text-gray-700 border-b"
                            >
                                <span className="font-bold block text-blue-700">🔄 Ultimi 200 Ordini</span>
                                <span className="text-xs text-gray-500">Controlla i 200 ordini più recenti.</span>
                            </button>

                            {/* Custom Input */}
                            <div className="px-4 py-3 border-b bg-gray-50">
                                <p className="text-xs font-semibold text-gray-600 mb-2">📝 Personalizzato:</p>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={syncLimit}
                                        onChange={(e) => setSyncLimit(parseInt(e.target.value) || 100)}
                                        className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        placeholder="N° ordini"
                                        min={10}
                                        max={5000}
                                    />
                                    <button
                                        onClick={() => triggerSync('rapid')}
                                        className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700"
                                    >
                                        Sync
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => triggerSync('days30')}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 border-b"
                            >
                                <span className="font-bold block">📅 Ultimi 30 Giorni</span>
                                <span className="text-xs text-gray-500">Ricarica tutto il mese corrente.</span>
                            </button>

                            <button
                                onClick={() => triggerSync('full')}
                                className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm text-gray-700"
                            >
                                <span className="font-bold block text-red-600">⚠️ Completa (Tutto)</span>
                                <span className="text-xs text-gray-500">Lento. Scarica l'intero database.</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {groupedOrders.length > 0 ? (
                    groupedOrders.map((yearGroup) => (
                        <div key={yearGroup.year} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {/* Year Header */}
                            <button
                                onClick={() => toggleYear(yearGroup.year)}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <h3 className="text-xl font-bold text-gray-800">
                                        {yearGroup.year}
                                    </h3>
                                    <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                                        {yearGroup.months.reduce((acc, m) => acc + m.products.length, 0)} Ordini
                                    </span>
                                </div>
                                <div className={`transition-transform duration-200 ${expandedYears[yearGroup.year] ? 'rotate-180' : ''}`}>
                                    <ChevronDown className="h-6 w-6 text-gray-400" />
                                </div>
                            </button>

                            {/* Year Content */}
                            {expandedYears[yearGroup.year] && (
                                <div className="p-0 border-t border-gray-200 bg-white animate-in slide-in-from-top-2 duration-200">
                                    {yearGroup.months.map((monthGroup) => {
                                        const monthKey = `${yearGroup.year}-${monthGroup.month}`;
                                        const isMonthExpanded = expandedMonths[monthKey] || false;

                                        // Quick fix: let's use a separate local component for Month or just a new state.
                                        // Given I cannot easily add a new component file without multiple calls, I will add state for months.
                                        // But I need to change the state definition first. OR I can reuse 'expandedYears' if I change key type to string.
                                        return (
                                            <MonthSection
                                                key={monthKey}
                                                monthGroup={monthGroup}
                                                handleSync={handleSync}
                                                syncingId={syncingId}
                                                setEditingOrder={setEditingOrder}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 bg-white rounded-lg border border-dashed">
                        <p className="text-gray-500">Nessun ordine trovato.</p>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingOrder && (
                <OrderEditModal
                    isOpen={!!editingOrder}
                    order={editingOrder}
                    onClose={() => setEditingOrder(null)}
                    onSave={() => {
                        setEditingOrder(null);
                        fetchOrders();
                    }}
                />
            )}
        </div>
    );
}

// Inner component or defined above in the same file to handle Month toggle
function MonthSection({ monthGroup, handleSync, syncingId, setEditingOrder }: { monthGroup: any, handleSync: any, syncingId: string | null, setEditingOrder: any }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="border-b last:border-0 border-gray-100">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-2 bg-gray-50/50 hover:bg-gray-100 border-b border-gray-100 transition-colors"
            >
                <div className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
                    {monthGroup.monthName} <span className="text-xs text-gray-400 font-normal ml-1">({monthGroup.products.length})</span>
                </div>
                <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
            </button>

            {isExpanded && (
                <div className="divide-y divide-gray-100 animate-in slide-in-from-top-1">
                    {monthGroup.products.map((order: any) => (
                        <div
                            key={order.id}
                            onClick={() => setEditingOrder(order)}
                            className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer
                                ${order.manuallyModified ? "bg-purple-50 hover:bg-purple-100" : "hover:bg-blue-50"}
                            `}
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-bold text-gray-900">#{order.id}</span>
                                    {order.manuallyModified && (
                                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 rounded-full font-bold border border-purple-200">
                                            MANUAL
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-500">
                                        {(order.dateCreated || order.date_created) ? format(new Date(order.dateCreated || order.date_created), "dd/MM/yyyy HH:mm", { locale: it }) : "-"}
                                    </span>
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase
                                        ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            order.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-600'}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-800 font-medium">
                                    {order.billing?.first_name || ""} {order.billing?.last_name || ""}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {order.billing?.email}
                                </div>
                            </div>

                            <div className="text-right flex flex-col sm:items-end gap-1">
                                <div className="font-bold text-gray-900">
                                    {order.total} {order.currency_symbol}
                                </div>
                                <button
                                    onClick={(e) => handleSync(e, order.id)}
                                    disabled={syncingId === order.id}
                                    className="inline-flex items-center gap-1 rounded bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                                >
                                    {syncingId === order.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <ArrowRight className="h-3 w-3" />
                                    )}
                                    Crea Pratica
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
