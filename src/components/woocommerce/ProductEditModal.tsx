"use client";

import { useState, useEffect } from "react";
import { X, Save, Loader2 } from "lucide-react";

interface ProductEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any;
    onSave: () => void;
}

export function ProductEditModal({ isOpen, onClose, product, onSave }: ProductEditModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        regular_price: "",
        stock_quantity: "",
        stock_status: "",
        manage_stock: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (product && isOpen) {
            setFormData({
                name: product.name || "",
                sku: product.sku || "",
                regular_price: product.regular_price || "",
                stock_quantity: product.stock_quantity || "0",
                stock_status: product.stock_status || "instock",
                manage_stock: product.manage_stock || false,
            });
            setError("");
        }
    }, [product, isOpen]);

    if (!isOpen || !product) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const body = {
                name: formData.name,
                sku: formData.sku,
                regular_price: formData.regular_price,
                stock_status: formData.stock_status,
                manage_stock: formData.manage_stock,
                // Only send quantity if managing stock
                ...(formData.manage_stock && { stock_quantity: parseInt(formData.stock_quantity) || 0 })
            };

            const res = await fetch(`/api/woocommerce/products/${product.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update product");
            }

            onSave();
            onClose();

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Errore durante il salvataggio");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                    <h2 className="text-xl font-semibold text-gray-900">Modifica Prodotto</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Prodotto</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            required
                        />
                    </div>

                    {/* SKU & Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Data)</label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">Formato data: ddmmyy (finale)</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prezzo (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.regular_price}
                                onChange={(e) => setFormData({ ...formData, regular_price: e.target.value })}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Stock */}
                    <div className="space-y-2 border-t pt-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="manage_stock"
                                checked={formData.manage_stock}
                                onChange={(e) => setFormData({ ...formData, manage_stock: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="manage_stock" className="text-sm font-medium text-gray-700">Gestisci Magazzino</label>
                        </div>

                        {formData.manage_stock ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantità</label>
                                <input
                                    type="number"
                                    value={formData.stock_quantity}
                                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stato Disponibilità</label>
                                <select
                                    value={formData.stock_status}
                                    onChange={(e) => setFormData({ ...formData, stock_status: e.target.value })}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                >
                                    <option value="instock">Disponibile</option>
                                    <option value="outofstock">Esaurito</option>
                                    <option value="onbackorder">In Arrivo</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="flex justify-end gap-2 border-t pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50"
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            Salva Modifiche
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
