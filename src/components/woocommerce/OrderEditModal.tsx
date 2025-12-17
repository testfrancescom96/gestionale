"use client";

import { useState, useEffect } from "react";
import { X, Save, User, FileText, Loader2 } from "lucide-react";

interface OrderEditModalProps {
    isOpen: boolean;
    order: any;
    onClose: () => void;
    onSave: () => void;
}

export function OrderEditModal({ isOpen, order, onClose, onSave }: OrderEditModalProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'billing'>('info');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        status: "",
        admin_notes: "",
        billing: {
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            address_1: "",
            city: "",
            postcode: "",
        }
    });

    useEffect(() => {
        if (order && isOpen) {
            setFormData({
                status: order.status || "processing",
                admin_notes: order.adminNotes || "",
                billing: {
                    first_name: order.billing?.first_name || "",
                    last_name: order.billing?.last_name || "",
                    email: order.billing?.email || "",
                    phone: order.billing?.phone || "",
                    address_1: order.billing?.address_1 || "", // Check mapping (DB field is billingAddress)
                    city: order.billing?.city || "",
                    postcode: order.billing?.postcode || "",
                }
            });

            // Fix: If order comes from DB list, billing might be flattened or nested.
            // Our OrdersList usually passes nested 'billing' object if available, 
            // OR flat fields. Let's handle flat fields fallback.
            if (!order.billing && order.billingFirstName) {
                setFormData(prev => ({
                    ...prev,
                    billing: {
                        first_name: order.billingFirstName,
                        last_name: order.billingLastName,
                        email: order.billingEmail,
                        phone: order.billingPhone,
                        address_1: order.billingAddress,
                        city: order.billingCity,
                        postcode: "", // Might be missing in flat schema?
                    }
                }));
            }
        }
    }, [order, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.startsWith("billing.")) {
            const field = name.split(".")[1];
            setFormData(prev => ({
                ...prev,
                billing: { ...prev.billing, [field]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/woocommerce/orders/${order.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed");
            }

            onSave();
            onClose();
        } catch (error: any) {
            console.error(error);
            alert(`⚠️ ERRORE DETTAGLIATO: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">
                        Modifica Ordine #{order?.id}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <FileText className="h-4 w-4 inline mr-2" /> Stato & Note
                    </button>
                    <button
                        onClick={() => setActiveTab('billing')}
                        className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'billing' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <User className="h-4 w-4 inline mr-2" /> Dati Cliente
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    <form id="edit-order-form" onSubmit={handleSubmit} className="space-y-4">

                        {activeTab === 'info' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stato Ordine</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="pending">In attesa (Pending)</option>
                                        <option value="processing">In lavorazione (Processing)</option>
                                        <option value="on-hold">Sospeso (On Hold)</option>
                                        <option value="completed">Completato</option>
                                        <option value="cancelled">Cancellato</option>
                                        <option value="refunded">Rimborsato</option>
                                        <option value="failed">Fallito</option>
                                    </select>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Modificando lo stato, WooCommerce potrebbe inviare email automatiche al cliente.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Note Interne (Admin)</label>
                                    <textarea
                                        name="admin_notes"
                                        value={formData.admin_notes}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Note visibili solo agli amministratori..."
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'billing' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Nome</label>
                                        <input
                                            type="text"
                                            name="billing.first_name"
                                            value={formData.billing.first_name}
                                            onChange={handleChange}
                                            className="w-full border-b border-gray-300 focus:border-blue-500 py-1 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Cognome</label>
                                        <input
                                            type="text"
                                            name="billing.last_name"
                                            value={formData.billing.last_name}
                                            onChange={handleChange}
                                            className="w-full border-b border-gray-300 focus:border-blue-500 py-1 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Email</label>
                                        <input
                                            type="email"
                                            name="billing.email"
                                            value={formData.billing.email}
                                            onChange={handleChange}
                                            className="w-full border-b border-gray-300 focus:border-blue-500 py-1 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Telefono</label>
                                        <input
                                            type="tel"
                                            name="billing.phone"
                                            value={formData.billing.phone}
                                            onChange={handleChange}
                                            className="w-full border-b border-gray-300 focus:border-blue-500 py-1 outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Indirizzo</label>
                                        <input
                                            type="text"
                                            name="billing.address_1"
                                            value={formData.billing.address_1}
                                            onChange={handleChange}
                                            className="w-full border-b border-gray-300 focus:border-blue-500 py-1 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Città</label>
                                        <input
                                            type="text"
                                            name="billing.city"
                                            value={formData.billing.city}
                                            onChange={handleChange}
                                            className="w-full border-b border-gray-300 focus:border-blue-500 py-1 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 uppercase">CAP</label>
                                        <input
                                            type="text"
                                            name="billing.postcode"
                                            value={formData.billing.postcode}
                                            onChange={handleChange}
                                            className="w-full border-b border-gray-300 focus:border-blue-500 py-1 outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium"
                        type="button"
                    >
                        Annulla
                    </button>
                    <button
                        form="edit-order-form"
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Salva Modifiche
                    </button>
                </div>
            </div>
        </div>
    );
}
