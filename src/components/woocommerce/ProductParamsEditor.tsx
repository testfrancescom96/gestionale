"use client";

import { useState, useEffect } from "react";
import {
    Settings, Save, Loader2, History, X, Check,
    AlertTriangle, ExternalLink, RefreshCw
} from "lucide-react";

interface Props {
    productId: number;
    productName: string;
    isOpen: boolean;
    onClose: () => void;
}

interface ProductData {
    id: number;
    name: string;
    price?: number;
    stockQuantity?: number;
    manageStock?: boolean;
    menuOrder?: number;
    sku?: string;
    status?: string;
    permalink?: string;
}

interface ModificationLog {
    id: number;
    fieldName: string;
    oldValue?: string;
    newValue?: string;
    modifiedBy?: string;
    modifiedAt: string;
    syncedToWoo: boolean;
    syncError?: string;
}

export default function ProductParamsEditor({ productId, productName, isOpen, onClose }: Props) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [product, setProduct] = useState<ProductData | null>(null);
    const [editedProduct, setEditedProduct] = useState<ProductData | null>(null);
    const [logs, setLogs] = useState<ModificationLog[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

    // Pricing state
    const [pricing, setPricing] = useState<{ id: number; nome: string; prezzo: number; ordine: number; attivo: boolean }[]>([]);
    const [newTariffa, setNewTariffa] = useState({ nome: '', prezzo: '' });
    const [savingPricing, setSavingPricing] = useState(false);

    useEffect(() => {
        if (isOpen && productId) {
            loadProduct();
            loadHistory();
            loadPricing();
        }
    }, [isOpen, productId]);

    const loadProduct = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/woocommerce/products/${productId}`);
            const data = await res.json();
            setProduct(data);
            setEditedProduct({ ...data });
        } catch (error) {
            console.error("Error loading product:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadHistory = async () => {
        try {
            const res = await fetch(`/api/woocommerce/products/${productId}/update`);
            const data = await res.json();
            setLogs(data);
        } catch (error) {
            console.error("Error loading history:", error);
        }
    };

    const loadPricing = async () => {
        try {
            const res = await fetch(`/api/woocommerce/products/${productId}/pricing`);
            const data = await res.json();
            setPricing(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error loading pricing:", error);
        }
    };

    const addTariffa = async () => {
        if (!newTariffa.nome || !newTariffa.prezzo) return;
        setSavingPricing(true);
        try {
            const res = await fetch(`/api/woocommerce/products/${productId}/pricing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: newTariffa.nome, prezzo: parseFloat(newTariffa.prezzo) })
            });
            if (res.ok) {
                setNewTariffa({ nome: '', prezzo: '' });
                loadPricing();
            }
        } catch (error) {
            console.error("Error adding tariff:", error);
        } finally {
            setSavingPricing(false);
        }
    };

    const deleteTariffa = async (pricingId: number) => {
        if (!confirm('Eliminare questa tariffa?')) return;
        try {
            await fetch(`/api/woocommerce/products/${productId}/pricing?pricingId=${pricingId}`, { method: 'DELETE' });
            loadPricing();
        } catch (error) {
            console.error("Error deleting tariff:", error);
        }
    };

    const hasChanges = () => {
        if (!product || !editedProduct) return false;
        const p = product as any;
        const e = editedProduct as any;
        return (
            p.stockQuantity !== e.stockQuantity ||
            p.manageStock !== e.manageStock ||
            (p.menuOrder || 0) !== (e.menuOrder || 0)
        );
    };

    const getChanges = () => {
        if (!product || !editedProduct) return [];
        const changes: { field: string; from: any; to: any }[] = [];
        const p = product as any;
        const e = editedProduct as any;

        if (p.stockQuantity !== e.stockQuantity) {
            changes.push({ field: 'Quantità Stock', from: p.stockQuantity || 0, to: e.stockQuantity || 0 });
        }
        if (p.manageStock !== e.manageStock) {
            changes.push({ field: 'Gestione Stock', from: p.manageStock ? 'Sì' : 'No', to: e.manageStock ? 'Sì' : 'No' });
        }
        if ((p.menuOrder || 0) !== (e.menuOrder || 0)) {
            changes.push({ field: 'Posizione Menu', from: p.menuOrder || 0, to: e.menuOrder || 0 });
        }

        return changes;
    };

    const handleSave = async () => {
        if (!editedProduct) return;

        setSaving(true);
        setSaveResult(null);

        try {
            const e = editedProduct as any;
            const res = await fetch(`/api/woocommerce/products/${productId}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updates: {
                        stockQuantity: e.stockQuantity,
                        manageStock: e.manageStock,
                        menuOrder: e.menuOrder,
                    },
                    modifiedBy: 'Operatore'
                })
            });

            const result = await res.json();

            if (result.success) {
                setSaveResult({
                    success: true,
                    message: result.message
                });
                setProduct({ ...editedProduct });
                loadHistory();
            } else {
                setSaveResult({
                    success: false,
                    message: result.error || 'Errore durante il salvataggio'
                });
            }
        } catch (error: any) {
            setSaveResult({
                success: false,
                message: error.message || 'Errore di connessione'
            });
        } finally {
            setSaving(false);
            setShowConfirm(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <Settings className="h-5 w-5" />
                        <div>
                            <h2 className="font-bold">Modifica Parametri Prodotto</h2>
                            <p className="text-xs text-blue-100">{productName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-white/20' : 'hover:bg-white/10'}`}
                            title="Storico modifiche"
                        >
                            <History className="h-5 w-5" />
                        </button>
                        {product?.permalink && (
                            <a
                                href={product.permalink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                                title="Apri su WooCommerce"
                            >
                                <ExternalLink className="h-5 w-5" />
                            </a>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                        </div>
                    ) : showHistory ? (
                        /* History View */
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Storico Modifiche
                            </h3>
                            {logs.length === 0 ? (
                                <p className="text-gray-500 text-sm italic">Nessuna modifica registrata</p>
                            ) : (
                                <div className="space-y-2">
                                    {logs.map((log) => (
                                        <div
                                            key={log.id}
                                            className={`p-3 rounded-lg border ${log.syncedToWoo ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}
                                        >
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-gray-700">{log.fieldName}</span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(log.modifiedAt).toLocaleString('it-IT')}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                <span className="line-through text-red-500">{log.oldValue || '(vuoto)'}</span>
                                                {' → '}
                                                <span className="text-green-600">{log.newValue || '(vuoto)'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1 text-xs">
                                                {log.syncedToWoo ? (
                                                    <span className="text-green-600 flex items-center gap-1">
                                                        <Check className="h-3 w-3" /> Sincronizzato
                                                    </span>
                                                ) : (
                                                    <span className="text-yellow-600 flex items-center gap-1">
                                                        <AlertTriangle className="h-3 w-3" /> Non sincronizzato
                                                    </span>
                                                )}
                                                {log.modifiedBy && (
                                                    <span className="text-gray-400">• {log.modifiedBy}</span>
                                                )}
                                            </div>
                                            {log.syncError && (
                                                <p className="text-xs text-red-500 mt-1">{log.syncError}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Edit Form */
                        <div className="space-y-6">
                            {/* Visibility Status Banner */}
                            <div className={`rounded-lg p-4 border-2 flex items-center justify-between ${product?.status === 'publish'
                                ? 'bg-green-50 border-green-300'
                                : product?.status === 'draft'
                                    ? 'bg-orange-50 border-orange-300'
                                    : 'bg-gray-50 border-gray-300'
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full ${product?.status === 'publish'
                                        ? 'bg-green-500'
                                        : product?.status === 'draft'
                                            ? 'bg-orange-500'
                                            : 'bg-gray-500'
                                        }`}></div>
                                    <div>
                                        <p className="font-bold text-gray-800">
                                            {product?.status === 'publish' && '✅ VISIBILE SUL SITO'}
                                            {product?.status === 'draft' && '📝 BOZZA - Non visibile'}
                                            {product?.status === 'private' && '🔒 PRIVATO'}
                                            {product?.status === 'pending' && '⏳ In attesa di revisione'}
                                            {!['publish', 'draft', 'private', 'pending'].includes(product?.status || '') && `Stato: ${product?.status}`}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {product?.status === 'publish' && 'Questo prodotto è pubblicato e visibile ai clienti'}
                                            {product?.status === 'draft' && 'Questo prodotto è in bozza. Pubblicalo da WooCommerce per renderlo visibile.'}
                                            {product?.status === 'private' && 'Visibile solo agli amministratori'}
                                        </p>
                                    </div>
                                </div>
                                {product?.permalink && (
                                    <a
                                        href={product.permalink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        Vedi sul sito
                                    </a>
                                )}
                            </div>

                            {/* Stock */}
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                <h3 className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                    📦 Inventario
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Quantità Disponibile
                                        </label>
                                        <input
                                            type="number"
                                            value={editedProduct?.stockQuantity ?? ''}
                                            onChange={(e) => setEditedProduct(prev => prev ? { ...prev, stockQuantity: parseInt(e.target.value) || 0 } : null)}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-bold"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border w-full">
                                            <input
                                                type="checkbox"
                                                checked={editedProduct?.manageStock || false}
                                                onChange={(e) => setEditedProduct(prev => prev ? { ...prev, manageStock: e.target.checked } : null)}
                                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-gray-700">Gestisci Stock</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Menu Order / Priorità */}
                            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                                <h3 className="text-sm font-semibold text-purple-800 mb-3 flex items-center gap-2">
                                    ⭐ Ordinamento / Priorità
                                </h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Posizione Menu (0 = default, numeri bassi = prima)
                                    </label>
                                    <input
                                        type="number"
                                        value={(editedProduct as any)?.menuOrder || 0}
                                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, menuOrder: parseInt(e.target.value) || 0 } as any : null)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="0"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Imposta un numero basso (es. -10, -5) per mettere in evidenza in cima al sito.
                                        Lascia 0 per ordinamento per data.
                                    </p>
                                </div>
                            </div>

                            {/* Tariffe (Pricing) Section */}
                            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                <h3 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                                    💰 Tariffe Prodotto
                                </h3>
                                <p className="text-xs text-gray-500 mb-3">
                                    Definisci le tariffe per questo prodotto (es. Adulto, Bambino, Under 12)
                                </p>

                                {/* Existing Tariffs */}
                                {pricing.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        {pricing.map(t => (
                                            <div key={t.id} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                                                <div>
                                                    <span className="font-medium text-gray-800">{t.nome}</span>
                                                    <span className="text-green-600 font-bold ml-2">€{t.prezzo}</span>
                                                </div>
                                                <button
                                                    onClick={() => deleteTariffa(t.id)}
                                                    className="text-red-500 hover:text-red-700 text-sm"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add New Tariff */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Nome (es. Adulto)"
                                        value={newTariffa.nome}
                                        onChange={e => setNewTariffa({ ...newTariffa, nome: e.target.value })}
                                        className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Prezzo €"
                                        value={newTariffa.prezzo}
                                        onChange={e => setNewTariffa({ ...newTariffa, prezzo: e.target.value })}
                                        className="w-24 px-3 py-2 border rounded-lg text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={addTariffa}
                                        disabled={savingPricing || !newTariffa.nome || !newTariffa.prezzo}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                                    >
                                        +
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Prezzo base WooCommerce: €{product?.price || 0}</p>
                            </div>

                            {/* Info */}
                            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                                <p><strong>SKU:</strong> {product?.sku || 'N/A'}</p>
                                <p><strong>Prezzo:</strong> €{product?.price || 0}</p>
                            </div>

                            {/* Save Result */}
                            {saveResult && (
                                <div className={`p-4 rounded-lg ${saveResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {saveResult.success ? <Check className="inline h-4 w-4 mr-2" /> : <AlertTriangle className="inline h-4 w-4 mr-2" />}
                                    {saveResult.message}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!showHistory && (
                    <div className="flex items-center justify-between p-4 border-t bg-gray-50 rounded-b-xl">
                        <button
                            onClick={loadProduct}
                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            disabled={loading}
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Ricarica
                        </button>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={() => setShowConfirm(true)}
                                disabled={!hasChanges() || saving}
                                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${hasChanges()
                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {saving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4" />
                                )}
                                Salva su WooCommerce
                            </button>
                        </div>
                    </div>
                )}

                {/* Confirmation Modal */}
                {showConfirm && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                        <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md">
                            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                Conferma Modifiche
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Stai per salvare le seguenti modifiche su WooCommerce:
                            </p>
                            <ul className="space-y-2 mb-6">
                                {getChanges().map((change, idx) => (
                                    <li key={idx} className="text-sm bg-gray-50 p-2 rounded">
                                        <strong>{change.field}:</strong>{' '}
                                        <span className="text-red-500 line-through">{change.from}</span>
                                        {' → '}
                                        <span className="text-green-600">{change.to}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Annulla
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    Conferma e Salva
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
