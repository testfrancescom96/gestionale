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
    description?: string;
    regularPrice?: number;
    salePrice?: number;
    price?: number;
    stockQuantity?: number;
    manageStock?: boolean;
    sku?: string;
    status?: string;
    permalink?: string;
    metaData?: string;
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

    useEffect(() => {
        if (isOpen && productId) {
            loadProduct();
            loadHistory();
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

    const hasChanges = () => {
        if (!product || !editedProduct) return false;
        return (
            product.name !== editedProduct.name ||
            product.description !== editedProduct.description ||
            product.regularPrice !== editedProduct.regularPrice ||
            product.salePrice !== editedProduct.salePrice ||
            product.stockQuantity !== editedProduct.stockQuantity ||
            product.manageStock !== editedProduct.manageStock
        );
    };

    const getChanges = () => {
        if (!product || !editedProduct) return [];
        const changes: { field: string; from: any; to: any }[] = [];

        if (product.name !== editedProduct.name) {
            changes.push({ field: 'Nome', from: product.name, to: editedProduct.name });
        }
        if (product.description !== editedProduct.description) {
            changes.push({ field: 'Descrizione', from: product.description || '(vuoto)', to: editedProduct.description || '(vuoto)' });
        }
        if (product.regularPrice !== editedProduct.regularPrice) {
            changes.push({ field: 'Prezzo', from: `€${product.regularPrice || 0}`, to: `€${editedProduct.regularPrice || 0}` });
        }
        if (product.salePrice !== editedProduct.salePrice) {
            changes.push({ field: 'Prezzo Scontato', from: `€${product.salePrice || 0}`, to: `€${editedProduct.salePrice || 0}` });
        }
        if (product.stockQuantity !== editedProduct.stockQuantity) {
            changes.push({ field: 'Stock', from: product.stockQuantity, to: editedProduct.stockQuantity });
        }

        return changes;
    };

    const handleSave = async () => {
        if (!editedProduct) return;

        setSaving(true);
        setSaveResult(null);

        try {
            const res = await fetch(`/api/woocommerce/products/${productId}/update`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updates: {
                        name: editedProduct.name,
                        description: editedProduct.description,
                        regularPrice: editedProduct.regularPrice,
                        salePrice: editedProduct.salePrice,
                        stockQuantity: editedProduct.stockQuantity,
                        manageStock: editedProduct.manageStock,
                    },
                    modifiedBy: 'Operatore' // TODO: Get from session
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
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome Prodotto
                                </label>
                                <input
                                    type="text"
                                    value={editedProduct?.name || ''}
                                    onChange={(e) => setEditedProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descrizione Breve
                                </label>
                                <textarea
                                    value={editedProduct?.description || ''}
                                    onChange={(e) => setEditedProduct(prev => prev ? { ...prev, description: e.target.value } : null)}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Prices */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prezzo Regolare (€)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editedProduct?.regularPrice || ''}
                                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, regularPrice: parseFloat(e.target.value) || 0 } : null)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Prezzo Scontato (€)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editedProduct?.salePrice || ''}
                                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, salePrice: parseFloat(e.target.value) || undefined } : null)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Lascia vuoto se non in sconto"
                                    />
                                </div>
                            </div>

                            {/* Stock */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantità Stock
                                    </label>
                                    <input
                                        type="number"
                                        value={editedProduct?.stockQuantity || ''}
                                        onChange={(e) => setEditedProduct(prev => prev ? { ...prev, stockQuantity: parseInt(e.target.value) || 0 } : null)}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <label className="flex items-center gap-2 cursor-pointer">
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

                            {/* Info */}
                            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                                <p><strong>SKU:</strong> {product?.sku || 'N/A'}</p>
                                <p><strong>Stato:</strong> {product?.status}</p>
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
