
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronDown, ChevronRight, Package, Pencil, ClipboardList, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { GroupedEvent } from "@/lib/woo-utils";
import { ProductBookings } from "./ProductBookings";
import { ProductEditModal } from "./ProductEditModal";
import { TripWorkflowModal } from "./TripWorkflowModal";

interface EventGroupProps {
    data: GroupedEvent;
    orders: any[];
    updatedOrderIds?: number[];
    onRefresh?: () => void;
}

export function EventGroup({ data, orders, updatedOrderIds, onRefresh }: EventGroupProps) {
    // Determine if the group (Month) is expanded
    const [isExpanded, setIsExpanded] = useState(false);

    // Track which products are expanded to show bookings
    const [expandedProducts, setExpandedProducts] = useState<Record<number, boolean>>({});

    // Editing state
    const [editingProduct, setEditingProduct] = useState<any | null>(null);

    // Workflow state
    const [workflowProduct, setWorkflowProduct] = useState<any | null>(null);

    const toggleProduct = (productId: number) => {
        setExpandedProducts(prev => ({
            ...prev,
            [productId]: !prev[productId]
        }));
    };

    return (
        <div className="border rounded-lg bg-white overflow-hidden shadow-sm mb-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? <ChevronDown className="h-5 w-5 text-gray-500" /> : <ChevronRight className="h-5 w-5 text-gray-500" />}
                    <div className="flex flex-col items-start">
                        <span className="text-lg font-bold text-gray-800 capitalize">{data.monthName} {data.year}</span>
                        <span className="text-xs text-gray-500">{data.products.length} Eventi programmati</span>
                    </div>
                </div>
            </button>

            {isExpanded && (
                <div className="divide-y divide-gray-100">
                    {data.products.map((product: any) => {
                        // FIX: Ensure date is parsed correctly from JSON string
                        const eventDate = product.eventDate ? new Date(product.eventDate) : null;

                        // Count bookings for this product
                        const bookingCount = orders.filter(o =>
                            o.line_items?.some((item: any) => item.product_id === product.id)
                        ).length;

                        // Operational Status
                        const op = product.viaggioOperativo;
                        let statusIcon = null;
                        if (op?.confermato) statusIcon = <span title="Viaggio Confermato"><CheckCircle2 className="h-5 w-5 text-green-600" /></span>;
                        else if (op?.annullato) statusIcon = <span title="Viaggio Annullato"><XCircle className="h-5 w-5 text-red-600" /></span>;
                        else if (op?.inForse) statusIcon = <span title="Viaggio in Forse"><AlertTriangle className="h-5 w-5 text-yellow-500" /></span>;

                        // Checklist Status (Simple dot indicator if missing tasks?)
                        const missingTasks = op && (!op.messaggioRiepilogoInviato || !op.listaPasseggeriInviata);

                        return (
                            <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors group">
                                <div className="flex items-start justify-between">
                                    {/* Main Row Content (Clickable) */}
                                    <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={() => toggleProduct(product.id)}>
                                        <div className="bg-blue-100 text-blue-700 rounded-lg p-2 text-center min-w-[3.5rem] relative">
                                            {eventDate ? (
                                                <>
                                                    <div className="text-xs font-medium uppercase">{format(eventDate, "MMM", { locale: it })}</div>
                                                    <div className="text-xl font-bold">{format(eventDate, "dd")}</div>
                                                </>
                                            ) : (
                                                <div className="text-xs font-bold text-gray-500">N/D</div>
                                            )}
                                            {/* Status Badge overlay */}
                                            {statusIcon && <div className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm">{statusIcon}</div>}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {product.name}
                                                </h4>
                                                {/* Workflow Status text/badge */}
                                                {op?.confermato && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">CONFERMATO</span>}
                                                {op?.annullato && <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">ANNULLATO</span>}
                                                {op?.inForse && <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">IN FORSE</span>}
                                            </div>

                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Package className="h-3 w-3" /> SKU: {product.sku}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${bookingCount > 0 ? 'bg-green-100 text-green-700 font-medium' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {bookingCount} Prenotazioni
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setWorkflowProduct(product);
                                            }}
                                            className={`p-2 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${missingTasks && op?.confermato ? "text-orange-500 bg-orange-50 ring-1 ring-orange-200" : "text-gray-400 hover:text-purple-600 hover:bg-purple-50"
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
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
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

                                {expandedProducts[product.id] && (
                                    <ProductBookings product={product} orders={orders} />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            {editingProduct && (
                <ProductEditModal
                    isOpen={!!editingProduct}
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onSave={() => {
                        setEditingProduct(null);
                        if (onRefresh) onRefresh();
                    }}
                />
            )}

            {/* Workflow Modal */}
            {workflowProduct && (
                <TripWorkflowModal
                    isOpen={!!workflowProduct}
                    product={workflowProduct}
                    onClose={() => setWorkflowProduct(null)}
                    onSave={() => {
                        setWorkflowProduct(null);
                        if (onRefresh) onRefresh();
                    }}
                />
            )}
        </div>
    );
}

