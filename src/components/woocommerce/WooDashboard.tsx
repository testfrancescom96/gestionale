
"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw, CalendarOff, ChevronDown, Settings, X } from "lucide-react";
import { groupProductsByDate, GroupedEvent, YearGroup } from "@/lib/woo-utils";
import { EventGroup } from "./EventGroup";
import { ExportSettingsModal } from "./ExportSettingsModal";
import { PassengerListModal } from "./PassengerListModal";
import ProductParamsEditor from "./ProductParamsEditor";

import { useSearchParams } from "next/navigation";

export function WooDashboard() {
    const searchParams = useSearchParams();
    const highlightId = searchParams.get("highlight") ? parseInt(searchParams.get("highlight")!) : null;

    const [products, setProducts] = useState<any[]>([]);
    // Orders state removed for performance - using nested orderItems
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [syncStats, setSyncStats] = useState<{ orderCount: number; dateFrom: string; dateTo: string } | null>(null);

    const [groupedEvents, setGroupedEvents] = useState<{ pinned: any[], years: YearGroup[], undated: any[] }>({ pinned: [], years: [], undated: [] });

    // Feature: Visual Feedback & Settings
    const [updatedOrderIds, setUpdatedOrderIds] = useState<number[]>([]);
    const [showSettings, setShowSettings] = useState(false);
    const [customSyncDate, setCustomSyncDate] = useState<string>("");

    // Configuration
    const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

    const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});

    // Preview Modal State
    const [previewTargetId, setPreviewTargetId] = useState<number | null>(null);
    const [isSyncMenuOpen, setIsSyncMenuOpen] = useState(false);

    // Product Params Editor State
    const [editingParamsProduct, setEditingParamsProduct] = useState<{ id: number; name: string } | null>(null);

    const handleEditParams = (productId: number, productName: string) => {
        setEditingParamsProduct({ id: productId, name: productName });
    };

    const handleDownloadClick = (p: any) => {
        setPreviewTargetId(p.id);
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
            const prodRes = await fetch("/api/woocommerce/products");
            const prodData = await prodRes.json();

            if (prodData.products) {
                setProducts(prodData.products);
                const groups = groupProductsByDate(prodData.products);
                setGroupedEvents(groups);

                // Calculate sync stats from orderItems
                let allOrderDates: Date[] = [];
                let totalOrders = 0;

                prodData.products.forEach((product: any) => {
                    if (product.orderItems && Array.isArray(product.orderItems)) {
                        product.orderItems.forEach((item: any) => {
                            if (item.order?.dateCreated) {
                                allOrderDates.push(new Date(item.order.dateCreated));
                                totalOrders++;
                            }
                        });
                    }
                });

                if (allOrderDates.length > 0) {
                    allOrderDates.sort((a, b) => a.getTime() - b.getTime());
                    const dateFrom = allOrderDates[0];
                    const dateTo = allOrderDates[allOrderDates.length - 1];

                    setSyncStats({
                        orderCount: totalOrders,
                        dateFrom: dateFrom.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
                        dateTo: dateTo.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }) +
                            ' ore ' + dateTo.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
                    });
                } else {
                    setSyncStats(null);
                }
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

    // NEW: Targeted Product Sync
    const triggerProductSync = async (productId: number) => {
        setLoading(true);
        setProgressMsg(`Sync mirato Evento #${productId}...`);

        const params = new URLSearchParams();
        params.set("type", "orders");
        params.set("order_mode", "product");
        params.set("product_id", productId.toString());
        params.set("mode", "incremental"); // Products mode, ignored for order type but safe

        const eventSource = new EventSource(`/api/woocommerce/sync/stream?${params.toString()}`);

        setupSSE(eventSource);
    };

    const setupSSE = (eventSource: EventSource) => {
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
                    // Optional alert or toast
                    if (data.result.updatedIds?.length > 0) {
                        alert(`Sync completato: ${data.result.updatedIds.length} ordini aggiornati/verificati.`);
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

    const triggerSync = async (type: 'smart' | 'rapid' | 'full' | 'days30' | 'custom_limit') => {
        setLoading(true);
        setProgressMsg("Avvio connessione...");
        setUpdatedOrderIds([]);

        const params = new URLSearchParams();
        params.set("type", "all");

        // ... params setup ...
        // I need to paste the param logic here or reuse? 
        // I will implement the params setup block below in the 'setupSSE' usage


        if (type === 'smart') {
            params.set("order_mode", "smart");
            params.set("mode", "incremental");
        } else if (type === 'rapid') {
            // Default "Recent" sync: Start of current month
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            params.set("date", startOfMonth.toISOString());
            params.set("order_mode", "rapid"); // Or 'days' if we implemented it, but passing 'date' overrides
            params.set("mode", "incremental");
            params.set("limit", "1000"); // Safe high limit for month
        } else if (type === 'full') {
            params.set("limit", "10000");
            params.set("order_mode", "full");
            params.set("mode", "full");
        }



        const eventSource = new EventSource(`/api/woocommerce/sync/stream?${params.toString()}`);
        setupSSE(eventSource);
    };

    // Custom date sync
    const triggerSyncFromDate = async (dateString: string) => {
        setLoading(true);
        setProgressMsg("Sincronizzazione da data personalizzata...");
        setUpdatedOrderIds([]);

        const params = new URLSearchParams();
        params.set("type", "all");
        params.set("after", new Date(dateString).toISOString());
        params.set("order_mode", "days");
        params.set("mode", "incremental");

        const eventSource = new EventSource(`/api/woocommerce/sync/stream?${params.toString()}`);
        setupSSE(eventSource);
    };

    const toggleYear = (year: number) => {
        setExpandedYears(prev => ({
            ...prev,
            [year]: !prev[year]
        }));
    };

    // NEW: Toggle Pin Feature
    const togglePin = async (productId: number, isPinned: boolean) => {
        // Optimistic UI Update
        const newStatus = !isPinned;

        // Temporarily update local state for snappy feel? Or just wait loadLocalData?
        // Let's rely on fast reload since we are modifying local cache usually... 
        // But here we need to call API PATCH

        try {
            const res = await fetch(`/api/woocommerce/products/${productId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPinned: newStatus })
            });

            if (res.ok) {
                // Reload data to reflect sorting changes
                loadLocalData();
            } else {
                alert("Errore nell'aggiornamento del Pin");
            }
        } catch (e) {
            console.error("Failed to toggle pin", e);
            alert("Errore di connessione");
        }
    };

    return (
        <div className="space-y-6 relative">
            <ExportSettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

            {/* Backdrop for closing Dropdown */}
            {isSyncMenuOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSyncMenuOpen(false)}
                />
            )}

            {/* Header / Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm border">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Dashboard Eventi</h2>
                    <p className="text-sm text-gray-500">
                        {syncStats
                            ? `📦 ${syncStats.orderCount} ordini dal ${syncStats.dateFrom} al ${syncStats.dateTo}`
                            : lastUpdated
                                ? `Ultimo caricamento: ${lastUpdated.toLocaleTimeString()}`
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

                    <div className="relative z-50">
                        <div className="flex rounded-md shadow-sm">
                            <button
                                onClick={() => triggerSync('smart')}
                                disabled={loading}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-l-lg text-sm font-medium transition-colors border-r border-blue-700"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? progressMsg || 'Sincronizzazione...' : 'Sincronizza'}
                            </button>
                            <button
                                onClick={() => setIsSyncMenuOpen(!isSyncMenuOpen)}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 rounded-r-lg disabled:opacity-50 transition-colors"
                            >
                                <ChevronDown className={`h-4 w-4 transition-transform ${isSyncMenuOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Simplified Dropdown Menu */}
                        {isSyncMenuOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <div className="p-3 bg-gray-50 border-b border-gray-100">
                                    <p className="text-xs text-gray-500 uppercase font-semibold">Altre Opzioni</p>
                                </div>

                                <button
                                    onClick={() => { triggerSync('rapid'); setIsSyncMenuOpen(false); }}
                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 text-sm text-gray-700 border-b transition-colors"
                                >
                                    <span className="font-bold block text-blue-700">📅 Mese Corrente</span>
                                    <span className="text-xs text-gray-500">Ordini dal 1° del mese ad oggi.</span>
                                </button>

                                <div className="px-4 py-3 border-b bg-gray-50">
                                    <p className="text-xs font-semibold text-gray-600 mb-2">📆 Da una data specifica:</p>
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={customSyncDate}
                                            onChange={(e) => setCustomSyncDate(e.target.value)}
                                            className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                        <button
                                            onClick={() => {
                                                if (customSyncDate) {
                                                    triggerSyncFromDate(customSyncDate);
                                                    setIsSyncMenuOpen(false);
                                                }
                                            }}
                                            disabled={!customSyncDate}
                                            className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            Sync
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => { triggerSync('full'); setIsSyncMenuOpen(false); }}
                                    className="w-full text-left px-4 py-3 hover:bg-red-50 text-sm text-gray-700 transition-colors"
                                >
                                    <span className="font-bold block text-red-600">⚡ Completa (Tutto)</span>
                                    <span className="text-xs text-gray-500">Scarica l'intero storico. Solo se problemi.</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {
                previewTargetId && (
                    <PassengerListModal
                        isOpen={true}
                        onClose={() => setPreviewTargetId(null)}
                        productId={previewTargetId}
                    />
                )
            }

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
                                                updatedOrderIds={updatedOrderIds}
                                                onRefresh={loadLocalData}
                                                onSyncProduct={triggerProductSync}
                                                onDownload={handleDownloadClick}
                                                onTogglePin={togglePin}
                                                onEditParams={handleEditParams}
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

                {/* Undated Products - Reusing EventGroup logic for interactivity */}
                {groupedEvents.undated.length > 0 && (
                    <div className="mt-8 pt-8 border-t">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            Prodotti senza data (SKU standard)
                        </h3>

                        {/* Render as a special EventGroup */}
                        <EventGroup
                            data={{
                                year: 0,
                                month: 0,
                                monthName: "Prodotti Non Datati",
                                products: groupedEvents.undated
                            }}
                            updatedOrderIds={updatedOrderIds}
                            onRefresh={loadLocalData}
                            onSyncProduct={triggerProductSync}
                            onDownload={handleDownloadClick}
                            onTogglePin={togglePin}
                            onEditParams={handleEditParams}
                        />
                    </div>
                )}
            </div>

            {/* Product Params Editor Modal */}
            {editingParamsProduct && (
                <ProductParamsEditor
                    productId={editingParamsProduct.id}
                    productName={editingParamsProduct.name}
                    isOpen={true}
                    onClose={() => setEditingParamsProduct(null)}
                />
            )}
        </div >
    );
}
