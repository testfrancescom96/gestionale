"use client";

import { Euro, TrendingUp, Building2, UserPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { NuovoFornitoreModal } from "@/components/fornitori/NuovoFornitoreModal";

interface Step2Props {
    formData: any;
    setFormData: (data: any) => void;
}

export function Step2({ formData, setFormData }: Step2Props) {
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Load lists
    const [fornitori, setFornitori] = useState<any[]>([]);
    const [tipiServizio, setTipiServizio] = useState<any[]>([]);
    const [aliquoteIva, setAliquoteIva] = useState<any[]>([]);
    const [regimiFiscali, setRegimiFiscali] = useState<any[]>([]);

    useEffect(() => {
        // Load suppliers
        fetch("/api/fornitori")
            .then((res) => res.json())
            .then((data) => setFornitori(data || []))
            .catch((err) => console.error(err));

        // Load Service Types
        fetch("/api/impostazioni/tipi-servizio")
            .then((res) => res.json())
            .then((data) => setTipiServizio(data || []))
            .catch((err) => console.error(err));

        // Load VAT Rates
        fetch("/api/impostazioni/aliquote-iva")
            .then((res) => res.json())
            .then((data) => setAliquoteIva(data || []))
            .catch((err) => console.error(err));

        // Load Tax Regimes
        fetch("/api/impostazioni/regime-fiscale")
            .then((res) => res.json())
            .then((data) => setRegimiFiscali(data || []))
            .catch((err) => console.error(err));
    }, []);

    const handleChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    // Auto-set IVA based on tipologia
    const handleTipologiaChange = (tipologia: string) => {
        handleChange("tipologia", tipologia);

        // Suggerimenti IVA
        if (tipologia === "TOUR_BUS") {
            handleChange("aliquotaIVA", 10);
            handleChange("regimeIVA", "ORDINARIO");
        } else if (tipologia === "CROCIERA" || tipologia === "PACCHETTO") {
            handleChange("regimeIVA", "74TER");
            handleChange("aliquotaIVA", 22);
        }
    };

    return (
        <div className="space-y-6">
            {/* Fornitori e Costi (Multi-Fornitore) Section */}
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Fornitori e Costi</h3>
                    <button
                        type="button"
                        onClick={() => {
                            const newCosti = [
                                ...(formData.costi || []),
                                { id: Date.now(), fornitoreId: "", nomeFornitore: "", tipologia: "ALTRO", descrizione: "", importo: 0 }
                            ];
                            handleChange("costi", newCosti);
                        }}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <UserPlus className="h-4 w-4" />
                        Aggiungi Costo
                    </button>
                </div>

                <div className="space-y-4">
                    {(formData.costi && formData.costi.length > 0) ? (
                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fornitore</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipologia</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Descrizione</th>
                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Importo (€)</th>
                                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {formData.costi.map((costo: any, index: number) => (
                                        <tr key={index}>
                                            <td className="p-2">
                                                <div className="flex gap-1">
                                                    <select
                                                        value={costo.fornitoreId || ""}
                                                        onChange={(e) => {
                                                            const selected = fornitori.find(f => f.id === e.target.value);
                                                            const newCosti = [...formData.costi];
                                                            newCosti[index] = {
                                                                ...costo,
                                                                fornitoreId: e.target.value,
                                                                nomeFornitore: selected ? (selected.nomeComune || selected.ragioneSociale || selected.denominazione) : ""
                                                            };
                                                            handleChange("costi", newCosti);
                                                        }}
                                                        className="w-full rounded border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                                                    >
                                                        <option value="">Seleziona...</option>
                                                        {fornitori.map((f) => (
                                                            <option key={f.id} value={f.id}>
                                                                {f.nomeComune || f.ragioneSociale || f.denominazione}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsModalOpen(true)}
                                                        className="text-gray-400 hover:text-blue-600"
                                                        title="Nuovo Fornitore"
                                                    >
                                                        <UserPlus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-2">
                                                <select
                                                    value={costo.tipologia || "ALTRO"}
                                                    onChange={(e) => {
                                                        const newVal = e.target.value;
                                                        const newCosti = [...formData.costi];
                                                        newCosti[index] = { ...costo, tipologia: newVal };
                                                        handleChange("costi", newCosti);
                                                    }}
                                                    className="w-full rounded border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                                                >
                                                    <option value="ALTRO">Seleziona...</option>
                                                    {tipiServizio.map(t => (
                                                        <option key={t.id} value={t.nome}>{t.nome}</option>
                                                    ))}
                                                    <option value="AGGIUNGI_NUOVO">+ Aggiungi...</option>
                                                </select>
                                                {costo.tipologia === "AGGIUNGI_NUOVO" && (
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        placeholder="Nuova Tipologia..."
                                                        className="mt-1 w-full rounded border-gray-300 text-xs"
                                                        onBlur={async (e) => {
                                                            const val = e.target.value;
                                                            if (val) {
                                                                try {
                                                                    const res = await fetch("/api/impostazioni/tipi-servizio", {
                                                                        method: "POST",
                                                                        body: JSON.stringify({ nome: val })
                                                                    });
                                                                    if (res.ok) {
                                                                        const newItem = await res.json();
                                                                        setTipiServizio(prev => [...prev, newItem].sort((a, b) => a.nome.localeCompare(b.nome)));

                                                                        const newCosti = [...formData.costi];
                                                                        newCosti[index] = { ...costo, tipologia: newItem.nome };
                                                                        handleChange("costi", newCosti);
                                                                    }
                                                                } catch (err) { console.error(err); }
                                                            }
                                                        }}
                                                    />
                                                )}
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="text"
                                                    value={costo.descrizione || ""}
                                                    onChange={(e) => {
                                                        const newCosti = [...formData.costi];
                                                        newCosti[index] = { ...costo, descrizione: e.target.value };
                                                        handleChange("costi", newCosti);
                                                    }}
                                                    placeholder="Dettagli..."
                                                    className="w-full rounded border-gray-300 text-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="p-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={costo.importo}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value) || 0;
                                                        const newCosti = [...formData.costi];
                                                        newCosti[index] = { ...costo, importo: val };

                                                        // Recalculate Total
                                                        const total = newCosti.reduce((acc, c) => acc + (Number(c.importo) || 0), 0);

                                                        // Update both cost list and total cost
                                                        setFormData({
                                                            ...formData,
                                                            costi: newCosti,
                                                            costoFornitore: total
                                                        });
                                                    }}
                                                    className="w-full rounded border-gray-300 text-right text-sm focus:border-blue-500 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newCosti = formData.costi.filter((_: any, i: number) => i !== index);
                                                        // Recalculate Total
                                                        const total = newCosti.reduce((acc: number, c: any) => acc + (Number(c.importo) || 0), 0);

                                                        setFormData({
                                                            ...formData,
                                                            costi: newCosti,
                                                            costoFornitore: total
                                                        });
                                                    }}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    &times;
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">Totale Costi</td>
                                        <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                                            € {formData.costoFornitore?.toFixed(2) || "0.00"}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                            <Building2 className="mx-auto h-8 w-8 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-500">Nessun costo inserito.</p>
                            <button
                                type="button"
                                onClick={() => {
                                    const newCosti = [
                                        { id: Date.now(), fornitoreId: "", nomeFornitore: "", tipologia: "ALTRO", descrizione: "", importo: 0 }
                                    ];
                                    handleChange("costi", newCosti);
                                }}
                                className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                                Inizia aggiungendo un fornitore
                            </button>
                        </div>
                    )}
                </div>

                <NuovoFornitoreModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onFornitoreCreato={(f) => {
                        setFornitori([...fornitori, f]);
                        // Add as new row
                        const newCosti = [
                            ...(formData.costi || []),
                            {
                                id: Date.now(),
                                fornitoreId: f.id,
                                nomeFornitore: f.denominazione,
                                tipologia: "ALTRO",
                                descrizione: "Nuovo Fornitore",
                                importo: 0
                            }
                        ];
                        handleChange("costi", newCosti);
                    }}
                />
            </div>

            {/* Prezzi Section */}
            <div className="border-t pt-6">
                <div className="mb-4 flex items-center gap-2">
                    <Euro className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Prezzi e Margini</h3>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Budget Cliente (opzionale)
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.budgetCliente || ""}
                                onChange={(e) => handleChange("budgetCliente", parseFloat(e.target.value) || 0)}
                                className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Prezzo di Vendita
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.prezzoVendita || ""}
                                onChange={(e) => handleChange("prezzoVendita", parseFloat(e.target.value) || 0)}
                                className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Margine Preview */}
                {(formData.prezzoVendita > 0 || formData.costoFornitore > 0) && (
                    <div className="mt-4 rounded-lg bg-green-50 p-4">
                        <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-900">
                                Margine calcolato: € {(formData.prezzoVendita - formData.costoFornitore).toFixed(2)}
                                {formData.prezzoVendita > 0 && (
                                    <span className="ml-2 text-green-700">
                                        ({(((formData.prezzoVendita - formData.costoFornitore) / formData.prezzoVendita) * 100).toFixed(2)}%)
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Regime IVA Section */}
            <div className="border-t pt-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Regime Fiscale</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Regime IVA
                        </label>
                        <select
                            value={formData.regimeIVA}
                            onChange={(e) => handleChange("regimeIVA", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Seleziona...</option>
                            {regimiFiscali.map((r: any) => (
                                <option key={r.id} value={r.nome}>{r.nome}</option>
                            ))}
                            <option value="AGGIUNGI_NUOVO">+ Aggiungi...</option>
                        </select>
                        {formData.regimeIVA === "AGGIUNGI_NUOVO" && (
                            <input
                                autoFocus
                                type="text"
                                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm"
                                placeholder="Nuovo Regime (es. 74TER)..."
                                onBlur={async (e) => {
                                    const val = e.target.value;
                                    if (val) {
                                        try {
                                            const res = await fetch("/api/impostazioni/regime-fiscale", {
                                                method: "POST",
                                                body: JSON.stringify({ nome: val })
                                            });
                                            if (res.ok) {
                                                const newItem = await res.json();
                                                setRegimiFiscali(prev => [...prev, newItem].sort((a: any, b: any) => a.nome.localeCompare(b.nome)));
                                                handleChange("regimeIVA", newItem.nome);
                                            }
                                        } catch (err) { console.error(err); }
                                    } else {
                                        handleChange("regimeIVA", "");
                                    }
                                }}
                            />
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Aliquota IVA (%)
                        </label>
                        <select
                            value={formData.aliquotaIVA}
                            onChange={(e) => handleChange("aliquotaIVA", parseFloat(e.target.value))}
                            disabled={formData.regimeIVA === "FUORI_CAMPO" || formData.regimeIVA === "ESENTE"}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                        >
                            <option value="0">0%</option>
                            {aliquoteIva.map(a => (
                                <option key={a.id} value={a.valore}>{a.valore}%</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* IVA Info */}
                <div className="mt-4 rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-blue-900">
                        {formData.regimeIVA === "74TER" && (
                            <>
                                <strong>Info 74-ter:</strong> L'IVA si applica solo sul margine (Vendita - Costo).
                                Non si espone in fattura.
                            </>
                        )}
                        {formData.regimeIVA === "ORDINARIO" && (
                            <>
                                <strong>Info Ordinario:</strong> IVA applicata sul compenso dell'agenzia o sull'intero importo.
                            </>
                        )}
                        {formData.regimeIVA === "FUORI_CAMPO" && (
                            <>
                                <strong>Info Fuori Campo:</strong> Operazioni extra-UE, voli internazionali, etc.
                            </>
                        )}
                        {formData.regimeIVA === "ESENTE" && (
                            <>
                                <strong>Info Esente:</strong> Operazioni esenti da IVA per legge.
                            </>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
