
"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, User } from "lucide-react";

interface Operatore {
    id: string;
    nome: string;
    email?: string;
}

export function OperatoriManager() {
    const [operatori, setOperatori] = useState<Operatore[]>([]);
    const [newOperatore, setNewOperatore] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadOperatori();
    }, []);

    const loadOperatori = async () => {
        try {
            const res = await fetch("/api/impostazioni/operatori");
            if (res.ok) {
                const data = await res.json();
                setOperatori(data);
            }
        } catch (error) {
            console.error("Errore caricamento operatori", error);
        }
    };

    const handleAdd = async () => {
        if (!newOperatore.trim()) return;

        setIsLoading(true);
        try {
            const res = await fetch("/api/impostazioni/operatori", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome: newOperatore }),
            });

            if (res.ok) {
                setNewOperatore("");
                loadOperatori();
            } else {
                alert("Errore durante la creazione");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
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
        <div className="space-y-4">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newOperatore}
                    onChange={(e) => setNewOperatore(e.target.value)}
                    placeholder="Nuovo operatore (es. MARIO)"
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                <button
                    onClick={handleAdd}
                    disabled={isLoading || !newOperatore.trim()}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" />
                    Aggiungi
                </button>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white">
                <ul className="divide-y divide-gray-100">
                    {operatori.length === 0 ? (
                        <li className="p-4 text-center text-sm text-gray-500">
                            Nessun operatore configurato.
                        </li>
                    ) : (
                        operatori.map((op) => (
                            <li key={op.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <span className="font-medium text-gray-900">{op.nome}</span>
                                </div>
                                <button
                                    onClick={() => handleDelete(op.id)}
                                    className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                                    title="Elimina"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
}
