import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Loader2, RefreshCw, ArrowRight, Eye, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { groupOrdersByDate, YearGroup } from "@/lib/woo-utils";

import { OrderEditModal } from "./OrderEditModal";

export function OrdersList() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [groupedOrders, setGroupedOrders] = useState<YearGroup[]>([]);
    const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
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

    if (loading) {
        return (
            <div className="flex justify-center p-10">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
                <h3 className="font-semibold text-gray-800">Tutti gli Ordini WooCommerce</h3>
                <button
                    onClick={fetchOrders}
                    className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                    title="Aggiorna Ordini"
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
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
                            {/* Year Content */}
                            {expandedYears[yearGroup.year] && (
                                <div className="p-0 border-t border-gray-200 bg-white animate-in slide-in-from-top-2 duration-200">
                                    {yearGroup.months.map((monthGroup) => {
                                        const monthKey = `${yearGroup.year}-${monthGroup.month}`;
                                        const isMonthExpanded = expandedYears[monthKey] || false; // Using same state object with string keys for months? No, type is Record<number, bool>. create new state.

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
