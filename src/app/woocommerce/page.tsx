"use client";

import { useState } from "react";
import { OrdersList } from "@/components/woocommerce/OrdersList";
import { WooDashboard } from "@/components/woocommerce/WooDashboard";
import { ShoppingBag, LayoutDashboard } from "lucide-react";

export default function WooCommercePage() {
    const [activeTab, setActiveTab] = useState<"dashboard" | "orders" | "products">("dashboard");

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Integrazione WooCommerce</h1>
                        <p className="mt-2 text-gray-600">
                            Monitora eventi, gestisci prenotazioni e sincronizza il catalogo.
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 flex space-x-4 border-b border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab("dashboard")}
                        className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "dashboard"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            }`}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Catalogo Eventi
                    </button>
                    <button
                        onClick={() => setActiveTab("orders")}
                        className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === "orders"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            }`}
                    >
                        <ShoppingBag className="h-4 w-4" />
                        Tutti gli Ordini
                    </button>
                </div>

                {/* Content */}
                <div>
                    {activeTab === "dashboard" && <WooDashboard />}
                    {activeTab === "orders" && <OrdersList />}
                </div>
            </div>
        </div>
    );
}
