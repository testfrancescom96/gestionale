"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Save, Trash2, AlertCircle, Wand2 } from "lucide-react";

interface PricingRule {
    identifier: string;
    type: string;
    fullPrice: number;
    depositPrice?: number | null;
    nome?: string;
    description?: string;
}

interface ProductPricingManagerProps {
    productId: number;
}

export default function ProductPricingManager({ productId }: ProductPricingManagerProps) {
    const [rules, setRules] = useState<PricingRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [detectedVariations, setDetectedVariations] = useState<string[]>([]);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentRule, setCurrentRule] = useState<Partial<PricingRule>>({
        type: "STANDARD",
        fullPrice: 0
    });

    useEffect(() => {
        fetchRules();
    }, [productId]);

    const fetchRules = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/woocommerce/products/${productId}/pricing`);
            if (res.ok) {
                const data = await res.json();
                setRules(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleScan = async () => {
        try {
            setScanning(true);
            const res = await fetch(`/api/woocommerce/products/${productId}/pricing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'scan' })
            });

            if (res.ok) {
                const variations = await res.json();
                // Filter out already mapped ones
                const mapped = new Set(rules.map(r => r.identifier));
                const newVars = variations.filter((v: string) => !mapped.has(v));
                setDetectedVariations(newVars);
                if (newVars.length === 0) {
                    alert("Nessuna nuova variazione trovata negli ordini.");
                }
            }
        } catch (e) {
            alert("Errore durante la scansione");
        } finally {
            setScanning(false);
        }
    };

    const handleSave = async () => {
        if (!currentRule.identifier || !currentRule.fullPrice) {
            alert("Compila i campi obbligatori (Identificativo e Prezzo Pieno)");
            return;
        }

        try {
            const res = await fetch(`/api/woocommerce/products/${productId}/pricing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentRule)
            });

            if (res.ok) {
                await fetchRules();
                setIsEditing(false);
                setCurrentRule({ type: "STANDARD", fullPrice: 0 });
                // Remove from detected if present
                setDetectedVariations(prev => prev.filter(v => v !== currentRule.identifier));
            } else {
                alert("Errore nel salvataggio");
            }
        } catch (e) {
            alert("Errore nel salvataggio");
        }
    };

    const startEdit = (rule?: PricingRule) => {
        setCurrentRule(rule || { type: "STANDARD", fullPrice: 0 });
        setIsEditing(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">Tariffario & Prezzi</h3>
                <div className="space-x-2">
                    <button
                        onClick={handleScan}
                        disabled={scanning}
                        className="px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center gap-2"
                    >
                        <Search size={16} />
                        {scanning ? "Scansione..." : "Scansiona Ordini"}
                    </button>
                    <button
                        onClick={() => startEdit()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={16} /> Nuova Regola
                    </button>
                </div>
            </div>

            {detectedVariations.length > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 flex items-center gap-2 mb-2">
                        <Wand2 size={16} /> Variazioni Rilevate
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {detectedVariations.map(v => (
                            <button
                                key={v}
                                onClick={() => startEdit({
                                    identifier: v,
                                    nome: v,
                                    type: v.toLowerCase().includes("acconto") ? "ACCONTO" : "STANDARD",
                                    fullPrice: 0
                                })}
                                className="px-3 py-1 bg-white border border-yellow-300 rounded text-sm text-yellow-700 hover:bg-yellow-100"
                            >
                                + {v}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase">
                        <tr>
                            <th className="px-6 py-3">Identificativo (Woo)</th>
                            <th className="px-6 py-3">Nome Visualizzato</th>
                            <th className="px-6 py-3">Tipo</th>
                            <th className="px-6 py-3">Prezzo Pieno</th>
                            <th className="px-6 py-3">Acconto</th>
                            <th className="px-6 py-3">Azioni</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="p-4 text-center">Caricamento...</td></tr>
                        ) : rules.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nessuna regola definita</td></tr>
                        ) : (
                            rules.map((rule, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-mono text-xs">{rule.identifier}</td>
                                    <td className="px-6 py-4 font-medium">{rule.nome || "-"}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs ${rule.type === 'ACCONTO' ? 'bg-orange-100 text-orange-800' :
                                                rule.type === 'GRATUITO' ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                                            }`}>
                                            {rule.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{rule.fullPrice}€</td>
                                    <td className="px-6 py-4">{rule.depositPrice ? rule.depositPrice + '€' : '-'}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => startEdit(rule)} className="text-blue-600 hover:underline">Modifica</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal / Form overlay */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-xl font-bold mb-4">
                            {currentRule.identifier ? "Modifica Tariffa" : "Nuova Tariffa"}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Identificativo Variazione (WooCommerce)</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded"
                                    value={currentRule.identifier || ""}
                                    onChange={e => setCurrentRule({ ...currentRule, identifier: e.target.value })}
                                    placeholder="Es: Acconto Adulti"
                                />
                                <p className="text-xs text-gray-500 mt-1">Deve corrispondere esattamente alla stringa nell'ordine.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Nome Visualizzato (Gestionale)</label>
                                <input
                                    type="text"
                                    className="w-full border p-2 rounded"
                                    value={currentRule.nome || ""}
                                    onChange={e => setCurrentRule({ ...currentRule, nome: e.target.value })}
                                    placeholder="Es: Adulto (Acconto)"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tipo</label>
                                    <select
                                        className="w-full border p-2 rounded"
                                        value={currentRule.type}
                                        onChange={e => setCurrentRule({ ...currentRule, type: e.target.value })}
                                    >
                                        <option value="STANDARD">Standard</option>
                                        <option value="ACCONTO">Acconto</option>
                                        <option value="GRATUITO">Gratuito</option>
                                        <option value="RIDOTTO">Ridotto</option>
                                        <option value="SUPPLEMENTO">Supplemento</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Prezzo Pieno (€)</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded"
                                        value={currentRule.fullPrice}
                                        onChange={e => setCurrentRule({ ...currentRule, fullPrice: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {currentRule.type === 'ACCONTO' && (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Valore Acconto (€)</label>
                                    <input
                                        type="number"
                                        className="w-full border p-2 rounded"
                                        value={currentRule.depositPrice || ""}
                                        onChange={e => setCurrentRule({ ...currentRule, depositPrice: parseFloat(e.target.value) })}
                                        placeholder="Opzionale (se diverso dal pagato)"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Salva Regola
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
