
"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2, Save, X } from "lucide-react";

interface ListItem {
    id: string;
    nome?: string;
    valore?: string;
    descrizione?: string | null;
    defaultAliquota?: string | null;
}

interface ListManagerProps {
    title: string;
    description: string;
    apiEndpoint: string;
    placeholder: string;
    fieldKey: "nome" | "valore"; // Chiave principale da visualizzare/editare
    extraField?: {
        key: "defaultAliquota";
        label: string;
        options: { value: string; label: string }[];
    };
}

export function ListManager({ title, description, apiEndpoint, placeholder, fieldKey, extraField }: ListManagerProps) {
    const [items, setItems] = useState<ListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // State inserimento
    const [isAdding, setIsAdding] = useState(false);
    const [newItemValue, setNewItemValue] = useState("");
    const [newItemDesc, setNewItemDesc] = useState("");
    const [newItemExtra, setNewItemExtra] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const res = await fetch(apiEndpoint);
            if (!res.ok) throw new Error("Errore recupero dati");
            const data = await res.json();
            setItems(data);
        } catch (err) {
            setError("Impossibile caricare la lista.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newItemValue.trim()) return;
        setIsSaving(true);
        try {
            const payload: any = {
                [fieldKey]: newItemValue,
                descrizione: newItemDesc
            };
            if (extraField) {
                payload[extraField.key] = newItemExtra;
            }

            const res = await fetch(apiEndpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Errore salvataggio");

            await fetchItems();
            setNewItemValue("");
            setNewItemDesc("");
            setNewItemExtra("");
            setIsAdding(false);
        } catch (err) {
            alert("Errore durante il salvataggio");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questa voce?")) return;
        try {
            const res = await fetch(`${apiEndpoint}?id=${id}`, {
                method: "DELETE"
            });
            if (!res.ok) throw new Error("Errore eliminazione");
            setItems(items.filter(i => i.id !== id));
        } catch (err) {
            alert("Impossibile eliminare l'elemento (potrebbe essere in uso).");
        }
    };

    return (
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                    disabled={isAdding}
                >
                    <Plus className="h-4 w-4" />
                    Aggiungi
                </button>
            </div>

            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

            {/* Form Aggiunta */}
            {isAdding && (
                <div className="mb-6 rounded-md border border-blue-100 bg-blue-50 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                            <label className="block text-xs font-medium text-blue-900 mb-1">
                                {fieldKey === "nome" ? "Nome" : "Valore"}
                            </label>
                            <input
                                autoFocus
                                type="text"
                                className="w-full rounded border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                placeholder={placeholder}
                                value={newItemValue}
                                onChange={e => setNewItemValue(e.target.value)}
                            />
                        </div>
                        {extraField && (
                            <div>
                                <label className="block text-xs font-medium text-blue-900 mb-1">{extraField.label}</label>
                                <select
                                    className="w-full rounded border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                    value={newItemExtra}
                                    onChange={e => setNewItemExtra(e.target.value)}
                                >
                                    <option value="">Seleziona...</option>
                                    {extraField.options.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className={extraField ? "md:col-span-2" : ""}>
                            <label className="block text-xs font-medium text-blue-900 mb-1">Descrizione</label>
                            <input
                                type="text"
                                className="w-full rounded border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                placeholder="Opzionale"
                                value={newItemDesc}
                                onChange={e => setNewItemDesc(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="flex items-center gap-1 rounded px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200"
                        >
                            <X className="h-4 w-4" /> Annulla
                        </button>
                        <button
                            onClick={handleAdd}
                            disabled={!newItemValue.trim() || isSaving}
                            className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Salva
                        </button>
                    </div>
                </div>
            )}

            {/* Lista */}
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
            ) : items.length === 0 ? (
                <div className="rounded-md border border-dashed p-8 text-center text-sm text-gray-500">
                    Nessun elemento presente.
                </div>
            ) : (
                <div className="divide-y border-t">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded transition-colors">
                            <div>
                                <p className="font-medium text-gray-900">{item[fieldKey]}</p>
                                <div className="flex gap-2">
                                    {item.descrizione && (
                                        <p className="text-xs text-gray-500">{item.descrizione}</p>
                                    )}
                                    {extraField && item[extraField.key] && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-1.5 rounded">
                                            Default IVA: {item[extraField.key]}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                title="Elimina"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
