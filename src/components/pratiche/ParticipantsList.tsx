"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, User, Save, X, AlertTriangle } from "lucide-react";

interface Partecipante {
    id: string;
    nome: string;
    cognome: string;
    dataNascita: string | null;
    tipo: string;
    tipoDocumento: string | null;
    numeroDocumento: string | null;
    scadenzaDocumento: string | null;
    codiceFiscale: string | null;
    luogoNascita: string | null;
    nazionalita: string | null;
    sistemazione: string | null;
    note: string | null;
}

export function ParticipantsList({ praticaId, numPartecipantiAttesi }: { praticaId: string, numPartecipantiAttesi: number }) {
    const [partecipanti, setPartecipanti] = useState<Partecipante[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<string | null>(null); // ID del partecipante in modifica, o "new"
    const [editForm, setEditForm] = useState<Partial<Partecipante>>({});

    // Calcolo coerenza
    const showWarning = partecipanti.length !== numPartecipantiAttesi;

    useEffect(() => {
        loadPartecipanti();
    }, [praticaId]);

    const loadPartecipanti = async () => {
        try {
            const res = await fetch(`/api/pratiche/${praticaId}/partecipanti`);
            if (res.ok) {
                const data = await res.json();
                setPartecipanti(data);
            }
        } catch (error) {
            console.error("Errore caricamento partecipanti", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (p: Partecipante) => {
        setEditForm(p);
        setIsEditing(p.id);
    };

    const handleNew = () => {
        setEditForm({
            nome: "",
            cognome: "",
            tipo: "ADULTO",
            tipoDocumento: "CARTA_IDENTITA",
        });
        setIsEditing("new");
    };

    const handleCancel = () => {
        setIsEditing(null);
        setEditForm({});
    };

    const handleSave = async () => {
        if (!editForm.nome || !editForm.cognome) {
            alert("Nome e Cognome sono obbligatori");
            return;
        }

        try {
            let res;
            if (isEditing === "new") {
                res = await fetch(`/api/pratiche/${praticaId}/partecipanti`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(editForm),
                });
            } else {
                res = await fetch(`/api/partecipanti/${isEditing}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(editForm),
                });
            }

            if (res.ok) {
                await loadPartecipanti();
                setIsEditing(null);
            } else {
                alert("Errore durante il salvataggio");
            }
        } catch (error) {
            console.error("Errore salvataggio", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Sei sicuro di voler rimuovere questo partecipante?")) return;

        try {
            const res = await fetch(`/api/partecipanti/${id}`, { method: "DELETE" });
            if (res.ok) {
                loadPartecipanti();
            }
        } catch (error) {
            console.error("Errore eliminazione", error);
        }
    };

    if (isLoading) return <div className="text-sm text-gray-500">Caricamento partecipanti...</div>;

    return (
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-gray-900">Partecipanti ({partecipanti.length})</h2>
                </div>
                {!isEditing && (
                    <button
                        onClick={handleNew}
                        className="flex items-center gap-2 rounded-md bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                    >
                        <Plus className="h-3 w-3" /> Aggiungi
                    </button>
                )}
            </div>

            {/* Warning Coerenza */}
            {showWarning && !isLoading && (
                <div className="mb-4 flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>
                        Attenzione: Hai dichiarato <strong>{numPartecipantiAttesi}</strong> persone nella pratica, ma ne risultano inserite <strong>{partecipanti.length}</strong>.
                    </span>
                </div>
            )}

            <div className="space-y-4">
                {partecipanti.map((p) => (
                    <div key={p.id} className="rounded-md border border-gray-100 p-3 hover:bg-gray-50">
                        {isEditing === p.id ? (
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        className="rounded border p-1 text-sm"
                                        placeholder="Nome"
                                        value={editForm.nome || ""}
                                        onChange={e => setEditForm({ ...editForm, nome: e.target.value })}
                                    />
                                    <input
                                        className="rounded border p-1 text-sm"
                                        placeholder="Cognome"
                                        value={editForm.cognome || ""}
                                        onChange={e => setEditForm({ ...editForm, cognome: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <input
                                        type="date"
                                        className="rounded border p-1 text-sm"
                                        title="Data di Nascita"
                                        value={editForm.dataNascita ? String(editForm.dataNascita).split('T')[0] : ""}
                                        onChange={e => setEditForm({ ...editForm, dataNascita: e.target.value })}
                                    />
                                    <select
                                        className="rounded border p-1 text-sm"
                                        value={editForm.tipo || "ADULTO"}
                                        onChange={e => setEditForm({ ...editForm, tipo: e.target.value })}
                                    >
                                        <option value="ADULTO">Adulto</option>
                                        <option value="BAMBINO">Bambino</option>
                                        <option value="NEONATO">Neonato</option>
                                    </select>
                                    <input
                                        className="rounded border p-1 text-sm"
                                        placeholder="Codice Fiscale"
                                        value={editForm.codiceFiscale || ""}
                                        onChange={e => setEditForm({ ...editForm, codiceFiscale: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        className="rounded border p-1 text-sm"
                                        placeholder="Luogo di Nascita"
                                        value={editForm.luogoNascita || ""}
                                        onChange={e => setEditForm({ ...editForm, luogoNascita: e.target.value })}
                                    />
                                    <input
                                        className="rounded border p-1 text-sm"
                                        placeholder="Nazionalità (es: IT)"
                                        maxLength={2}
                                        value={editForm.nazionalita || ""}
                                        onChange={e => setEditForm({ ...editForm, nazionalita: e.target.value.toUpperCase() })}
                                    />
                                    <input
                                        className="rounded border p-1 text-sm col-span-2"
                                        placeholder="Sistemazione (es: Camera 1, Matrimoniale)"
                                        value={editForm.sistemazione || ""}
                                        onChange={e => setEditForm({ ...editForm, sistemazione: e.target.value })}
                                        list="list-camere-edit"
                                    />
                                </div>
                                <datalist id="list-camere-edit">
                                    <option value="Camera 1" />
                                    <option value="Camera 2" />
                                    <option value="Matrimoniale" />
                                    <option value="Singola" />
                                </datalist>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
                                        <X className="h-4 w-4" />
                                    </button>
                                    <button onClick={handleSave} className="text-green-600 hover:text-green-700">
                                        <Save className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900">{p.nome} {p.cognome}</p>
                                    <p className="text-xs text-gray-500">
                                        {p.tipo} • {p.dataNascita ? new Date(p.dataNascita).toLocaleDateString() : "Data nascita mancante"}
                                    </p>
                                    {p.sistemazione && (
                                        <p className="text-xs text-blue-600 font-medium mt-1">
                                            {p.sistemazione}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(p)} className="text-gray-400 hover:text-blue-600">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(p.id)} className="text-gray-400 hover:text-red-600">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {isEditing === "new" && (
                <div className="mt-4 rounded-md border border-indigo-100 bg-indigo-50 p-3">
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-indigo-900">Nuovo Partecipante</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                className="rounded border p-1 text-sm"
                                placeholder="Nome"
                                value={editForm.nome || ""}
                                onChange={e => setEditForm({ ...editForm, nome: e.target.value })}
                            />
                            <input
                                className="rounded border p-1 text-sm"
                                placeholder="Cognome"
                                value={editForm.cognome || ""}
                                onChange={e => setEditForm({ ...editForm, cognome: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <input
                                className="rounded border p-1 text-sm"
                                placeholder="Codice Fiscale"
                                value={editForm.codiceFiscale || ""}
                                onChange={e => setEditForm({ ...editForm, codiceFiscale: e.target.value.toUpperCase() })}
                            />
                            <input
                                type="date"
                                className="rounded border p-1 text-sm"
                                title="Data di Nascita"
                                value={editForm.dataNascita || ""}
                                onChange={e => setEditForm({ ...editForm, dataNascita: e.target.value })}
                            />
                            <select
                                className="rounded border p-1 text-sm"
                                value={editForm.tipo || "ADULTO"}
                                onChange={e => setEditForm({ ...editForm, tipo: e.target.value })}
                            >
                                <option value="ADULTO">Adulto</option>
                                <option value="BAMBINO">Bambino</option>
                                <option value="NEONATO">Neonato</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <input
                                className="rounded border p-1 text-sm"
                                placeholder="Luogo di Nascita"
                                value={editForm.luogoNascita || ""}
                                onChange={e => setEditForm({ ...editForm, luogoNascita: e.target.value })}
                            />
                            <input
                                className="rounded border p-1 text-sm"
                                placeholder="Nazionalità (es: IT)"
                                maxLength={2}
                                value={editForm.nazionalita || ""}
                                onChange={e => setEditForm({ ...editForm, nazionalita: e.target.value.toUpperCase() })}
                            />
                            <input
                                className="rounded border p-1 text-sm col-span-2"
                                placeholder="Sistemazione (es: Camera 1, Matrimoniale)"
                                value={editForm.sistemazione || ""}
                                onChange={e => setEditForm({ ...editForm, sistemazione: e.target.value })}
                                list="list-camere-new"
                            />
                            <datalist id="list-camere-new">
                                <option value="Camera 1" />
                                <option value="Camera 2" />
                                <option value="Matrimoniale" />
                                <option value="Singola" />
                            </datalist>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
                                <X className="h-4 w-4" /> Annulla
                            </button>
                            <button onClick={handleSave} className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium">
                                <Save className="h-4 w-4" /> Salva
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
