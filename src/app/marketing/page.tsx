"use client";

import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    BarChart3,
    Megaphone,
    MousePointer2,
    TrendingUp,
    AlertCircle,
    RefreshCw
} from "lucide-react";

export default function MarketingPage() {
    const [activeTab, setActiveTab] = useState("overview");
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/marketing/stats");
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Helper to format currency
    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(amount);
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <LayoutDashboard className="h-8 w-8 text-blue-600" />
                    Marketing & Sponsorizzate
                </h1>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 text-gray-700"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Sincronizza
                </button>
            </div>

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
                </nav>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-500">
                    <RefreshCw className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-500" />
                    Caricamento dati da Meta...
                </div>
            ) : (
                <>
                    {/* OVERVIEW CONTENT */}
                    {activeTab === "overview" && data?.insights && (
                        <div className="space-y-6 fade-in">
                            {/* KPI Cards */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-green-100 rounded-full">
                                            <TrendingUp className="h-5 w-5 text-green-600" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">Ultimi 30gg</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Spesa Totale Ads</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{formatMoney(data.insights.spend)}</h3>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <MousePointer2 className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">Ultimi 30gg</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Click al Sito</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{data.insights.clicks}</h3>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-purple-100 rounded-full">
                                            <BarChart3 className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">Ultimi 30gg</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Impressions</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{new Intl.NumberFormat('it-IT').format(data.insights.impressions)}</h3>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-orange-100 rounded-full">
                                            <AlertCircle className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">CPC</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Costo per Click Medio</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{formatMoney(data.insights.cpc)}</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CAMPAIGNS CONTENT */}
                    {activeTab === "campaigns" && data?.campaigns && (
                        <div className="bg-white shadow-sm rounded-lg border overflow-hidden fade-in">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campagna</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spesa (30gg)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Click</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPC</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {data.campaigns.length > 0 ? (
                                        data.campaigns.map((c: any) => {
                                            const ins = data.campaignInsights[c.id] || { spend: 0, clicks: 0, cpc: 0 };
                                            return (
                                                <tr key={c.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{c.name}</div>
                                                        <div className="text-xs text-gray-500">ID: {c.id}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatMoney(ins.spend)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {ins.clicks}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatMoney(ins.cpc)}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center" colSpan={5}>
                                                Nessuna campagna attiva trovata.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
