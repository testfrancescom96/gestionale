
"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, CalendarOff, ChevronDown } from "lucide-react";
import { groupProductsByDate, GroupedEvent, YearGroup } from "@/lib/woo-utils";
import { EventGroup } from "./EventGroup";

export function WooDashboard() {
    const [products, setProducts] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [groupedEvents, setGroupedEvents] = useState<{ years: YearGroup[], undated: any[] }>({ years: [], undated: [] });

    // Configuration
    const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

    const loadLocalData = async () => {
        // setLoading(true); // Don't block UI on load if we have data? Better to show spinner for initial load.
        if (products.length === 0) setLoading(true);

        try {
            const [prodRes, ordRes] = await Promise.all([
                fetch("/api/woocommerce/products"),
                fetch("/api/woocommerce/orders")
            ]);

            const prodData = await prodRes.json();
            const ordData = await ordRes.json();

            if (prodData.products) {
                setProducts(prodData.products);
                const groups = groupProductsByDate(prodData.products);
                setGroupedEvents(groups);
            }

            if (ordData.orders) {
                setOrders(ordData.orders);
            }

            setLastUpdated(new Date());

        } catch (error) {
            console.error("Error loading local data:", error);
        } finally {
            setLoading(false);
        }
    };

    const triggerSync = async (mode: 'rapid' | 'full') => {
        setLoading(true);
        try {
            const res = await fetch("/api/woocommerce/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: 'all',
                    options: mode === 'rapid'
                        ? { limit: 50, mode: 'incremental' }
                        : { limit: 10000, mode: 'full' }
                })
            });

            if (res.ok) {
                // Reload local data
                await loadLocalData();
                alert("Sincronizzazione completata!");
            } else {
                alert("Errore durante la sincronizzazione.");
            }
        } catch (e) {
            console.error(e);
            alert("Errore di connessione.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLocalData();
    }, []);

    if (loading && products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">Sincronizzazione WooCommerce in corso...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header / Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Dashboard Eventi</h2>
                    <p className="text-sm text-gray-500">
                        {lastUpdated
                            ? `Ultimo aggiornamento: ${lastUpdated.toLocaleTimeString()}`
                            : "In attesa di dati..."}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Auto-Sync: 5 min
                    </div>
                    <div className="relative group">
                        <button
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading ? 'Sincronizzazione...' : 'Sincronizza'}
                            <ChevronDown className="h-4 w-4 ml-1" />
                        </button>

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-100 hidden group-hover:block z-50 overflow-hidden">
                            <button
                                onClick={() => triggerSync('rapid')}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 border-b"
                            >
                                <span className="font-bold block">Rapida (Consigliata)</span>
                                <span className="text-xs text-gray-500">Scarica ultimi 50 ordini e aggiornamenti recenti.</span>
                            </button>
                            <button
                                onClick={() => triggerSync('full')}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700"
                            >
                                <span className="font-bold block text-blue-600">Completa (Tutto)</span>
                                <span className="text-xs text-gray-500">Riscarica l'intero catalogo. Può richiedere minuti.</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content: Calendar View */}
            <div className="space-y-8">
                {groupedEvents.years.length > 0 ? (
                    groupedEvents.years.map((yearGroup) => (
                        <div key={yearGroup.year} className="space-y-4">
                            {/* Year Header */}
                            <div className="flex items-center gap-4">
                                <h3 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-500 pb-1 px-2">
                                    {yearGroup.year}
                                </h3>
                                <div className="h-px bg-gray-200 flex-1"></div>
                            </div>

                            {/* Months in this Year */}
                            <div className="grid grid-cols-1 gap-6">
                                {yearGroup.months.map((group) => (
                                    <EventGroup
                                        key={`${group.year}-${group.month}`}
                                        data={group}
                                        orders={orders}
                                        onRefresh={loadLocalData}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 bg-white rounded-lg border border-dashed">
                        <CalendarOff className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Nessun evento programmato trovato (SKU con data).</p>
                    </div>
                )}

                {/* Undated Products (Optional, collapsed by default maybe?) */}
                {groupedEvents.undated.length > 0 && (
                    <div className="mt-8 pt-8 border-t">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            Prodotti senza data (SKU standard)
                            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{groupedEvents.undated.length}</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
                            {groupedEvents.undated.slice(0, 6).map((p: any) => (
                                <div key={p.id} className="p-3 bg-white border rounded text-sm text-gray-600">
                                    {p.name} <span className="text-xs text-gray-400">({p.sku})</span>
                                </div>
                            ))}
                            {groupedEvents.undated.length > 6 && (
                                <div className="p-3 bg-gray-50 border rounded text-sm text-gray-500 flex items-center justify-center">
                                    + altri {groupedEvents.undated.length - 6}...
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
