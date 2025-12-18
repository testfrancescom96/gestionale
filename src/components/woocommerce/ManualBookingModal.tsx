"use client";

import { useState } from "react";
import { X, Save, Plus, Loader2 } from "lucide-react";

interface ManualBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    productId: number;
    productName: string;
    onSave: () => void;
}

export function ManualBookingModal({ isOpen, onClose, productId, productName, onSave }: ManualBookingModalProps) {
    const [formData, setFormData] = useState({
        cognome: "",
        nome: "",
        telefono: "",
        email: "",
        puntoPartenza: "",
        numPartecipanti: 1,
        codiceFiscale: "",
        camera: "",
        note: "",
        importo: ""
    });

    const [isSaving, setIsSaving] = useState(false);
    const [showExtraFields, setShowExtraFields] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.cognome.trim() || !formData.nome.trim()) {
            alert("Cognome e Nome sono obbligatori");
            return;
        }

        setIsSaving(true);
        try {
            const response = await fetch("/api/woocommerce/manual-booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wooProductId: productId,
                    ...formData,
                    numPartecipanti: parseInt(formData.numPartecipanti.toString()) || 1,
                    importo: formData.importo ? parseFloat(formData.importo) : null
                })
            });

            if (response.ok) {
                onSave();
                onClose();
                // Reset form
                setFormData({
                    cognome: "",
                    nome: "",
                    telefono: "",
                    email: "",
                    puntoPartenza: "",
                    numPartecipanti: 1,
                    codiceFiscale: "",
                    camera: "",
                    note: "",
                    importo: ""
                });
            } else {
                const data = await response.json();
                alert("Errore: " + data.error);
            }
        } catch (error) {
            console.error("Error creating booking:", error);
            alert("Errore di connessione");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b p-4 bg-gradient-to-r from-green-50 to-emerald-50">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Plus className="h-5 w-5 text-green-600" />
                            Nuova Prenotazione Manuale
                        </h2>
                        <p className="text-sm text-gray-600">{productName}</p>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-200 text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Campi Base */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cognome <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="Rossi"
                                value={formData.cognome}
                                onChange={(e) => setFormData(prev => ({ ...prev, cognome: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="Mario"
                                value={formData.nome}
                                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                            <input
                                type="tel"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                placeholder="+39 333 1234567"
                                value={formData.telefono}
                                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">N° Partecipanti</label>
                            <input
                                type="number"
                                min="1"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                value={formData.numPartecipanti}
                                onChange={(e) => setFormData(prev => ({ ...prev, numPartecipanti: parseInt(e.target.value) || 1 }))}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Punto di Partenza</label>
                        <input
                            type="text"
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            placeholder="Es. Bari Centro, Fermata Autobus..."
                            value={formData.puntoPartenza}
                            onChange={(e) => setFormData(prev => ({ ...prev, puntoPartenza: e.target.value }))}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                        <textarea
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                            rows={2}
                            placeholder="Eventuali note aggiuntive..."
                            value={formData.note}
                            onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                        />
                    </div>

                    {/* Toggle Campi Extra */}
                    <button
                        type="button"
                        onClick={() => setShowExtraFields(!showExtraFields)}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        {showExtraFields ? "▼ Nascondi campi extra" : "▶ Mostra campi extra (viaggi lunghi)"}
                    </button>

                    {/* Campi Extra */}
                    {showExtraFields && (
                        <div className="space-y-4 pt-2 border-t border-dashed">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                        placeholder="email@esempio.it"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Codice Fiscale</label>
                                    <input
                                        type="text"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 uppercase"
                                        placeholder="RSSMRA80A01A662Z"
                                        value={formData.codiceFiscale}
                                        onChange={(e) => setFormData(prev => ({ ...prev, codiceFiscale: e.target.value.toUpperCase() }))}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Camera (Hotel)</label>
                                    <select
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                        value={formData.camera}
                                        onChange={(e) => setFormData(prev => ({ ...prev, camera: e.target.value }))}
                                    >
                                        <option value="">-- Nessuna --</option>
                                        <option value="singola">Singola</option>
                                        <option value="doppia">Doppia</option>
                                        <option value="matrimoniale">Matrimoniale</option>
                                        <option value="tripla">Tripla</option>
                                        <option value="quadrupla">Quadrupla</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Importo (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                                        placeholder="0.00"
                                        value={formData.importo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, importo: e.target.value }))}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 shadow-sm"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {isSaving ? "Salvataggio..." : "Salva Prenotazione"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
