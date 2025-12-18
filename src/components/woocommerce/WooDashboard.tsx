
"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, CalendarOff, ChevronDown, Settings, X } from "lucide-react";
import { groupProductsByDate, GroupedEvent, YearGroup } from "@/lib/woo-utils";
import { EventGroup } from "./EventGroup";
import { ExportSettingsModal } from "./ExportSettingsModal";
import { DownloadOptionsModal } from "./DownloadOptionsModal";

import { useSearchParams } from "next/navigation";

export function WooDashboard() {
    const searchParams = useSearchParams();
    const highlightId = searchParams.get("highlight") ? parseInt(searchParams.get("highlight")!) : null;

    const [products, setProducts] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [groupedEvents, setGroupedEvents] = useState<{ years: YearGroup[], undated: any[] }>({ years: [], undated: [] });

    // Feature: Visual Feedback & Settings
    const [updatedOrderIds, setUpdatedOrderIds] = useState<number[]>([]);
    const [syncLimit, setSyncLimit] = useState(100);
    const [showSettings, setShowSettings] = useState(false);

    // Configuration
    const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

    const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});

    // Download Modal State
    const [downloadTarget, setDownloadTarget] = useState<{ id: number; name: string } | null>(null);

    const handleDownloadClick = (p: any) => {
        setDownloadTarget({ id: p.id, name: p.name });
    };

    const performDownload = (selectedColumns: string[]) => {
        if (!downloadTarget) return;
        const colParam = selectedColumns.length > 0 ? `?columns=${selectedColumns.join(',')}` : '';
        window.open(`/api/woocommerce/products/${downloadTarget.id}/passenger-list${colParam}`, '_blank');
        setDownloadTarget(null);
    };


    // Effect: Auto-load data on mount
    useEffect(() => {
        loadLocalData();
    }, []);

    // Effect to handle highlight auto-expansion once data is loaded
    useEffect(() => {
        if (highlightId && groupedEvents.years.length > 0) {
            // Find which year contains the product
            for (const yearGroup of groupedEvents.years) {
                const hasProduct = yearGroup.months.some(m => m.products.some(p => p.id === highlightId));
                if (hasProduct) {
                    setExpandedYears(prev => ({ ...prev, [yearGroup.year]: true }));
                    // Month expansion is handled inside EventGroup
                    break;
                }
            }
        }
    }, [highlightId, groupedEvents]);


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

    // ... existing sync logic ...






    // ... existing sync logic ...

    const [progressMsg, setProgressMsg] = useState("");

    const triggerSync = async (type: 'smart' | 'rapid' | 'full' | 'days30' | 'days90') => {
        // ... same sync logic ...
        setLoading(true);
        // ... rest of sync implementation
        // Simplified for brevity in replace block - ensuring existing code remains valid

        // RE-INSERTING ORIGINAL SYNC LOGIC TO AVOID BREAKING
        setLoading(true);
        setProgressMsg("Avvio connessione...");
        setUpdatedOrderIds([]);

        const params = new URLSearchParams();
        params.set("type", "all");

        if (type === 'smart') {
            params.set("order_mode", "smart");
            params.set("mode", "incremental");
        } else if (type === 'rapid') {
            params.set("limit", syncLimit.toString());
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
        }

        const eventSource = new EventSource(`/api/woocommerce/sync/stream?${params.toString()}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.status === 'progress' || data.status === 'info') {
                    setProgressMsg(data.message);
                } else if (data.status === 'done') {
                    eventSource.close();
                    loadLocalData();
                    setLoading(false);
                    setProgressMsg("");
                    if (data.result.updatedIds && Array.isArray(data.result.updatedIds)) {
                        setUpdatedOrderIds(data.result.updatedIds);
                        const count = data.result.updatedIds.length;
                        if (count > 0) alert(`Sincronizzazione completata! ${count} ordini aggiornati.`);
                        else alert(`Sincronizzazione completata! Nessuna modifica rilevata negli ultimi ${syncLimit} ordini.`);
                    } else {
                        alert("Sincronizzazione completata!");
                    }
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

    const toggleYear = (year: number) => {
        setExpandedYears(prev => ({
            ...prev,
            [year]: !prev[year]
        }));
    };

    return (
        <div className="space-y-6 relative">
            <ExportSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

            {/* ... (Settings Modal and Header code omitted for brevity in search/replace context if not needed, but here I am inside main return) ... */}

            {/* Same Header/Settings Block as before... assuming I don't need to replace it all. 
                Wait, I am replacing the whole Main Content loop mostly.
            */}

            {/* Header / Stats - Keeping as is */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border">
                {/* ... (header content) ... */}
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Dashboard Eventi</h2>
                    <p className="text-sm text-gray-500">
                        {lastUpdated
                            ? `Ultimo aggiornamento: ${lastUpdated.toLocaleTimeString()}`
                            : "In attesa di dati..."}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Settings Button */}
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                        title="Configura Sincronizzazione"
                    >
                        <Settings className="h-5 w-5" />
                    </button>

                    <div className="relative group">
                        <div className="flex rounded-md shadow-sm">
                            <button
                                onClick={() => triggerSync('rapid')}
                                disabled={loading}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-l-lg text-sm font-medium transition-colors border-r border-blue-700"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'In corso...' : `Aggiorna (Ultimi ${syncLimit})`}
                            </button>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 rounded-r-lg disabled:opacity-50">
                                <ChevronDown className="h-4 w-4" />
                            </button>
                        </div>
                        {/* Dropdown Menu */}
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 hidden group-hover:block z-50 overflow-hidden">
                            <div className="p-3 bg-gray-50 border-b border-gray-100">
                                <p className="text-xs text-gray-500 uppercase font-semibold">Opzioni Sincronizzazione</p>
                            </div>

                            {/* Quick Options */}
                            <button
                                onClick={() => { setSyncLimit(100); triggerSync('rapid'); }}
                                className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm text-gray-700 border-b"
                            >
                                <span className="font-bold block text-blue-700">🔄 Ultimi 100 Ordini</span>
                                <span className="text-xs text-gray-500">Controlla i 100 ordini più recenti.</span>
                            </button>

                            <button
                                onClick={() => { setSyncLimit(200); triggerSync('rapid'); }}
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

            {downloadTarget && (
                <DownloadOptionsModal
                    isOpen={true}
                    onClose={() => setDownloadTarget(null)}
                    productName={downloadTarget.name}
                    onConfirm={performDownload}
                />
            )}

            {/* Main Content: Calendar View */}
            <div className="space-y-4">
                {groupedEvents.years.length > 0 ? (
                    groupedEvents.years.map((yearGroup) => (
                        <div key={yearGroup.year} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {/* Year Header (Collapsible) */}
                            <button
                                onClick={() => toggleYear(yearGroup.year)}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <h3 className="text-2xl font-bold text-gray-800">
                                        {yearGroup.year}
                                    </h3>
                                    <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                                        {yearGroup.months.reduce((acc, m) => acc + m.products.length, 0)} Eventi
                                    </span>
                                </div>
                                <div className={`transition-transform duration-200 ${expandedYears[yearGroup.year] ? 'rotate-180' : ''}`}>
                                    <ChevronDown className="h-6 w-6 text-gray-400" />
                                </div>
                            </button>

                            {/* Year Content (Months) */}
                            {expandedYears[yearGroup.year] && (
                                <div className="p-4 border-t border-gray-200 bg-white animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-1 gap-6">
                                        {yearGroup.months.map((group) => (
                                            <EventGroup
                                                key={`${group.year}-${group.month}`}
                                                data={group}
                                                orders={orders}
                                                updatedOrderIds={updatedOrderIds}
                                                onRefresh={loadLocalData}
                                                onDownload={handleDownloadClick}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 bg-white rounded-lg border border-dashed">
                        <CalendarOff className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Nessun evento programmato trovato (SKU con data).</p>
                    </div>
                )}

                {/* ... existing undated ... */}
                {/* Undated Products */}
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
