"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronDown, ChevronRight, Package, Pencil, ClipboardList, CheckCircle2, AlertTriangle, XCircle, Download, RefreshCw, UserPlus } from "lucide-react";
import { GroupedEvent } from "@/lib/woo-utils";
import { ProductBookings } from "./ProductBookings";
import { ProductEditModal } from "./ProductEditModal";
import { ManualOrderModal } from "./ManualOrderModal";
import { TripWorkflowModal } from "./TripWorkflowModal";

interface EventGroupProps {
    data: GroupedEvent;
    updatedOrderIds?: number[];
    highlightId?: number | null;
    onRefresh?: () => void;
    onDownload?: (product: any) => void;
    onSyncProduct?: (productId: number) => void;
    onTogglePin?: (productId: number, isPinned: boolean) => void;
}

export function EventGroup({ data, updatedOrderIds, highlightId, onRefresh, onDownload, onSyncProduct, onTogglePin }: EventGroupProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedProducts, setExpandedProducts] = useState<Record<number, boolean>>({});
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [workflowProduct, setWorkflowProduct] = useState<any | null>(null);
    const [manualOrderProduct, setManualOrderProduct] = useState<any | null>(null);

    // Auto-expand if highlightId is present in this group
    useEffect(() => {
        if (highlightId) {
            const hasProduct = data.products.some(p => p.id === highlightId);
            if (hasProduct) {
                setIsExpanded(true);
                setExpandedProducts(prev => ({ ...prev, [highlightId]: true }));
            }
        }
    }, [highlightId, data.products]);

    const toggleProduct = (productId: number) => {
        setExpandedProducts(prev => ({
            ...prev,
            [productId]: !prev[productId]
        }));
    };

    return (
        <div className="border rounded-xl mb-4 overflow-hidden bg-white shadow-sm border-gray-100">
            <div
                className="bg-gray-50/50 p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-white p-1.5 rounded-md shadow-sm border border-gray-100 text-gray-400">
                        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 capitalize leading-none mb-1">
                            {data.monthName} {data.year}
                        </h3>
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                            {data.products.length} Event{data.products.length === 1 ? 'o' : 'i'} in programma
                        </p>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="divide-y divide-gray-100">
                    {data.products.map((product) => {
                        const op = product.operational;
                        const manuallyModified = product.orderItems?.some((item: any) => item.order?.manuallyModified);

                        // Calculate stats
                        const bookingCount = (product.orderItems?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0) +
                            (product.manualBookings?.reduce((acc: number, b: any) => acc + b.numPartecipanti, 0) || 0);

                        const missingTasks = op ? (!op.autista || !op.accompagnatore || !op.busCompany) : true;

                        return (
                            <div
                                key={product.id}
                                className={`p-4 transition-all duration-200 ${highlightId === product.id ? 'bg-blue-50/50 ring-1 ring-blue-100' : 'hover:bg-gray-50/30'}`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 pr-4">
                                        {/* Header Row: Status & Title */}
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            {/* Status Badge */}
                                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider shadow-sm border ${op?.stato === 'SOLD_OUT' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                op?.stato === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-100' :
                                                    op?.stato === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-100' :
                                                        op?.confermato ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                }`}>
                                                {op?.stato === 'SOLD_OUT' ? '🎉 Sold Out' :
                                                    op?.stato === 'CANCELLED' ? '❌ Annullato' :
                                                        op?.stato === 'COMPLETED' ? '✅ Completato' :
                                                            op?.confermato ? '🚀 Confermato' : '⚠️ In Programma'}
                                            </span>

                                            {manuallyModified && (
                                                <span className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-100 flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" /> Modifiche
                                                </span>
                                            )}
                                        </div>

                                        <h4 className="font-semibold text-gray-900 text-lg leading-tight mb-2">
                                            {product.name}
                                        </h4>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded text-xs font-medium">
                                                <span>🗓</span>
                                                <span>{product.eventDate ? format(new Date(product.eventDate), 'dd MMMM yyyy', { locale: it }) : 'Data N/D'}</span>
                                            </div>

                                            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded text-xs font-medium">
                                                <span>👥</span>
                                                <span>{bookingCount} <span className="text-gray-400">Partecipanti</span></span>
                                            </div>

                                            {op?.luogo && (
                                                <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded text-xs font-medium">
                                                    <span>📍</span>
                                                    <span>{op.luogo}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Break-even Progress Bar & Min Pax Info */}
                                        {op?.minPartecipanti > 0 && (
                                            <div className="mt-3">
                                                {/* SOLD OUT */}
                                                {op.stato === 'SOLD_OUT' && (
                                                    <>
                                                        <div className="flex items-center justify-between text-[10px] mb-1">
                                                            <span className="font-semibold text-purple-600">🎉 TUTTO ESAURITO</span>
                                                            <span className="text-purple-600">100%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-purple-500 rounded-full"></div>
                                                    </>
                                                )}

                                                {/* CANCELLED */}
                                                {op.stato === 'CANCELLED' && (
                                                    <div className="opacity-60">
                                                        <div className="flex items-center justify-between text-[10px] mb-1">
                                                            <span className="text-red-600 line-through">Evento annullato</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-gray-300 rounded-full"></div>
                                                    </div>
                                                )}

                                                {/* COMPLETED */}
                                                {op.stato === 'COMPLETED' && (
                                                    <>
                                                        <div className="flex items-center justify-between text-[10px] mb-1">
                                                            <span className="font-semibold text-green-600">✓ Viaggio concluso</span>
                                                            <span className="text-green-600">Completato</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-green-500 rounded-full"></div>
                                                    </>
                                                )}

                                                {/* NORMAL STATES (PENDING, CONFIRMED) */}
                                                {!['SOLD_OUT', 'CANCELLED', 'COMPLETED'].includes(op.stato || '') && (
                                                    <>
                                                        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                                                            <span>Progresso partecipanti (Min: {op.minPartecipanti})</span>
                                                            <span>{Math.round((bookingCount / op.minPartecipanti) * 100)}%</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${bookingCount >= op.minPartecipanti ? 'bg-green-500' : 'bg-orange-400'
                                                                    }`}
                                                                style={{ width: `${Math.min((bookingCount / op.minPartecipanti) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {onDownload && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDownload(product);
                                                }}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 rounded-full transition-all shadow-sm text-xs font-medium"
                                                title="Apri Lista Passeggeri"
                                            >
                                                <ClipboardList className="h-3.5 w-3.5" />
                                                <span>Lista</span>
                                            </button>
                                        )}

                                        {onSyncProduct && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSyncProduct(product.id);
                                                }}
                                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors relative group"
                                                title={`Aggiorna Partecipanti Evento${product.lastBookingAt ? `\nUltimo booking: ${format(new Date(product.lastBookingAt), 'dd/MM HH:mm')}` : ''}`}
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                                {/* Optional: Add Indicator if sync needed? For now just manual trigger */}
                                            </button>
                                        )}



                                        {onTogglePin && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onTogglePin(product.id, !!product.isPinned);
                                                }}
                                                className={`p-2 rounded-full transition-colors ${product.isPinned
                                                    ? "text-blue-600 bg-blue-50 ring-1 ring-blue-200"
                                                    : "text-gray-300 hover:text-blue-400 hover:bg-gray-50"
                                                    }`}
                                                title={product.isPinned ? "Rimuovi da In Evidenza" : "Fissa in Alto (Pin)"}
                                            >
                                                {/* Pin Icon */}
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <line x1="12" y1="17" x2="12" y2="22"></line>
                                                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
                                                </svg>
                                            </button>
                                        )}

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setManualOrderProduct(product);
                                            }}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="Nuova Prenotazione Manuale"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setManualOrderProduct(product);
                                            }}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="Nuova Prenotazione Manuale"
                                        >
                                            <UserPlus className="h-4 w-4" />
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setWorkflowProduct(product);
                                            }}
                                            className={`p-2 rounded-full transition-colors ${missingTasks && op?.confermato ? "text-orange-500 bg-orange-50 ring-1 ring-orange-200" : "text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                                                }`}
                                            title="Workflow Operativo (Checklist)"
                                        >
                                            <ClipboardList className="h-4 w-4" />
                                        </button>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingProduct(product);
                                            }}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                            title="Modifica Prodotto"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => toggleProduct(product.id)}
                                            className="text-gray-400 hover:text-gray-600 p-2"
                                        >
                                            {expandedProducts[product.id] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                {
                                    expandedProducts[product.id] && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <ProductBookings
                                                product={product}
                                                updatedOrderIds={updatedOrderIds}
                                                onRefresh={onRefresh}
                                            />
                                        </div>
                                    )
                                }
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            {
                editingProduct && (
                    <ProductEditModal
                        isOpen={!!editingProduct}
                        product={editingProduct}
                        onClose={() => setEditingProduct(null)}
                        onSave={() => {
                            setEditingProduct(null);
                            if (onRefresh) onRefresh();
                        }}
                    />
                )
            }

            {/* Workflow Modal */}
            {
                workflowProduct && (
                    <TripWorkflowModal
                        isOpen={!!workflowProduct}
                        product={workflowProduct}
                        onClose={() => setWorkflowProduct(null)}
                        onSave={() => {
                            setWorkflowProduct(null);
                            if (onRefresh) onRefresh();
                        }}
                    />
                )
            }
            {/* Manual Order Modal */}
            {manualOrderProduct && (
                <ManualOrderModal
                    isOpen={!!manualOrderProduct}
                    onClose={() => setManualOrderProduct(null)}
                    product={manualOrderProduct}
                    onSuccess={() => {
                        if (onSyncProduct) onSyncProduct(manualOrderProduct.id);
                        if (onRefresh) onRefresh();
                    }}
                />
            )}

        </div >
    );
}
