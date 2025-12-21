"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, User, Loader2, Save, X, Mail, Key, Copy, Check } from "lucide-react";

interface Operatore {
    id: string;
    nome: string;
    email?: string;
}

export function OperatoriManager() {
    const [operatori, setOperatori] = useState<Operatore[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Form States
    const [isAdding, setIsAdding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newNome, setNewNome] = useState("");
    const [newEmail, setNewEmail] = useState("");
    // Password display after creation
    const [createdPassword, setCreatedPassword] = useState<string | null>(null);
    const [createdNome, setCreatedNome] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadOperatori();
    }, []);

    const loadOperatori = async () => {
        try {
            setIsLoading(true);
            const res = await fetch("/api/impostazioni/operatori");
            if (res.ok) {
                const data = await res.json();
                setOperatori(data);
            }
        } catch (error) {
            console.error("Errore caricamento operatori", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newNome.trim()) return;

        setIsSaving(true);
        try {
            const res = await fetch("/api/impostazioni/operatori", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome: newNome,
                    email: newEmail
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setNewNome("");
                setNewEmail("");
                setIsAdding(false);
                loadOperatori();
                // Show generated password
                if (data.generatedPassword) {
                    setCreatedNome(data.nome);
                    setCreatedPassword(data.generatedPassword);
                }
            } else {
                alert("Errore durante la creazione");
            }
        } catch (error) {
            console.error(error);
            alert("Errore di rete");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Sei sicuro di voler eliminare questo operatore?")) return;

        try {
            const res = await fetch(`/api/impostazioni/operatori/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setOperatori(operatori.filter((op) => op.id !== id));
            } else {
                alert("Errore durante l'eliminazione");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Gestione Operatori</h2>
                    <p className="text-sm text-gray-500">
                        Configura gli operatori che possono gestire le pratiche.
                    </p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    disabled={isAdding}
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                    Aggiungi Operatore
                </button>
            </div>

            {/* Form Aggiunta */}
            {isAdding && (
                <div className="mb-6 rounded-md border border-blue-100 bg-blue-50 p-4">
                    <h3 className="text-sm font-medium text-blue-900 mb-3">Nuovo Operatore</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-blue-900 mb-1">Nome *</label>
                            <input
                                autoFocus
                                type="text"
                                className="w-full rounded border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                placeholder="es. Mario Rossi"
                                value={newNome}
                                onChange={(e) => setNewNome(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-blue-900 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full rounded border-blue-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                placeholder="mario@example.com"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
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
                            disabled={!newNome.trim() || isSaving}
                            className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Salva
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="divide-y divide-gray-100 border-t">
                    {operatori.length === 0 ? (
                        <div className="py-8 text-center text-sm text-gray-500">
                            Nessun operatore configurato.
                        </div>
                    ) : (
                        operatori.map((op) => (
                            <div key={op.id} className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded -mx-2 bg-white transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-gray-900">{op.nome}</div>
                                        {op.email && (
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <Mail className="h-3 w-3" />
                                                {op.email}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(op.id)}
                                    className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                    title="Elimina"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
