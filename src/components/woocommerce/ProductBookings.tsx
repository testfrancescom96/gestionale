
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";

interface Order {
    id: number;
    status: string;
    total: string;
    currency_symbol: string;
    date_created: string;
    billing: {
        first_name: string;
        last_name: string;
        email: string;
    };
    line_items: any[];
}

interface ProductBookingsProps {
    product: any;
    orders: Order[];
}

export function ProductBookings({ product, orders }: ProductBookingsProps) {
    const [syncingId, setSyncingId] = useState<number | null>(null);

    // Filter orders that actually contain this product (by ID or variation)
    // Note: In WooCommerce, line_items have `product_id`.
    const relevantOrders = orders.filter(o =>
        o.line_items.some((item: any) => item.product_id === product.id)
    );

    const handleSync = async (orderId: number) => {
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
            alert("Errore durante la sincronizzazione.");
        } finally {
            setSyncingId(null);
        }
    };

    if (relevantOrders.length === 0) {
        return <p className="text-sm text-gray-500 italic py-2">Nessuna prenotazione trovata per questo evento.</p>;
    }

    return (
        <div className="mt-2 space-y-2 border-l-2 border-gray-200 pl-4 py-2 bg-gray-50 rounded-r-lg">
            <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prenotazioni ({relevantOrders.length})</h5>
            <div className="space-y-2">
                {relevantOrders.map(order => (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-3 rounded border shadow-sm gap-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">#{order.id}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {order.status}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">
                                {order.billing?.first_name || "N/D"} {order.billing?.last_name || ""}
                            </div>
                            <div className="text-xs text-gray-400">
                                {order.date_created ? format(new Date(order.date_created), "dd MMM yyyy HH:mm", { locale: it }) : ""}
                            </div>
                        </div>

                        <button
                            onClick={() => handleSync(order.id)}
                            disabled={syncingId === order.id}
                            className="text-xs flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 disabled:opacity-50 whitespace-nowrap"
                        >
                            {syncingId === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                            Crea Pratica
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

