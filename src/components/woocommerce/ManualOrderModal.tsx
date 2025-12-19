"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    product: any; // WooProduct
    onSuccess?: () => void;
}

export function ManualOrderModal({ isOpen, onClose, product, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        pax: 1,
        note: "",
        pickupPoint: ""
    });

    if (!isOpen || !product) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Prepare Meta Data
            const metaData = [];
            if (formData.pickupPoint) {
                // Determine key based on convention. usually 'punto-di-ritrovo' or similar.
                // We'll use a generic key or one that matches your filters.
                metaData.push({ key: "Luogo di ritrovo", value: formData.pickupPoint });
            }

            const res = await fetch("/api/woocommerce/orders/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: product.id,
                    pax: formData.pax,
                    customer: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        phone: formData.phone
                    },
                    note: formData.note,
                    metaData: metaData
                })
            });

            const result = await res.json();

            if (res.ok) {
                alert(`Ordine #${result.orderId} creato con successo!`);
                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert(`Errore: ${result.error || "Impossibile creare ordine"}`);
            }

        } catch (error) {
            console.error("Submit error:", error);
            alert("Errore di connessione");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-blue-600 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-white text-lg font-bold">Nuova Prenotazione</h2>
                        <p className="text-blue-100 text-sm">{product.name}</p>
                    </div>
                    <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Nome *</label>
                            <input
                                required
                                type="text"
                                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Cognome *</label>
                            <input
                                required
                                type="text"
                                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Telefono</label>
                            <input
                                type="tel"
                                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="opzionale"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-2">
                        <div className="flex gap-4">
                            <div className="w-24">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Pax *</label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    className="w-full border rounded-md px-3 py-2 text-sm font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.pax}
                                    onChange={e => setFormData({ ...formData, pax: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Punto di Ritrovo</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Es. Milano Stazione"
                                    value={formData.pickupPoint}
                                    onChange={e => setFormData({ ...formData, pickupPoint: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Note Interne / Cliente</label>
                        <textarea
                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                            placeholder="Note aggiuntive..."
                            value={formData.note}
                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.lastName || !formData.firstName}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Conferma Prenotazione
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
