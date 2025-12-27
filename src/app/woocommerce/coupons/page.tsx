"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, RefreshCw, Tag, Percent, DollarSign, Calendar, Users, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { CouponModal } from "@/components/woocommerce/CouponModal";
import { CouponCreditManager } from "@/components/woocommerce/CouponCreditManager";

interface Coupon {
    id: number;
    code: string;
    amount: string;
    discount_type: 'percent' | 'fixed_cart' | 'fixed_product';
    description: string;
    date_expires: string | null;
    usage_count: number;
    usage_limit: number | null;
    usage_limit_per_user: number | null;
    individual_use: boolean;
    minimum_amount: string;
    free_shipping: boolean;
}

export default function CouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

    // Multi-select state
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

    const [activeTab, setActiveTab] = useState<'standard' | 'credits'>('standard');

    const loadCoupons = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/woocommerce/coupons');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setCoupons(data.coupons || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Errore nel caricamento coupon');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCoupons();
    }, []);

    const handleDelete = async (id: number, code: string) => {
        if (!confirm(`Sei sicuro di voler eliminare il coupon "${code}"?`)) return;

        try {
            const res = await fetch(`/api/woocommerce/coupons/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setCoupons(prev => prev.filter(c => c.id !== id));
            setSelectedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        } catch (e) {
            alert(e instanceof Error ? e.message : 'Errore nell\'eliminazione');
        }
    };

    // Batch delete
    const handleBatchDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Sei sicuro di voler eliminare ${selectedIds.size} coupon selezionati?`)) return;

        const idsToDelete = Array.from(selectedIds);
        let successCount = 0;

        for (const id of idsToDelete) {
            try {
                const res = await fetch(`/api/woocommerce/coupons/${id}`, { method: 'DELETE' });
                const data = await res.json();
                if (!data.error) successCount++;
            } catch {
                // Continue with other deletions
            }
        }

        setCoupons(prev => prev.filter(c => !selectedIds.has(c.id)));
        setSelectedIds(new Set());
        alert(`Eliminati ${successCount} di ${idsToDelete.length} coupon.`);
    };

    // Toggle selection
    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Select all visible
    const toggleSelectAll = () => {
        if (selectedIds.size === filteredCoupons.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredCoupons.map(c => c.id)));
        }
    };

    const handleEdit = (coupon: Coupon) => {
        setEditingCoupon(coupon);
        setModalOpen(true);
    };

    const handleCreate = () => {
        setEditingCoupon(null);
        setModalOpen(true);
    };

    const handleModalClose = (refresh?: boolean) => {
        setModalOpen(false);
        setEditingCoupon(null);
        if (refresh) loadCoupons();
    };

    // Filter logic
    const now = new Date();
    const filteredCoupons = coupons.filter(c => {
        if (filter === 'all') return true;
        const isExpired = c.date_expires && new Date(c.date_expires) < now;
        if (filter === 'active') return !isExpired;
        if (filter === 'expired') return isExpired;
        return true;
    });

    const getDiscountTypeLabel = (type: string) => {
        switch (type) {
            case 'percent': return 'Percentuale';
            case 'fixed_cart': return 'Fisso Carrello';
            case 'fixed_product': return 'Fisso Prodotto';
            default: return type;
        }
    };

    const formatDiscount = (coupon: Coupon) => {
        const amount = parseFloat(coupon.amount);
        if (coupon.discount_type === 'percent') {
            return `${amount}%`;
        }
        return `€${amount.toFixed(2)}`;
    };

    const isExpired = (coupon: Coupon) => {
        if (!coupon.date_expires) return false;
        return new Date(coupon.date_expires) < now;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Tag className="h-7 w-7 text-purple-600" />
                        Codici Promozionali
                    </h1>
                    <p className="text-gray-500 mt-1">Gestisci i coupon WooCommerce e i crediti clienti</p>
                </div>

                {activeTab === 'standard' && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadCoupons}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 text-sm font-medium transition-colors"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Aggiorna
                        </button>
                        <button
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition-colors shadow-sm"
                        >
                            <Plus className="h-4 w-4" />
                            Nuovo Coupon
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('standard')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'standard'
                            ? 'border-purple-600 text-purple-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    Coupon Standard
                </button>
                <button
                    onClick={() => setActiveTab('credits')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'credits'
                            ? 'border-purple-600 text-purple-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    Crediti & Borsellino
                </button>
            </div>

            {/* Standard Coupons View */}
            {activeTab === 'standard' && (
                <div className="space-y-6">
                    {/* Filters */}
                    <div className="flex gap-2">
                        {(['all', 'active', 'expired'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {f === 'all' ? 'Tutti' : f === 'active' ? 'Attivi' : 'Scaduti'}
                                {f !== 'all' && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-white rounded text-xs">
                                        {coupons.filter(c => {
                                            const exp = c.date_expires && new Date(c.date_expires) < now;
                                            return f === 'active' ? !exp : exp;
                                        }).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                    )}

                    {/* Coupons Table */}
                    {!loading && filteredCoupons.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                            {/* Batch Action Bar */}
                            {selectedIds.size > 0 && (
                                <div className="bg-purple-50 border-b border-purple-200 px-4 py-3 flex items-center justify-between">
                                    <span className="text-sm font-medium text-purple-700">
                                        {selectedIds.size} coupon selezionati
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleBatchDelete}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Elimina Selezionati
                                        </button>
                                        <button
                                            onClick={() => setSelectedIds(new Set())}
                                            className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-600 rounded-md text-sm font-medium border transition-colors"
                                        >
                                            Annulla
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="text-left px-4 py-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.size === filteredCoupons.length && filteredCoupons.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                    title="Seleziona tutti"
                                                />
                                            </th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Codice</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Sconto</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                                            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Scadenza</th>
                                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Utilizzi</th>
                                            <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Stato</th>
                                            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredCoupons.map((coupon) => (
                                            <tr key={coupon.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(coupon.id) ? 'bg-purple-50' : ''}`}>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(coupon.id)}
                                                        onChange={() => toggleSelect(coupon.id)}
                                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                        title={`Seleziona ${coupon.code}`}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Tag className="h-4 w-4 text-purple-500" />
                                                        <span className="font-mono font-semibold text-gray-900">{coupon.code}</span>
                                                    </div>
                                                    {coupon.description && (
                                                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{coupon.description}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="flex items-center gap-1 text-lg font-bold text-green-600">
                                                        {coupon.discount_type === 'percent' ? <Percent className="h-4 w-4" /> : <DollarSign className="h-4 w-4" />}
                                                        {formatDiscount(coupon)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                                                        {getDiscountTypeLabel(coupon.discount_type)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {coupon.date_expires ? (
                                                        <span className="flex items-center gap-1 text-sm text-gray-600">
                                                            <Calendar className="h-4 w-4" />
                                                            {format(new Date(coupon.date_expires), "dd MMM yyyy", { locale: it })}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">Nessuna</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="flex items-center justify-center gap-1 text-sm">
                                                        <Users className="h-4 w-4 text-gray-400" />
                                                        {coupon.usage_count}
                                                        {coupon.usage_limit && (
                                                            <span className="text-gray-400">/ {coupon.usage_limit}</span>
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {isExpired(coupon) ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                                            <XCircle className="h-3 w-3" />
                                                            Scaduto
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                            <CheckCircle className="h-3 w-3" />
                                                            Attivo
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleEdit(coupon)}
                                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Modifica"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(coupon.id, coupon.code)}
                                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Elimina"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredCoupons.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <Tag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Nessun coupon trovato</h3>
                            <p className="text-gray-500 mt-1">
                                {filter !== 'all'
                                    ? 'Prova a cambiare il filtro'
                                    : 'Crea il tuo primo codice promozionale'}
                            </p>
                            {filter === 'all' && (
                                <button
                                    onClick={handleCreate}
                                    className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition-colors"
                                >
                                    <Plus className="h-4 w-4 inline mr-2" />
                                    Crea Coupon
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Credit Manager View */}
            {activeTab === 'credits' && (
                <CouponCreditManager />
            )}

            {/* Modal */}
            {modalOpen && (
                <CouponModal
                    coupon={editingCoupon}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
}
