"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Search, History } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface CouponCreditTransaction {
    id: string;
    amount: number;
    orderId?: number;
    orderTotal?: number;
    productName?: string;
    balanceBefore: number;
    balanceAfter: number;
    createdAt: string;
}

interface CouponCredit {
    id: string;
    couponCode: string;
    customerEmail: string;
    customerName?: string;
    originalAmount: number;
    usedAmount: number;
    remainingCredit: number;
    lastUsedAt?: string;
    lastOrderId?: number;
    notes?: string;
    transactions: CouponCreditTransaction[];
    updatedAt: string;
}

export function CouponCreditManager() {
    const [credits, setCredits] = useState<CouponCredit[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal states
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [viewHistory, setViewHistory] = useState<CouponCredit | null>(null);

    // Form state
    const [newCredit, setNewCredit] = useState({
        couponCode: "",
        customerEmail: "",
        customerName: "",
        originalAmount: "",
        notes: ""
    });

    const loadCredits = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/woocommerce/coupon-credits');
            const data = await res.json();
            setCredits(data.credits || []);
        } catch (error) {
            console.error("Error loading credits:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCredits();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/woocommerce/coupon-credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCredit)
            });
            const data = await res.json();

            if (res.ok) {
                setCredits(prev => [data.credit, ...prev]);
                setIsAddOpen(false);
                setNewCredit({ couponCode: "", customerEmail: "", customerName: "", originalAmount: "", notes: "" });
            } else {
                alert(data.error || "Errore nella creazione");
            }
        } catch (error) {
            alert("Errore di connessione");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questo credito?")) return;
        try {
            const res = await fetch(`/api/woocommerce/coupon-credits?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCredits(prev => prev.filter(c => c.id !== id));
            }
        } catch (error) {
            alert("Errore durante l'eliminazione");
        }
    };

    const filteredCredits = credits.filter(c =>
        c.couponCode.toLowerCase().includes(search.toLowerCase()) ||
        c.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
        (c.customerName && c.customerName.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cerca coupon o email..."
                        className="pl-8 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setIsAddOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Nuovo Credito
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8 text-gray-500">Caricamento...</div>
            ) : (
                <div className="bg-white rounded-lg shadow border overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
                            <tr>
                                <th className="px-4 py-3">Coupon</th>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3 text-right">Originale (€)</th>
                                <th className="px-4 py-3 text-right">Usato (€)</th>
                                <th className="px-4 py-3 text-right">Residuo (€)</th>
                                <th className="px-4 py-3 text-center">Storico</th>
                                <th className="px-4 py-3 text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCredits.map((credit) => (
                                <tr key={credit.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium text-blue-600">{credit.couponCode}</td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{credit.customerName || "-"}</div>
                                        <div className="text-xs text-gray-500">{credit.customerEmail}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium">{credit.originalAmount.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right text-orange-600">{credit.usedAmount.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right font-bold text-green-600">{credit.remainingCredit.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => setViewHistory(credit)}
                                            className="text-gray-500 hover:text-blue-600 transition-colors"
                                            title="Vedi storico transazioni"
                                            aria-label="Vedi storico transazioni"
                                        >
                                            <History className="h-4 w-4 inline" />
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(credit.id)}
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                            title="Elimina credito"
                                            aria-label="Elimina credito"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredCredits.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        Nessun credito trovato
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Nuovo Credito Coupon</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Codice Coupon *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={newCredit.couponCode}
                                    onChange={e => setNewCredit({ ...newCredit, couponCode: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Cliente *</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full border rounded px-3 py-2"
                                    value={newCredit.customerEmail}
                                    onChange={e => setNewCredit({ ...newCredit, customerEmail: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Cliente</label>
                                <input
                                    type="text"
                                    className="w-full border rounded px-3 py-2"
                                    value={newCredit.customerName}
                                    onChange={e => setNewCredit({ ...newCredit, customerName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Importo Originale (€) *</label>
                                <input
                                    required
                                    type="number"
                                    step="0.01"
                                    className="w-full border rounded px-3 py-2"
                                    value={newCredit.originalAmount}
                                    onChange={e => setNewCredit({ ...newCredit, originalAmount: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                                <textarea
                                    className="w-full border rounded px-3 py-2"
                                    value={newCredit.notes}
                                    onChange={e => setNewCredit({ ...newCredit, notes: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Salva
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {viewHistory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <History className="h-5 w-5 text-blue-600" />
                                    Storico Transazioni
                                </h2>
                                <p className="text-gray-500 mt-1">
                                    Coupon: <span className="font-mono text-gray-900 font-medium">{viewHistory.couponCode}</span>
                                </p>
                            </div>
                            <button onClick={() => setViewHistory(null)} className="text-gray-400 hover:text-gray-600">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Summary Card */}
                            <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border">
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">Originale</div>
                                    <div className="text-lg font-bold">€{viewHistory.originalAmount.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">Utilizzato</div>
                                    <div className="text-lg font-bold text-orange-600">€{viewHistory.usedAmount.toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-gray-500 uppercase">Rimanente</div>
                                    <div className="text-lg font-bold text-green-600">€{viewHistory.remainingCredit.toFixed(2)}</div>
                                </div>
                            </div>

                            {/* Transactions Timeline */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Timeline Utilizzi</h3>
                                <div className="space-y-4">
                                    {viewHistory.transactions && viewHistory.transactions.length > 0 ? (
                                        viewHistory.transactions.map((tx) => (
                                            <div key={tx.id} className="relative flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                                                <div className="mt-1">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500 ring-4 ring-blue-50" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <div className="text-sm text-gray-500">
                                                                {format(new Date(tx.createdAt), "dd MMM yyyy HH:mm", { locale: it })}
                                                            </div>
                                                            <div className="font-medium text-gray-900 mt-0.5">
                                                                Ordine #{tx.orderId || "N/A"}
                                                            </div>
                                                            {tx.productName && (
                                                                <div className="text-sm text-gray-600 mt-1">
                                                                    {tx.productName}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-bold text-red-600">- €{tx.amount.toFixed(2)}</div>
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                Saldo: €{tx.balanceBefore.toFixed(2)} → €{tx.balanceAfter.toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-400 italic">
                                            Nessuna transazione registrata
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {viewHistory.notes && (
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                    <h3 className="text-xs font-semibold text-yellow-800 uppercase mb-1">Note Interne</h3>
                                    <p className="text-sm text-yellow-700">{viewHistory.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setViewHistory(null)}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                            >
                                Chiudi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
