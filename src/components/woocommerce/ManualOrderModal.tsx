"use client";

import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle2, Plus, Trash2, Users } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    product: any; // WooProduct
    onSuccess?: () => void;
}

interface FieldConfig {
    fieldKey: string;
    label: string;
    mappingType: string;
    isDefaultSelected?: boolean;
}

interface Participant {
    nome: string;
    cognome: string;
    [key: string]: string; // Dynamic fields
}

export function ManualOrderModal({ isOpen, onClose, product, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [loadingFields, setLoadingFields] = useState(true);
    const [fields, setFields] = useState<FieldConfig[]>([]);

    // Participant data - one object per person
    const [participants, setParticipants] = useState<Participant[]>([{ nome: "", cognome: "" }]);

    // Common booking data
    const [bookingData, setBookingData] = useState({
        telefono: "",
        email: "",
        puntoPartenza: "",
        note: ""
    });

    // Load fields configuration when modal opens
    useEffect(() => {
        if (isOpen && product) {
            loadFields();
        }
    }, [isOpen, product]);

    const loadFields = async () => {
        setLoadingFields(true);
        try {
            // Load product-specific fields
            const res = await fetch(`/api/woocommerce/products/${product.id}/fields`);
            const productFields = await res.json();

            // Load global config for labels
            const configRes = await fetch("/api/woocommerce/config/fields");
            const globalConfig = await configRes.json();

            // Create label map
            const labelMap = new Map<string, string>();
            globalConfig.forEach((f: any) => {
                labelMap.set(f.fieldKey, f.label);
            });

            // Filter to only show fields that make sense for manual entry
            // Exclude billing info (we handle email/phone separately) and hidden fields
            const hiddenKeys = new Set(
                globalConfig
                    .filter((f: any) => f.mappingType === 'HIDDEN')
                    .map((f: any) => f.fieldKey)
            );

            const relevantFields = productFields
                .filter((f: any) =>
                    !hiddenKeys.has(f.fieldKey) &&
                    !f.fieldKey.includes('billing') &&
                    !f.fieldKey.toLowerCase().includes('email') &&
                    !f.fieldKey.toLowerCase().includes('telefono') &&
                    !f.fieldKey.toLowerCase().includes('phone') &&
                    f.fieldKey !== '_field_Nome' &&
                    f.fieldKey !== '_field_Cognome'
                )
                .map((f: any) => ({
                    ...f,
                    label: labelMap.get(f.fieldKey) || f.label || f.fieldKey.replace(/_/g, ' ').replace('field ', '')
                }));

            setFields(relevantFields);
        } catch (error) {
            console.error("Error loading fields:", error);
        } finally {
            setLoadingFields(false);
        }
    };

    // Update participant count
    const updateParticipantCount = (count: number) => {
        const newCount = Math.max(1, Math.min(20, count)); // 1-20 participants
        const currentCount = participants.length;

        if (newCount > currentCount) {
            // Add participants
            const toAdd = newCount - currentCount;
            const newParticipants = [...participants];
            for (let i = 0; i < toAdd; i++) {
                const emptyParticipant: Participant = { nome: "", cognome: "" };
                fields.forEach(f => { emptyParticipant[f.fieldKey] = ""; });
                newParticipants.push(emptyParticipant);
            }
            setParticipants(newParticipants);
        } else if (newCount < currentCount) {
            // Remove participants
            setParticipants(participants.slice(0, newCount));
        }
    };

    // Update a specific participant's field
    const updateParticipant = (index: number, field: string, value: string) => {
        const updated = [...participants];
        updated[index] = { ...updated[index], [field]: value };
        setParticipants(updated);
    };

    // Remove a specific participant
    const removeParticipant = (index: number) => {
        if (participants.length > 1) {
            setParticipants(participants.filter((_, i) => i !== index));
        }
    };

    // Add a participant
    const addParticipant = () => {
        const emptyParticipant: Participant = { nome: "", cognome: "" };
        fields.forEach(f => { emptyParticipant[f.fieldKey] = ""; });
        setParticipants([...participants, emptyParticipant]);
    };

    if (!isOpen || !product) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Use first participant as main contact
            const mainContact = participants[0];

            // Prepare custom data with all participants
            const customData = {
                participants: participants.map((p, i) => ({
                    index: i + 1,
                    ...p
                }))
            };

            const res = await fetch("/api/woocommerce/manual-booking", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    wooProductId: product.id,
                    cognome: mainContact.cognome,
                    nome: mainContact.nome,
                    telefono: bookingData.telefono,
                    email: bookingData.email,
                    puntoPartenza: bookingData.puntoPartenza,
                    numPartecipanti: participants.length,
                    note: bookingData.note,
                    customData: customData
                })
            });

            const result = await res.json();

            if (res.ok) {
                // Reset form
                setParticipants([{ nome: "", cognome: "" }]);
                setBookingData({ telefono: "", email: "", puntoPartenza: "", note: "" });

                if (onSuccess) onSuccess();
                onClose();
            } else {
                alert(`Errore: ${result.error || "Impossibile creare prenotazione"}`);
            }

        } catch (error) {
            console.error("Submit error:", error);
            alert("Errore di connessione");
        } finally {
            setLoading(false);
        }
    };

    const isValid = participants.every(p => p.nome && p.cognome);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between shrink-0">
                    <div>
                        <h2 className="text-white text-lg font-bold">Nuova Prenotazione Manuale</h2>
                        <p className="text-blue-100 text-sm">{product.name}</p>
                    </div>
                    <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {loadingFields ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">

                            {/* Participants Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <Users className="h-5 w-5 text-blue-600" />
                                        Partecipanti ({participants.length})
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={addParticipant}
                                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Aggiungi
                                    </button>
                                </div>

                                {participants.map((participant, idx) => (
                                    <div
                                        key={idx}
                                        className={`border rounded-lg p-4 space-y-3 ${idx === 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-600">
                                                {idx === 0 ? '👤 Capogruppo / Referente' : `Partecipante ${idx + 1}`}
                                            </span>
                                            {idx > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeParticipant(idx)}
                                                    className="text-red-500 hover:text-red-600 p-1"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>

                                        {/* Nome + Cognome (always required) */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Nome *</label>
                                                <input
                                                    required
                                                    type="text"
                                                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={participant.nome}
                                                    onChange={e => updateParticipant(idx, 'nome', e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Cognome *</label>
                                                <input
                                                    required
                                                    type="text"
                                                    className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    value={participant.cognome}
                                                    onChange={e => updateParticipant(idx, 'cognome', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {/* Dynamic fields */}
                                        {fields.length > 0 && (
                                            <div className="grid grid-cols-2 gap-3">
                                                {fields.map(field => (
                                                    <div key={field.fieldKey}>
                                                        <label className="block text-xs font-medium text-gray-700 mb-1">
                                                            {field.label}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                            value={participant[field.fieldKey] || ''}
                                                            onChange={e => updateParticipant(idx, field.fieldKey, e.target.value)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Contact & Booking Info (only for main contact) */}
                            <div className="border-t pt-6 space-y-4">
                                <h3 className="font-semibold text-gray-800">Dati Prenotazione</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Telefono</label>
                                        <input
                                            type="tel"
                                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={bookingData.telefono}
                                            onChange={e => setBookingData({ ...bookingData, telefono: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="opzionale"
                                            value={bookingData.email}
                                            onChange={e => setBookingData({ ...bookingData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Punto di Ritrovo</label>
                                    <input
                                        type="text"
                                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="Es. Milano Stazione"
                                        value={bookingData.puntoPartenza}
                                        onChange={e => setBookingData({ ...bookingData, puntoPartenza: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Note</label>
                                    <textarea
                                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-16 resize-none"
                                        placeholder="Note aggiuntive..."
                                        value={bookingData.note}
                                        onChange={e => setBookingData({ ...bookingData, note: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t p-4 bg-gray-50 flex justify-between items-center shrink-0">
                            <span className="text-sm text-gray-500">
                                {participants.length} partecipant{participants.length === 1 ? 'e' : 'i'}
                            </span>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !isValid}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    Conferma Prenotazione
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
