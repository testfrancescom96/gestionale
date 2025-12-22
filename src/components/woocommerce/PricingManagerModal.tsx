"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save, Settings, Loader2 } from "lucide-react";

interface Pricing {
    id: number;
    nome: string;
    prezzo: number;
    ordine: number;
    attivo: boolean;
}

interface Props {
    productId: number;
    productName: string;
    isOpen: boolean;
    onClose: () => void;
    onSaved?: () => void;
}

export default function PricingManagerModal({ productId, productName, isOpen, onClose, onSaved }: Props) {
    const [pricing, setPricing] = useState<Pricing[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newPricing, setNewPricing] = useState({ nome: "", prezzo: "" });

    // Default pricing templates
    const defaultTemplates = [
        { nome: "Acconto", prezzo: 10 },
        { nome: "Saldo Adulto Intero", prezzo: 0 },
        { nome: "Saldo Adulto Ridotto", prezzo: 0 },
        { nome: "Saldo Bambino", prezzo: 0 },
    ];

    useEffect(() => {
        if (isOpen && productId) {
            fetchPricing();
        }
    }, [isOpen, productId]);

    const fetchPricing = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/woocommerce/products/${productId}/pricing`);
            const data = await res.json();
            setPricing(data || []);
        } catch (error) {
            console.error("Error fetching pricing:", error);
        } finally {
            setLoading(false);
        }
    };

    const addPricing = async () => {
        if (!newPricing.nome || !newPricing.prezzo) {
            alert("Nome e prezzo sono obbligatori");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/woocommerce/products/${productId}/pricing`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: newPricing.nome,
                    prezzo: parseFloat(newPricing.prezzo),
                    ordine: pricing.length
                })
            });

            if (res.ok) {
                setNewPricing({ nome: "", prezzo: "" });
                fetchPricing();
                onSaved?.();
            }
        } catch (error) {
            console.error("Error adding pricing:", error);
        } finally {
            setSaving(false);
        }
    };

    const updatePricing = async (id: number, data: Partial<Pricing>) => {
        const item = pricing.find(p => p.id === id);
        if (!item) return;

        setSaving(true);
        try {
            await fetch(`/api/woocommerce/products/${productId}/pricing`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    pricingId: id,
                    nome: data.nome ?? item.nome,
                    prezzo: data.prezzo ?? item.prezzo,
                    ordine: data.ordine ?? item.ordine,
                    attivo: data.attivo ?? item.attivo
                })
            });
            fetchPricing();
            onSaved?.();
        } catch (error) {
            console.error("Error updating pricing:", error);
        } finally {
            setSaving(false);
        }
    };

    const deletePricing = async (id: number) => {
        if (!confirm("Eliminare questa tariffa?")) return;

        try {
            await fetch(`/api/woocommerce/products/${productId}/pricing?pricingId=${id}`, {
                method: "DELETE"
            });
            fetchPricing();
            onSaved?.();
        } catch (error) {
            console.error("Error deleting pricing:", error);
        }
    };

    const addDefaultTemplates = async () => {
        setSaving(true);
        for (const template of defaultTemplates) {
            await fetch(`/api/woocommerce/products/${productId}/pricing`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: template.nome,
                    prezzo: template.prezzo,
                    ordine: pricing.length + defaultTemplates.indexOf(template)
                })
            });
        }
        setSaving(false);
        fetchPricing();
        onSaved?.();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Gestione Tariffe
                        </h2>
                        <p className="text-amber-100 text-sm">{productName}</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-amber-200">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[60vh] overflow-auto">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                        </div>
                    ) : (
                        <>
                            {/* Info box */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-sm text-amber-800">
                                💡 Imposta le tariffe per questo viaggio. Es: Acconto €10, Saldo Adulto €45, Saldo Bambino €35
                            </div>

                            {/* Empty state */}
                            {pricing.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <p className="mb-3">Nessuna tariffa configurata</p>
                                    <button
                                        onClick={addDefaultTemplates}
                                        disabled={saving}
                                        className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aggiungi Template Base"}
                                    </button>
                                </div>
                            )}

                            {/* Pricing list */}
                            <div className="space-y-2">
                                {pricing.map((p) => (
                                    <div key={p.id} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                                        <input
                                            type="text"
                                            value={p.nome}
                                            onChange={(e) => setPricing(prev => prev.map(x => x.id === p.id ? { ...x, nome: e.target.value } : x))}
                                            onBlur={() => updatePricing(p.id, { nome: pricing.find(x => x.id === p.id)?.nome })}
                                            className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm"
                                            placeholder="Nome tariffa"
                                        />
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-500 text-sm">€</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={p.prezzo}
                                                onChange={(e) => setPricing(prev => prev.map(x => x.id === p.id ? { ...x, prezzo: parseFloat(e.target.value) || 0 } : x))}
                                                onBlur={() => updatePricing(p.id, { prezzo: pricing.find(x => x.id === p.id)?.prezzo })}
                                                className="w-20 border border-gray-200 rounded px-2 py-1 text-sm text-right"
                                            />
                                        </div>
                                        <button
                                            onClick={() => deletePricing(p.id)}
                                            className="p-1 text-red-400 hover:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Add new */}
                            {pricing.length > 0 && (
                                <div className="mt-4 flex items-center gap-2 p-3 border-2 border-dashed border-gray-200 rounded-lg">
                                    <input
                                        type="text"
                                        value={newPricing.nome}
                                        onChange={(e) => setNewPricing({ ...newPricing, nome: e.target.value })}
                                        placeholder="Nome nuova tariffa"
                                        className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm"
                                    />
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-500 text-sm">€</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={newPricing.prezzo}
                                            onChange={(e) => setNewPricing({ ...newPricing, prezzo: e.target.value })}
                                            placeholder="0.00"
                                            className="w-20 border border-gray-200 rounded px-2 py-1 text-sm text-right"
                                        />
                                    </div>
                                    <button
                                        onClick={addPricing}
                                        disabled={saving || !newPricing.nome || !newPricing.prezzo}
                                        className="p-1 text-green-500 hover:text-green-700 disabled:opacity-50"
                                    >
                                        <Plus className="h-5 w-5" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
}
