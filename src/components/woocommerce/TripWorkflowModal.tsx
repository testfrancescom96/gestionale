"use client";

import { useState, useEffect } from "react";
import { X, Save, Bus, MessageSquare, ListChecks, CheckCircle2, AlertCircle } from "lucide-react";
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
            setFormData({
                confermato: product.viaggioOperativo.confermato || false,
                inForse: product.viaggioOperativo.inForse || false,
                annullato: product.viaggioOperativo.annullato || false,
                messaggioRiepilogoInviato: product.viaggioOperativo.messaggioRiepilogoInviato || false,
                listaPasseggeriInviata: product.viaggioOperativo.listaPasseggeriInviata || false,
                comunicazioneAutistaInviata: product.viaggioOperativo.comunicazioneAutistaInviata || false,
                datiAutista: product.viaggioOperativo.datiAutista || "",
                noteCarico: product.viaggioOperativo.noteCarico || "",
            });
        }
    }, [product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const response = await fetch("/api/viaggi-operativi", {
                method: "POST", // Create or Update
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wooProductId: product.id,
                    dataViaggio: new Date(product.eventDate), // Assuming eventDate exists on product
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b p-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Workflow Operativo</h2>
                        <p className="text-sm text-gray-600">
                            {product.name} - {format(new Date(product.eventDate), "dd MMMM yyyy", { locale: it })}
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-2 hover:bg-gray-100">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {/* Status Chips */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-900">Stato Viaggio</label>
                        <div className="flex gap-4">
                            <label className={`flex-1 cursor-pointer rounded-lg border p-4 text-center transition-all ${formData.confermato
                                    ? "border-green-600 bg-green-50 text-green-700 font-bold ring-2 ring-green-600"
                                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                                }`}>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.confermato}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        confermato: e.target.checked,
                                        inForse: e.target.checked ? false : prev.inForse, // Mutually exclusive-ish logic can be added
                                        annullato: e.target.checked ? false : prev.annullato
                                    }))}
                                />
                                <CheckCircle2 className="mx-auto h-6 w-6 mb-2" />
                                CONFERMATO
                            </label>

                            <label className={`flex-1 cursor-pointer rounded-lg border p-4 text-center transition-all ${formData.inForse
                                    ? "border-yellow-500 bg-yellow-50 text-yellow-700 font-bold ring-2 ring-yellow-500"
                                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                                }`}>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.inForse}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        inForse: e.target.checked,
                                        confermato: e.target.checked ? false : prev.confermato,
                                        annullato: e.target.checked ? false : prev.annullato
                                    }))}
                                />
                                <AlertCircle className="mx-auto h-6 w-6 mb-2" />
                                IN FORSE
                            </label>

                            <label className={`flex-1 cursor-pointer rounded-lg border p-4 text-center transition-all ${formData.annullato
                                    ? "border-red-600 bg-red-50 text-red-700 font-bold ring-2 ring-red-600"
                                    : "border-gray-200 hover:bg-gray-50 text-gray-600"
                                }`}>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={formData.annullato}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        annullato: e.target.checked,
                                        confermato: e.target.checked ? false : prev.confermato,
                                        inForse: e.target.checked ? false : prev.inForse
                                    }))}
                                />
                                <X className="mx-auto h-6 w-6 mb-2" />
                                ANNULLATO
                            </label>
                        </div>
                    </div>

                    {/* Checklist */}
                    <div className="space-y-4 border-t pt-6">
                        <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                            <ListChecks className="h-5 w-5 text-blue-600" />
                            Checklist Operativa
                        </h3>

                        <div className="flex items-start gap-4 rounded-lg bg-gray-50 p-4">
                            <input
                                type="checkbox"
                                id="check1"
                                checked={formData.messaggioRiepilogoInviato}
                                onChange={(e) => setFormData(prev => ({ ...prev, messaggioRiepilogoInviato: e.target.checked }))}
                                className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                            />
                            <div className="flex-1">
                                <label htmlFor="check1" className="block text-sm font-medium text-gray-900">Inviato Messaggio di Riepilogo</label>
                                <p className="text-xs text-gray-500">Da inviare 3 giorni prima della partenza ai partecipanti.</p>
                            </div>
                            <MessageSquare className="h-5 w-5 text-gray-400" />
                        </div>

                        <div className="flex items-start gap-4 rounded-lg bg-gray-50 p-4">
                            <input
                                type="checkbox"
                                id="check2"
                                checked={formData.listaPasseggeriInviata}
                                onChange={(e) => setFormData(prev => ({ ...prev, listaPasseggeriInviata: e.target.checked }))}
                                className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                            />
                            <div className="flex-1">
                                <label htmlFor="check2" className="block text-sm font-medium text-gray-900">Inviata Lista Passeggeri</label>
                                <p className="text-xs text-gray-500">Da inviare al Capogruppo/Autista 1 giorno prima.</p>
                            </div>
                            <ListChecks className="h-5 w-5 text-gray-400" />
                        </div>

                        <div className="flex items-start gap-4 rounded-lg bg-gray-50 p-4">
                            <input
                                type="checkbox"
                                id="check3"
                                checked={formData.comunicazioneAutistaInviata}
                                onChange={(e) => setFormData(prev => ({ ...prev, comunicazioneAutistaInviata: e.target.checked }))}
                                className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                            />
                            <div className="flex-1">
                                <label htmlFor="check3" className="block text-sm font-medium text-gray-900">Comunicazione Autista/Vettore</label>
                                <p className="text-xs text-gray-500">Conferma orari e punti di carico.</p>
                            </div>
                            <Bus className="h-5 w-5 text-gray-400" />
                        </div>
                    </div>

                    {/* Dettagli Autista & Note */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Dati Autista</label>
                            <input
                                type="text"
                                className="w-full rounded-lg border border-gray-300 p-2 text-sm"
                                placeholder="Nome e Telefono..."
                                value={formData.datiAutista}
                                onChange={(e) => setFormData(prev => ({ ...prev, datiAutista: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">Note di Carico / Fermate</label>
                            <textarea
                                className="w-full rounded-lg border border-gray-300 p-2 text-sm"
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
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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
