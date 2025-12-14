"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Loader2, RefreshCw, ArrowRight, Eye, CheckCircle } from "lucide-react";

export function OrdersList() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncingId, setSyncingId] = useState<string | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/woocommerce/orders");
            const data = await res.json();
            if (data.orders) {
                setOrders(data.orders);
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

    const handleSync = async (orderId: string) => {
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
                // Could refresh orders list or update local state to show "synced" status
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
                <h3 className="font-semibold text-gray-800">Ultimi Ordini WooCommerce</h3>
                <button
                    onClick={fetchOrders}
                    className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100"
                    title="Aggiorna Ordini"
                >
                    <RefreshCw className="h-5 w-5" />
                </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ordine</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Data</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Stato</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Totale</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50">
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                    #{order.id}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {format(new Date(order.date_created), "dd/MM/yyyy", { locale: it })}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    <div>{order.billing.first_name} {order.billing.last_name}</div>
                                    <div className="text-xs text-gray-500">{order.billing.email}</div>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4">
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold
                                        ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                    {order.total} {order.currency_symbol}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleSync(order.id)}
                                        disabled={syncingId === order.id}
                                        className="inline-flex items-center gap-1 rounded bg-indigo-50 px-3 py-1.5 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                                    >
                                        {syncingId === order.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ArrowRight className="h-4 w-4" />
                                        )}
                                        Crea Pratica
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
