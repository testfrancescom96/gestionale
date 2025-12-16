
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

    const [progressMsg, setProgressMsg] = useState("");

    const triggerSync = async (type: 'smart' | 'rapid' | 'full' | 'days30' | 'days90') => {
        setLoading(true);
        setProgressMsg("Avvio connessione...");

        // Build URL params
        const params = new URLSearchParams();
        params.set("type", "all");

        if (type === 'smart') {
            params.set("order_mode", "smart");
            params.set("mode", "incremental");
        } else if (type === 'rapid') {
            params.set("limit", "50");
            params.set("order_mode", "rapid");
            params.set("mode", "incremental");
        } else if (type === 'full') {
            params.set("limit", "10000");
            params.set("order_mode", "full");
            params.set("mode", "full");
        } else if (type === 'days30') {
            params.set("days", "30");
            params.set("order_mode", "days");
            params.set("mode", "incremental");
        } else if (type === 'days90') {
            params.set("days", "90");
            params.set("order_mode", "days");
            params.set("mode", "incremental");
        }

        const eventSource = new EventSource(`/api/woocommerce/sync/stream?${params.toString()}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.status === 'progress' || data.status === 'info') {
                    setProgressMsg(data.message);
                } else if (data.status === 'done') {
                    eventSource.close();
                    loadLocalData(); // Reload UI
                    setLoading(false);
                    setProgressMsg("");
                    alert(`Sincronizzazione completata! (Prodotti: ${data.result.products || 0}, Ordini: ${data.result.orders || 0})`);
                } else if (data.status === 'error') {
                    eventSource.close();
                    setLoading(false);
                    alert("Errore: " + data.message);
                }
            } catch (e) {
                console.error("SSE Parse Error", e);
            }
        };

        eventSource.onerror = (e) => {
            console.error("SSE Error", e);
            eventSource.close();
            setLoading(false);
            loadLocalData();
        };
    };

    useEffect(() => {
        loadLocalData();
    }, []);

    if (loading && products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500">Caricamento dati...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Sync Progress Bar Overlay (if loading but we have data) */}
            {loading && products.length > 0 && (
                <div className="fixed inset-x-0 top-0 z-50">
                    <div className="h-1 w-full bg-blue-100 overflow-hidden">
                        <div className="animate-progress h-full bg-blue-600 origin-left-right"></div>
                    </div>
                    <div className="bg-blue-600 text-white text-center py-2 text-sm font-medium shadow-md">
                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                        {progressMsg || "Sincronizzazione in corso..."}
                    </div>
                </div>
            )}

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

                    <div className="relative group">
                        <div className="flex rounded-md shadow-sm">
                            <button
                                onClick={() => triggerSync('smart')}
                                disabled={loading}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-l-lg text-sm font-medium transition-colors border-r border-blue-700"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'In corso...' : 'Sync Modifiche'}
                            </button>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 rounded-r-lg disabled:opacity-50">
                                <ChevronDown className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-100 hidden group-hover:block z-50 overflow-hidden">
                            <div className="p-3 bg-blue-50 border-b border-blue-100">
                                <p className="text-xs text-blue-800 font-medium">Sincronizzazione Intelligente</p>
                                <p className="text-[10px] text-blue-600 mt-1">Scarica solo le novità e le modifiche (molto veloce).</p>
                            </div>
                            <button
                                onClick={() => triggerSync('smart')}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 border-b flex items-center justify-between"
                            >
                                <div>
                                    <span className="font-bold block text-blue-700">Smart Sync (Consigliato)</span>
                                    <span className="text-xs text-gray-500">Aggiorna stati e nuovi ordini.</span>
                                </div>
                            </button>

                            <button
                                onClick={() => triggerSync('rapid')}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 border-b"
                            >
                                <span className="font-bold block">Rapida (Ultimi 50)</span>
                                <span className="text-xs text-gray-500">Forza riscaricamento ultimi 50 ordini.</span>
                            </button>
                            <button
                                onClick={() => triggerSync('days30')}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 border-b"
                            >
                                <span className="font-bold block">Ultimi 30 Giorni</span>
                                <span className="text-xs text-gray-500">Ricarica tutto il mese corrente.</span>
                            </button>
                            <button
                                onClick={() => triggerSync('full')}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700"
                            >
                                <span className="font-bold block text-red-600">Completa (Tutto)</span>
                                <span className="text-xs text-gray-500">Lento. Scarica l'intero database.</span>
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
