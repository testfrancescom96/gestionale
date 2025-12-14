"use client";

import { useState } from "react";
import {
    LayoutDashboard,
    BarChart3,
    Settings,
    Megaphone,
    MousePointer2,
    TrendingUp,
    AlertCircle
} from "lucide-react";

export default function MarketingPage() {
    const [activeTab, setActiveTab] = useState("overview");

    // Placeholder Data for UI
    const [isConfigured, setIsConfigured] = useState(false);

    return (
        <div className="p-8">
            <h1 className="mb-6 text-3xl font-bold text-gray-900 flex items-center gap-3">
                <LayoutDashboard className="h-8 w-8 text-blue-600" />
                Marketing & Sponsorizzate
            </h1>

            {/* Tabs */}
            <div className="mb-8 border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab("overview")}
                        className={`border-b-2 pb-4 text-sm font-medium ${activeTab === "overview"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            }`}
                    >
                        Panoramica
                    </button>
                    <button
                        onClick={() => setActiveTab("campaigns")}
                        className={`border-b-2 pb-4 text-sm font-medium ${activeTab === "campaigns"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            }`}
                    >
                        Campagne Attive
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={`border-b-2 pb-4 text-sm font-medium ${activeTab === "settings"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            }`}
                    >
                        Configurazione Meta
                    </button>
                </nav>
            </div>

            {!isConfigured && activeTab !== "settings" ? (
                <div className="rounded-lg bg-yellow-50 p-6 border border-yellow-200 text-center">
                    <Megaphone className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-yellow-800">Integrazione Meta Ads non configurata</h3>
                    <p className="mt-2 text-sm text-yellow-700">
                        Per visualizzare i dati delle tue campagne Facebook e Instagram, è necessario configurare l'accesso alle API.
                    </p>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 font-medium text-sm"
                    >
                        Vai alla Configurazione
                    </button>
                </div>
            ) : (
                <>
                    {/* OVERVIEW CONTENT */}
                    {activeTab === "overview" && (
                        <div className="space-y-6 fade-in">
                            {/* KPI Cards Placeholder */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-green-100 rounded-full">
                                            <TrendingUp className="h-5 w-5 text-green-600" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">Ultimi 30gg</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Spesa Totale Ads</p>
                                    <h3 className="text-2xl font-bold text-gray-900">€ 0.00</h3>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <MousePointer2 className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">Ultimi 30gg</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Click al Sito</p>
                                    <h3 className="text-2xl font-bold text-gray-900">0</h3>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-purple-100 rounded-full">
                                            <BarChart3 className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">Ultimi 30gg</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Impressions</p>
                                    <h3 className="text-2xl font-bold text-gray-900">0</h3>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-orange-100 rounded-full">
                                            <AlertCircle className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">CPC</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Costo per Click Medio</p>
                                    <h3 className="text-2xl font-bold text-gray-900">€ 0.00</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-lg shadow-sm border h-80 flex items-center justify-center text-gray-400 border-dashed">
                                    Grafico Spesa giornaliera (Placeholder)
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border h-80 flex items-center justify-center text-gray-400 border-dashed">
                                    Grafico Conversioni (Placeholder)
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CAMPAIGNS CONTENT */}
                    {activeTab === "campaigns" && (
                        <div className="bg-white shadow-sm rounded-lg border overflow-hidden fade-in">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campagna</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spesa</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risultati</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" colSpan={4}>
                                            Nessuna campagna trovata.
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* SETTINGS CONTENT */}
            {activeTab === "settings" && (
                <div className="max-w-2xl bg-white p-6 rounded-lg shadow-sm border border-gray-200 fade-in">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Settings className="h-5 w-5 text-gray-500" />
                        Configurazione API Meta
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Ad Account ID (es. act_123456789)
                            </label>
                            <input
                                type="text"
                                placeholder="act_..."
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Access Token (Long-lived)
                            </label>
                            <textarea
                                rows={4}
                                placeholder="EA..."
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none font-mono"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Il token deve avere i permessi <code>ads_read</code> e <code>read_insights</code>.
                            </p>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium">
                                Salva Credenziali
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
