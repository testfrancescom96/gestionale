"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ArrowRight, CheckCircle, Loader2, UserCog, Plus, FileSpreadsheet, Trash2 } from "lucide-react";
import { OrderEditModal } from "./OrderEditModal";
import { ManualBookingModal } from "./ManualBookingModal";

interface Order {
    id: number;
    status: string;
    total: string;
    currency_symbol: string;
    date_created: string;
    dateCreated?: string;
    billing: {
        first_name: string;
        last_name: string;
        email: string;
    };
    line_items: any[];
    manuallyModified?: boolean;
}

interface ManualBooking {
    id: number;
    cognome: string;
    nome: string;
    telefono?: string;
    puntoPartenza?: string;
    numPartecipanti: number;
    note?: string;
    createdAt: string;
}

interface ProductBookingsProps {
    product: any;
    updatedOrderIds?: number[];
    onRefresh?: () => void;
}

export function ProductBookings({ product, updatedOrderIds = [], onRefresh }: ProductBookingsProps) {
    const [syncingId, setSyncingId] = useState<number | null>(null);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [showManualModal, setShowManualModal] = useState(false);
    const [manualBookings, setManualBookings] = useState<ManualBooking[]>([]);
    const [loadingManual, setLoadingManual] = useState(false);
    const [downloadingList, setDownloadingList] = useState(false);

    // Filter orders that contain this product
    // Refactored to use nested orderItems -> order relation to avoid global fetch
    const relevantOrders = product.orderItems
        ?.map((item: any) => {
            const order = item.order;
            if (!order) return null;
            // Ensure compatibility with expected Order interface
            return {
                ...order,
                date_created: order.dateCreated, // Map for compatibility
                line_items: order.lineItems || [] // Ensure array
            };
        })
        .filter((o: any) => o !== null) || [];

    // Load manual bookings
    const loadManualBookings = async () => {
        setLoadingManual(true);
        try {
            const res = await fetch(`/api/woocommerce/manual-booking?productId=${product.id}`);
            const data = await res.json();
            if (data.bookings) {
                setManualBookings(data.bookings);
            }
        } catch (error) {
            console.error("Error loading manual bookings:", error);
        } finally {
            setLoadingManual(false);
        }
    };

    useEffect(() => {
        loadManualBookings();
    }, [product.id]);

    const handleSync = async (e: React.MouseEvent, orderId: number) => {
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
            alert("Errore durante la sincronizzazione.");
        } finally {
            setSyncingId(null);
        }
    };

    const handleDownloadList = async (forShare = false) => {
        setDownloadingList(true);
        try {
            const url = forShare
                ? `/api/woocommerce/products/${product.id}/export-passengers?share=true`
                : `/api/woocommerce/products/${product.id}/passenger-list`;
            const response = await fetch(url);
            if (response.ok) {
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                const suffix = forShare ? '_Condivisibile' : '';
                a.download = `Lista_Passeggeri${suffix}_${product.name.replace(/[^a-zA-Z0-9]/g, '_')}.${forShare ? 'csv' : 'xlsx'}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(downloadUrl);
                a.remove();
            } else {
                alert("Errore nel download della lista");
            }
        } catch (error) {
            console.error("Error downloading list:", error);
            alert("Errore di connessione");
        } finally {
            setDownloadingList(false);
        }
    };

    const handleDeleteManual = async (id: number) => {
        if (!confirm("Eliminare questa prenotazione manuale?")) return;
        try {
            const res = await fetch(`/api/woocommerce/manual-booking?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                loadManualBookings();
            } else {
                alert("Errore nell'eliminazione");
            }
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const totalBookings = relevantOrders.length + manualBookings.length;

    return (
        <div className="mt-2 space-y-3 border-l-2 border-gray-200 pl-4 py-2 bg-gray-50 rounded-r-lg">
            {/* Header with Actions */}
            <div className="flex items-center justify-between">
                <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Prenotazioni ({totalBookings})
                </h5>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowManualModal(true)}
                        className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 border border-green-200 font-medium"
                    >
                        <Plus className="h-3 w-3" />
                        Aggiungi
                    </button>
                    <button
                        onClick={() => handleDownloadList(false)}
                        disabled={downloadingList || totalBookings === 0}
                        className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 border border-blue-200 font-medium disabled:opacity-50"
                    >
                        {downloadingList ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3 w-3" />}
                        Lista Excel
                    </button>
                    <button
                        onClick={() => handleDownloadList(true)}
                        disabled={downloadingList || totalBookings === 0}
                        className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded hover:bg-purple-100 border border-purple-200 font-medium disabled:opacity-50"
                        title="Scarica lista senza telefoni/email per collaboratori esterni"
                    >
                        {downloadingList ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileSpreadsheet className="h-3 w-3" />}
                        Condividi
                    </button>
                </div>
            </div>

            {/* WooCommerce Orders */}
            {relevantOrders.length > 0 && (
                <div className="space-y-2">
                    {relevantOrders.map(order => {
                        const isUpdated = updatedOrderIds.includes(order.id);
                        const isManuallyModified = order.manuallyModified;
                        const orderDate = order.dateCreated || order.date_created;

                        return (
                            <div
                                key={order.id}
                                onClick={() => setEditingOrder(order)}
                                className={`relative group flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded border shadow-sm gap-2 transition-all duration-300 cursor-pointer hover:shadow-md ${isUpdated
                                    ? "bg-yellow-50 border-yellow-400 ring-1 ring-yellow-200"
                                    : isManuallyModified
                                        ? "bg-purple-50 border-purple-200"
                                        : "bg-white border-gray-200 hover:border-blue-300"
                                    }`}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900">#{order.id}</span>
                                        {isUpdated && (
                                            <span className="text-[10px] bg-yellow-400 text-yellow-900 px-1.5 rounded-full font-bold animate-pulse">
                                                AGGIORNATO
                                            </span>
                                        )}
                                        {isManuallyModified && (
                                            <span className="flex items-center gap-1 text-[10px] bg-purple-100 text-purple-700 px-1.5 rounded-full font-bold border border-purple-200">
                                                <UserCog className="h-3 w-3" /> MANUAL
                                            </span>
                                        )}
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                        {order.billing?.first_name || "N/D"} {order.billing?.last_name || ""}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {orderDate ? format(new Date(orderDate), "dd MMM yyyy HH:mm", { locale: it }) : ""}
                                    </div>
                                </div>

                                <div className="absolute top-2 right-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity italic pointer-events-none">
                                    Clicca per modificare
                                </div>

                                <button
                                    onClick={(e) => handleSync(e, order.id)}
                                    disabled={syncingId === order.id}
                                    className="text-xs flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 disabled:opacity-50 whitespace-nowrap z-10"
                                >
                                    {syncingId === order.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                                    Crea Pratica
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Manual Bookings */}
            {manualBookings.length > 0 && (
                <div className="space-y-2">
                    <h6 className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mt-3">
                        Prenotazioni Manuali ({manualBookings.length})
                    </h6>
                    {manualBookings.map(booking => (
                        <div
                            key={booking.id}
                            className="flex items-center justify-between p-3 rounded border border-green-200 bg-green-50 shadow-sm"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">
                                        {booking.cognome} {booking.nome}
                                    </span>
                                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded-full font-bold">
                                        MANUALE
                                    </span>
                                    {booking.numPartecipanti > 1 && (
                                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 rounded-full">
                                            x{booking.numPartecipanti}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    {booking.telefono && <span className="mr-3">📞 {booking.telefono}</span>}
                                    {booking.puntoPartenza && <span>📍 {booking.puntoPartenza}</span>}
                                </div>
                                {booking.note && (
                                    <div className="text-xs text-gray-400 mt-1 italic">{booking.note}</div>
                                )}
                            </div>
                            <button
                                onClick={() => handleDeleteManual(booking.id)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title="Elimina"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {totalBookings === 0 && !loadingManual && (
                <p className="text-sm text-gray-500 italic py-2">
                    Nessuna prenotazione trovata. Clicca "Aggiungi" per inserirne una manualmente.
                </p>
            )}

            {/* Loading State */}
            {loadingManual && (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
            )}

            {/* Edit Modal */}
            {editingOrder && (
                <OrderEditModal
                    isOpen={!!editingOrder}
                    order={editingOrder}
                    onClose={() => setEditingOrder(null)}
                    onSave={() => {
                        setEditingOrder(null);
                        if (onRefresh) onRefresh();
                    }}
                />
            )}

            {/* Manual Booking Modal */}
            {showManualModal && (
                <ManualBookingModal
                    isOpen={showManualModal}
                    productId={product.id}
                    productName={product.name}
                    onClose={() => setShowManualModal(false)}
                    onSave={() => {
                        loadManualBookings();
                        if (onRefresh) onRefresh();
                    }}
                />
            )}
        </div>
    );
}
