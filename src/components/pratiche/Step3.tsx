"use client";

import { CheckCircle, Calendar, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { CustomFieldsRenderer } from "@/components/custom-fields/CustomFieldsRenderer";

interface Step3Props {
    formData: any;
    setFormData: (data: any) => void;
    praticaId?: string;
}

export function Step3({ formData, setFormData, praticaId }: Step3Props) {
    const [tipiFeedback, setTipiFeedback] = useState<{ id: string, nome: string }[]>([]);

    useEffect(() => {
        fetch("/api/impostazioni/tipi-feedback")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setTipiFeedback(data);
            })
            .catch(err => console.error(err));
    }, []);

    const handleChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const handlePrintContract = () => {
        if (!praticaId) {
            alert("Salva la pratica prima di generare il contratto.");
            return;
        }
        window.open(`/api/pratiche/${praticaId}/contratto`, "_blank");
    };

    const handleCustomFieldChange = async (fieldDefId: string, value: string) => {
        if (!praticaId) return; // Can't save without a praticaId

        try {
            await fetch("/api/custom-fields/values", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fieldDefId,
                    praticaId,
                    value,
                }),
                keepalive: true,
            });
        } catch (error) {
            console.error("Error saving custom field:", error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Stato Pratica Section */}
            <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Stato Pratica</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Stato
                        </label>
                        <select
                            value={formData.stato}
                            onChange={(e) => handleChange("stato", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="PREVENTIVO_DA_ELABORARE">Preventivo da Elaborare</option>
                            <option value="IN_ATTESA_CONFERMA">In Attesa di Conferma</option>
                            <option value="CONFERMATO_E_PAGATO">Confermato e Pagato</option>
                            <option value="ELABORATO">Elaborato (Chiusa)</option>
                            <option value="ANNULLATO">Annullato</option>
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Feedback Cliente
                        </label>
                        <select
                            value={formData.feedbackCliente}
                            onChange={(e) => handleChange("feedbackCliente", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Seleziona...</option>
                            {tipiFeedback.map(t => (
                                <option key={t.id} value={t.nome}>{t.nome}</option>
                            ))}
                            <option value="AGGIUNGI_NUOVO">+ Aggiungi...</option>
                        </select>
                        {formData.feedbackCliente === "AGGIUNGI_NUOVO" && (
                            <input
                                autoFocus
                                type="text"
                                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                                placeholder="Nuovo Feedback..."
                                onBlur={async (e) => {
                                    const val = e.target.value;
                                    if (val) {
                                        try {
                                            const res = await fetch("/api/impostazioni/tipi-feedback", {
                                                method: "POST",
                                                body: JSON.stringify({ nome: val })
                                            });
                                            if (res.ok) {
                                                const newItem = await res.json();
                                                setTipiFeedback(prev => [...prev, newItem].sort((a, b) => a.nome.localeCompare(b.nome)));
                                                handleChange("feedbackCliente", newItem.nome);
                                            }
                                        } catch (err) { console.error(err); }
                                    } else {
                                        handleChange("feedbackCliente", "");
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Acconti/Saldi Section */}
            <div className="border-t pt-6">
                <div className="mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Pagamenti</h3>
                </div>

                <div className="mb-4">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={formData.richiedeAcconto}
                            onChange={(e) => handleChange("richiedeAcconto", e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                            Richiede Acconto / Saldo
                        </span>
                    </label>
                </div>

                {formData.richiedeAcconto && (
                    <div className="space-y-4 rounded-lg bg-blue-50 p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Percentuale Acconto (%)
                                </label>
                                <select
                                    value={formData.percentualeAcconto}
                                    onChange={(e) => handleChange("percentualeAcconto", parseFloat(e.target.value))}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="20">20%</option>
                                    <option value="30">30%</option>
                                    <option value="40">40%</option>
                                    <option value="50">50%</option>
                                    <option value="100">100% (pagamento unico)</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Importo Acconto (auto-calcolato)
                                </label>
                                <div className="flex h-10 items-center rounded-lg border border-gray-300 bg-gray-100 px-4">
                                    <span className="text-sm font-medium text-gray-900">
                                        € {((formData.prezzoVendita * formData.percentualeAcconto) / 100).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Scadenza Acconto
                                </label>
                                <input
                                    type="date"
                                    disabled={formData.percentualeAcconto === 100}
                                    value={formData.percentualeAcconto === 100 ? "" : undefined} // Opzionale: pulisce se disabilitato
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Scadenza Saldo
                                </label>
                                <input
                                    type="date"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Riepilogo Pagamenti */}
                        {formData.percentualeAcconto < 100 && (
                            <div className="border-t border-blue-200 pt-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-700">Importo Saldo:</span>
                                    <span className="font-semibold text-gray-900">
                                        € {(formData.prezzoVendita - (formData.prezzoVendita * formData.percentualeAcconto / 100)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Documenti Section */}
            <div className="border-t pt-6">
                <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Documenti</h3>
                </div>
                <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-gray-900">Contratto di Viaggio</h4>
                            <p className="text-xs text-gray-500">Genera PDF contratto ASTOI</p>
                        </div>
                        <button
                            type="button"
                            onClick={handlePrintContract}
                            className="flex items-center gap-2 rounded-lg bg-white border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 shadow-sm"
                        >
                            <FileText className="h-4 w-4" />
                            Stampa Contratto
                        </button>
                    </div>
                </div>
            </div>

            {/* Riepilogo Finale */}
            <div className="border-t pt-6">
                <div className="rounded-lg bg-green-50 p-6">
                    <div className="mb-3 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold text-green-900">Riepilogo Pratica</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-green-700">Destinazione:</span>
                            <span className="font-medium text-green-900">{formData.destinazione || "—"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-green-700">Tipologia:</span>
                            <span className="font-medium text-green-900">{formData.tipologia}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-green-900">€ {formData.prezzoVendita.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-green-700">Regime IVA:</span>
                            <span className="font-medium text-green-900">{formData.regimeIVA}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-green-700">Stato:</span>
                            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                                {formData.stato}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
