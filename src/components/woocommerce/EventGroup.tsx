
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { ChevronDown, ChevronRight, Calendar, Package } from "lucide-react";
import { GroupedEvent } from "@/lib/woo-utils";
import { ProductBookings } from "./ProductBookings";

interface EventGroupProps {
    data: GroupedEvent;
    orders: any[];
}

export function EventGroup({ data, orders }: EventGroupProps) {
    // Determine if the group (Month) is expanded
    // By default, expand if it's the current month or future? Let's keep closed to save space, or open current?
    // Let's start with collapsed.
    const [isExpanded, setIsExpanded] = useState(true);

    // Track which products are expanded to show bookings
    const [expandedProducts, setExpandedProducts] = useState<Record<number, boolean>>({});

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
                    {data.products.map(product => {
                        const eventDate = product.eventDate;
                        // Count bookings for this product
                        const bookingCount = orders.filter(o =>
                            o.line_items.some((item: any) => item.product_id === product.id)
                        ).length;

                        return (
                            <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between cursor-pointer" onClick={() => toggleProduct(product.id)}>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-blue-100 text-blue-700 rounded-lg p-2 text-center min-w-[3.5rem]">
                                            <div className="text-xs font-medium uppercase">{format(eventDate, "MMM", { locale: it })}</div>
                                            <div className="text-xl font-bold">{format(eventDate, "dd")}</div>
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-gray-900">{product.name}</h4>
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
                                    <div className="text-gray-400">
                                        {expandedProducts[product.id] ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
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
        </div>
    );
}

