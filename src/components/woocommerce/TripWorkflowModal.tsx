"use client";

import { useState, useEffect } from "react";
import { X, Save, Bus, MessageSquare, ListChecks, CheckCircle2, AlertCircle, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface TripWorkflowModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: any; // WooCommerce Product + viaggioOperativo
    onSave: () => void;
}

export function TripWorkflowModal({ isOpen, onClose, product, onSave }: TripWorkflowModalProps) {
    const [formData, setFormData] = useState({
        stato: "PENDING",
        minPartecipanti: 0,

        // Legacy flags (kept for compatibility)
        confermato: false,
        inForse: false,
        annullato: false,

        messaggioRiepilogoInviato: false,
        listaPasseggeriInviata: false,
        comunicazioneAutistaInviata: false,
        datiAutista: "",
        noteCarico: "",
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (product && product.viaggioOperativo) {
            const op = product.viaggioOperativo;

            // Determine initial status if not set
            let initialStatus = op.stato || "PENDING";
            if (!op.stato) {
                if (op.annullato) initialStatus = "CANCELLED";
                else if (op.confermato) initialStatus = "CONFIRMED";
                else if (op.inForse) initialStatus = "PENDING";
            }

            setFormData({
                stato: initialStatus,
                minPartecipanti: op.minPartecipanti || 0,

                confermato: op.confermato || false,
                inForse: op.inForse || false,
                annullato: op.annullato || false,

                messaggioRiepilogoInviato: op.messaggioRiepilogoInviato || false,
                listaPasseggeriInviata: op.listaPasseggeriInviata || false,
                comunicazioneAutistaInviata: op.comunicazioneAutistaInviata || false,
                datiAutista: op.datiAutista || "",
                noteCarico: op.noteCarico || "",
            });
        }
    }, [product]);

    // Sync legacy flags when status changes
    const handleStatusChange = (newStatus: string) => {
        setFormData(prev => ({
            ...prev,
            stato: newStatus,
            confermato: newStatus === "CONFIRMED" || newStatus === "SOLD_OUT" || newStatus === "COMPLETED",
            annullato: newStatus === "CANCELLED",
            inForse: newStatus === "PENDING"
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await fetch("/api/viaggi-operativi", {
                method: "POST", // Create or Update
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wooProductId: product.id,
                    dataViaggio: new Date(product.eventDate),
                    ...formData
                })
            });

            if (response.ok) {
                onSave();
                onClose();
            } else {
                alert("Errore nel salvataggio");
            }
        } catch (error) {
            console.error("Error saving workflow", error);
            alert("Errore di connessione");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    const statusOptions = [
        { value: "PENDING", label: "In Attesa / In Forse", color: "bg-yellow-100 text-yellow-800" },
        { value: "CONFIRMED", label: "Confermato", color: "bg-green-100 text-green-800" },
        { value: "SOLD_OUT", label: "Sold Out (Tutto Esaurito)", color: "bg-purple-100 text-purple-800" },
        { value: "CANCELLED", label: "Annullato", color: "bg-red-100 text-red-800" },
        { value: "COMPLETED", label: "Concluso / Passato", color: "bg-gray-100 text-gray-800" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b p-4 bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Workflow Operativo</h2>
                        <p className="text-sm text-gray-600">
                            {product.name}
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-200 text-gray-500">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* Status & Min Pax Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Stato Viaggio</label>
                            <div className="relative">
                                <select
                                    value={formData.stato}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-8 text-base shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    {statusOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                    <TrendingUp className="h-4 w-4" />
                                </div>
                            </div>
                            {/* Color preview */}
                            <div className={`mt-2 p-2 rounded text-xs font-bold text-center ${statusOptions.find(o => o.value === formData.stato)?.color}`}>
                                {statusOptions.find(o => o.value === formData.stato)?.label.toUpperCase()}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Min. Partecipanti (Break-even)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.minPartecipanti}
                                    onChange={(e) => setFormData(prev => ({ ...prev, minPartecipanti: parseInt(e.target.value) || 0 }))}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pl-10 text-base shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder="Es. 20"
                                />
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Numero minimo per coprire le spese. La barra di progresso nella dashboard si baserà su questo valore.
                            </p>
                        </div>
                    </div>

                    {/* Checklist */}
                    <div className="space-y-4 border-t pt-6">
                        <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                            <ListChecks className="h-5 w-5 text-blue-600" />
                            Checklist Operativa
                        </h3>

                        <div className="flex items-start gap-4 rounded-lg bg-gray-50 p-4 hover:bg-gray-100 transition-colors">
                            <input
                                type="checkbox"
                                id="check1"
                                checked={formData.messaggioRiepilogoInviato}
                                onChange={(e) => setFormData(prev => ({ ...prev, messaggioRiepilogoInviato: e.target.checked }))}
                                className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                            />
                            <div className="flex-1">
                                <label htmlFor="check1" className="block text-sm font-medium text-gray-900 cursor-pointer">Inviato Messaggio di Riepilogo</label>
                                <p className="text-xs text-gray-500">Da inviare 3 giorni prima della partenza ai partecipanti.</p>
                            </div>
                            <MessageSquare className="h-5 w-5 text-gray-400" />
                        </div>

                        <div className="flex items-start gap-4 rounded-lg bg-gray-50 p-4 hover:bg-gray-100 transition-colors">
                            <input
                                type="checkbox"
                                id="check2"
                                checked={formData.listaPasseggeriInviata}
                                onChange={(e) => setFormData(prev => ({ ...prev, listaPasseggeriInviata: e.target.checked }))}
                                className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                            />
                            <div className="flex-1">
                                <label htmlFor="check2" className="block text-sm font-medium text-gray-900 cursor-pointer">Inviata Lista Passeggeri</label>
                                <p className="text-xs text-gray-500">Da inviare al Capogruppo/Autista 1 giorno prima.</p>
                            </div>
                            <ListChecks className="h-5 w-5 text-gray-400" />
                        </div>

                        <div className="flex items-start gap-4 rounded-lg bg-gray-50 p-4 hover:bg-gray-100 transition-colors">
                            <input
                                type="checkbox"
                                id="check3"
                                checked={formData.comunicazioneAutistaInviata}
                                onChange={(e) => setFormData(prev => ({ ...prev, comunicazioneAutistaInviata: e.target.checked }))}
                                className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                            />
                            <div className="flex-1">
                                <label htmlFor="check3" className="block text-sm font-medium text-gray-900 cursor-pointer">Comunicazione Autista/Vettore</label>
                                <p className="text-xs text-gray-500">Conferma orari e punti di carico.</p>
                            </div>
                            <Bus className="h-5 w-5 text-gray-400" />
                        </div>
                    </div>

                    {/* Dettagli Autista & Note */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 border-t pt-6">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Dati Autista</label>
                            <input
                                type="text"
                                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
                                placeholder="Nome e Telefono..."
                                value={formData.datiAutista}
                                onChange={(e) => setFormData(prev => ({ ...prev, datiAutista: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Note di Carico / Fermate</label>
                            <textarea
                                className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
                                rows={3}
                                placeholder="Fermate aggiuntive..."
                                value={formData.noteCarico}
                                onChange={(e) => setFormData(prev => ({ ...prev, noteCarico: e.target.value }))}
                            />
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 border-t pt-4">
                        <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                        >
                            <Save className="h-4 w-4" />
                            {isSaving ? "Salvataggio..." : "Salva Workflow"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
