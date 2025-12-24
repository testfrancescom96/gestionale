"use client";

import { useEffect, useState } from "react";
import {
    LayoutDashboard,
    BarChart3,
    Megaphone,
    MousePointer2,
    TrendingUp,
    AlertCircle,
    RefreshCw,
    Users,
    FileText,
    ShoppingCart,
    MapPin,
    Target,
    ArrowUp,
    ArrowDown
} from "lucide-react";

export default function MarketingPage() {
    const [activeTab, setActiveTab] = useState("overview");
    const [data, setData] = useState<any>(null);
    const [businessData, setBusinessData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [metaRes, businessRes] = await Promise.all([
                fetch("/api/marketing/stats"),
                fetch("/api/marketing/business-stats")
            ]);
            const metaJson = await metaRes.json();
            const businessJson = await businessRes.json();
            setData(metaJson);
            setBusinessData(businessJson);
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
                            {/* Meta Ads KPI Cards */}
                            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-blue-500" />
                                Sponsorizzate Meta
                            </h3>
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

                            {/* Nuove Metriche Avanzate */}
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-4">
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-indigo-100 rounded-full">
                                            <Users className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">Reach</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Utenti Raggiunti</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{new Intl.NumberFormat('it-IT').format(data.insights.reach || 0)}</h3>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-cyan-100 rounded-full">
                                            <RefreshCw className="h-5 w-5 text-cyan-600" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">Frequency</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Media Visualizzazioni/Utente</p>
                                    <h3 className="text-2xl font-bold text-gray-900">{(data.insights.frequency || 0).toFixed(2)}</h3>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-teal-100 rounded-full">
                                            <MousePointer2 className="h-5 w-5 text-teal-600" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">Actions</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Link Click</p>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {data.insights.actions?.find((a: { action_type: string; value: string }) => a.action_type === 'link_click')?.value || 0}
                                    </h3>
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-2 bg-rose-100 rounded-full">
                                            <Target className="h-5 w-5 text-rose-600" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-500">Totale</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">Azioni Totali</p>
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {data.insights.actions?.reduce((sum: number, a: { action_type: string; value: string }) => sum + parseInt(a.value || '0'), 0) || 0}
                                    </h3>
                                </div>
                            </div>

                            {/* Business Stats Section */}
                            {businessData && (
                                <>
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-2 mt-8">
                                        <Target className="h-5 w-5 text-green-500" />
                                        Performance Business (Ultimi 30gg)
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-2 bg-blue-100 rounded-full">
                                                    <FileText className="h-5 w-5 text-blue-600" />
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-gray-500">Pratiche Create</p>
                                            <h3 className="text-2xl font-bold text-gray-900">{businessData.ultimi30giorni?.praticheCreate || 0}</h3>
                                        </div>
                                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-2 bg-green-100 rounded-full">
                                                    <Target className="h-5 w-5 text-green-600" />
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-gray-500">Tasso Conversione</p>
                                            <h3 className="text-2xl font-bold text-green-600">{businessData.ultimi30giorni?.conversionRate || 0}%</h3>
                                        </div>
                                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-2 bg-purple-100 rounded-full">
                                                    <Users className="h-5 w-5 text-purple-600" />
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-gray-500">Nuovi Clienti</p>
                                            <h3 className="text-2xl font-bold text-gray-900">{businessData.ultimi30giorni?.clientiNuovi || 0}</h3>
                                        </div>
                                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-2 bg-orange-100 rounded-full">
                                                    <ShoppingCart className="h-5 w-5 text-orange-600" />
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-gray-500">Ordini WooCommerce</p>
                                            <h3 className="text-2xl font-bold text-gray-900">{businessData.ultimi30giorni?.ordiniWoo || 0}</h3>
                                        </div>
                                    </div>

                                    {/* Trend Annuale */}
                                    <h3 className="font-semibold text-gray-700 flex items-center gap-2 mt-8">
                                        <TrendingUp className="h-5 w-5 text-blue-500" />
                                        Trend Annuale ({new Date().getFullYear()})
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Pratiche Anno</p>
                                                    <h3 className="text-3xl font-bold text-gray-900">{businessData.annuale?.pratiche || 0}</h3>
                                                    <p className="text-xs text-gray-400">vs {businessData.annuale?.praticheAnnoScorso || 0} anno scorso</p>
                                                </div>
                                                <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${businessData.annuale?.trendPratiche >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {businessData.annuale?.trendPratiche >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                                                    <span className="font-bold">{Math.abs(businessData.annuale?.trendPratiche || 0)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-500">Fatturato Anno</p>
                                                    <h3 className="text-3xl font-bold text-gray-900">{formatMoney(businessData.annuale?.fatturato || 0)}</h3>
                                                    <p className="text-xs text-gray-400">vs {formatMoney(businessData.annuale?.fatturatoAnnoScorso || 0)} anno scorso</p>
                                                </div>
                                                <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${businessData.annuale?.trendFatturato >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {businessData.annuale?.trendFatturato >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                                                    <span className="font-bold">{Math.abs(businessData.annuale?.trendFatturato || 0)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Top Destinazioni */}
                                    {businessData.topDestinazioni?.length > 0 && (
                                        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mt-6">
                                            <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
                                                <MapPin className="h-5 w-5 text-red-500" />
                                                Top Destinazioni (30gg)
                                            </h4>
                                            <div className="space-y-3">
                                                {businessData.topDestinazioni.map((d: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between">
                                                        <span className="text-gray-700">{d.destinazione}</span>
                                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">{d.count} pratiche</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
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
