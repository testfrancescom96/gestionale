"use client";

import { useState, useEffect, useRef } from "react";
import { Search, UserPlus } from "lucide-react";
import { NuovoClienteModal } from "@/components/clienti/NuovoClienteModal";

interface Step1Props {
    formData: any;
    setFormData: (data: any) => void;
}

export function Step1({ formData, setFormData }: Step1Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clienteSelezionato, setClienteSelezionato] = useState<any>(null);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Load initial data
    const [operatori, setOperatori] = useState<{ id: string, nome: string }[]>([]);
    const [tipiViaggio, setTipiViaggio] = useState<{ id: string, nome: string }[]>([]);

    // Search timeout ref
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Load operators
        fetch("/api/impostazioni/operatori")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setOperatori(data);
            })
            .catch((err) => console.error(err));

        // Load trip types
        fetch("/api/impostazioni/tipi-viaggio")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setTipiViaggio(data);
            })
            .catch((err) => console.error(err));

        if (formData.clienteId && !clienteSelezionato) {
            fetch(`/api/clienti/${formData.clienteId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.cliente) setClienteSelezionato(data.cliente);
                })
                .catch(err => console.error(err));
        }
    }, [formData.clienteId]);

    // Sync Cliente -> 1st Partecipante (Only on new client selection or if empty)
    useEffect(() => {
        if (!clienteSelezionato) return;

        setFormData((prev: any) => {
            const currentPax = prev.partecipanti || [];
            // If list is empty OR has 1 empty placeholder, initialize/overwrite with client
            const isPlaceholder = currentPax.length === 1 && !currentPax[0].nome && !currentPax[0].cognome;

            if (currentPax.length === 0 || isPlaceholder) {
                return {
                    ...prev,
                    partecipanti: [{
                        nome: clienteSelezionato.nome,
                        cognome: clienteSelezionato.cognome,
                        dataNascita: clienteSelezionato.dataNascita ? new Date(clienteSelezionato.dataNascita) : null,
                        tipo: "ADULTO",
                        sistemazione: isPlaceholder ? currentPax[0].sistemazione : ""
                    }],
                    numAdulti: 1,
                    numBambini: 0
                };
            }
            return prev;
        });
    }, [clienteSelezionato]);

    const handleChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSearch = (query: string) => {
        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/clienti?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSearchResults(data.clienti || []);
                }
            } catch (error) {
                console.error("Errore ricerca clienti", error);
            }
        }, 300);
    };

    const handleSelectCliente = (cliente: any) => {
        setClienteSelezionato(cliente);
        handleChange("clienteId", cliente.id);
        setSearchResults([]);
    };

    const handleClienteCreato = (cliente: any) => {
        setClienteSelezionato(cliente);
        handleChange("clienteId", cliente.id);
        setIsModalOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Cliente Section */}
            <div>
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Cliente</h3>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Cerca Cliente
                            </label>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(true)}
                                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                            >
                                + Crea Nuovo
                            </button>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cerca per nome o telefono..."
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />

                            {/* Risultati Ricerca */}
                            {searchResults.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                                    <ul className="max-h-60 overflow-auto py-1">
                                        {searchResults.map((c) => (
                                            <li
                                                key={c.id}
                                                onClick={() => handleSelectCliente(c)}
                                                className="cursor-pointer border-b border-gray-50 px-4 py-2 hover:bg-gray-50 last:border-0"
                                            >
                                                <div className="font-medium text-gray-900">
                                                    {c.nome} {c.cognome}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    CF: {c.codiceFiscale || "—"} • Tel: {c.telefono || "—"}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Viaggio Section */}
            <div className="border-t pt-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Viaggio</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Destinazione <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.destinazione}
                            onChange={(e) => handleChange("destinazione", e.target.value)}
                            placeholder="es: Barcellona, Grecia, Crociera MSC..."
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Tipologia <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.tipologia}
                            onChange={(e) => handleChange("tipologia", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">Seleziona...</option>
                            {tipiViaggio.map(t => (
                                <option key={t.id} value={t.nome}>{t.nome}</option>
                            ))}
                            <option value="NEW_TYPE">+ Aggiungi Nuova...</option>
                        </select>
                        {formData.tipologia === "NEW_TYPE" && (
                            <input
                                autoFocus
                                type="text"
                                className="mt-2 w-full rounded-lg border border-blue-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                                placeholder="Scrivi nuova tipologia..."
                                onBlur={async (e) => {
                                    const val = e.target.value;
                                    if (val) {
                                        try {
                                            const res = await fetch("/api/impostazioni/tipi-viaggio", {
                                                method: "POST",
                                                body: JSON.stringify({ nome: val })
                                            });
                                            if (res.ok) {
                                                const newItem = await res.json();
                                                setTipiViaggio(prev => [...prev, newItem].sort((a, b) => a.nome.localeCompare(b.nome)));
                                                handleChange("tipologia", newItem.nome);
                                            }
                                        } catch (err) { console.error(err); }
                                    } else {
                                        handleChange("tipologia", "");
                                    }
                                }}
                            />
                        )}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Periodo Richiesto
                        </label>
                        <input
                            type="text"
                            value={formData.periodoRichiesto}
                            onChange={(e) => handleChange("periodoRichiesto", e.target.value)}
                            placeholder="es: Agosto, 15-22 Luglio"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Data Partenza
                        </label>
                        <input
                            type="date"
                            value={formData.dataPartenza}
                            onChange={(e) => handleChange("dataPartenza", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Data Ritorno
                        </label>
                        <input
                            type="date"
                            value={formData.dataRitorno}
                            onChange={(e) => handleChange("dataRitorno", e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Partecipanti Section */}
            <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Partecipanti e Sistemazione</h3>
                    <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                        Riassunto: <strong>{formData.partecipanti?.filter((p: any) => p.tipo === "ADULTO").length || 0} Adulti</strong>,
                        <strong> {formData.partecipanti?.filter((p: any) => p.tipo === "BAMBINO").length || 0} Bambini</strong>
                    </div>
                </div>

                <div className="mb-4 flex gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            const newP = [...(formData.partecipanti || [])];
                            newP.push({ nome: "", cognome: "", tipo: "ADULTO", sistemazione: "" });
                            handleChange("partecipanti", newP);
                            handleChange("numAdulti", (formData.numAdulti || 0) + 1);
                        }}
                        className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 border border-blue-200"
                    >
                        <UserPlus className="h-4 w-4" />
                        Aggiungi Adulto
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const newP = [...(formData.partecipanti || [])];
                            newP.push({ nome: "", cognome: "", tipo: "BAMBINO", sistemazione: "" });
                            handleChange("partecipanti", newP);
                            handleChange("numBambini", (formData.numBambini || 0) + 1);
                        }}
                        className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 border border-green-200"
                    >
                        <UserPlus className="h-4 w-4" />
                        Aggiungi Bambino
                    </button>
                </div>

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nome e Cognome</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data di Nascita</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sistemazione (Camera)</th>
                                <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {(!formData.partecipanti || formData.partecipanti.length === 0) && (
                                <tr>
                                    <td colSpan={5} className="p-4 text-center text-sm text-gray-500 italic">
                                        Nessun partecipante inserito. Aggiungine uno sopra.
                                    </td>
                                </tr>
                            )}
                            {formData.partecipanti?.map((p: any, index: number) => (
                                <tr key={index} className="group hover:bg-gray-50">
                                    <td className="px-3 py-2">
                                        <select
                                            value={p.tipo || "ADULTO"}
                                            onChange={(e) => {
                                                const newP = [...formData.partecipanti];
                                                const oldType = p.tipo;
                                                const newType = e.target.value;
                                                newP[index] = { ...newP[index], tipo: newType };
                                                handleChange("partecipanti", newP);

                                                if (oldType !== newType) {
                                                    if (oldType === "ADULTO") handleChange("numAdulti", Math.max(0, (formData.numAdulti || 1) - 1));
                                                    else handleChange("numBambini", Math.max(0, (formData.numBambini || 0) - 1));

                                                    if (newType === "ADULTO") handleChange("numAdulti", (formData.numAdulti || 0) + 1);
                                                    else handleChange("numBambini", (formData.numBambini || 0) + 1);
                                                }
                                            }}
                                            className="block w-full rounded border-gray-300 py-1 text-xs focus:border-blue-500 focus:ring-blue-500"
                                        >
                                            <option value="ADULTO">ADULTO</option>
                                            <option value="BAMBINO">BAMBINO</option>
                                            <option value="NEONATO">NEONATO</option>
                                        </select>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Nome"
                                                value={p.nome || ""}
                                                onChange={(e) => {
                                                    const newP = [...formData.partecipanti];
                                                    newP[index] = { ...newP[index], nome: e.target.value };
                                                    handleChange("partecipanti", newP);
                                                }}
                                                className="w-1/2 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Cognome"
                                                value={p.cognome || ""}
                                                onChange={(e) => {
                                                    const newP = [...formData.partecipanti];
                                                    newP[index] = { ...newP[index], cognome: e.target.value };
                                                    handleChange("partecipanti", newP);
                                                }}
                                                className="w-1/2 rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        {index === 0 && <span className="text-[10px] text-blue-600 font-medium">Intestatario</span>}
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="date"
                                            value={p.dataNascita ? new Date(p.dataNascita).toISOString().split('T')[0] : ""}
                                            onChange={(e) => {
                                                const newP = [...formData.partecipanti];
                                                newP[index] = { ...newP[index], dataNascita: e.target.value ? new Date(e.target.value) : null };
                                                handleChange("partecipanti", newP);
                                            }}
                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            type="text"
                                            placeholder="Es. Camera 1"
                                            value={p.sistemazione || ""}
                                            onChange={(e) => {
                                                const newP = [...formData.partecipanti];
                                                newP[index] = { ...newP[index], sistemazione: e.target.value };
                                                handleChange("partecipanti", newP);
                                            }}
                                            list="camere-list"
                                            className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
                                        />
                                        <datalist id="camere-list">
                                            <option value="Camera 1" />
                                            <option value="Camera 2" />
                                            <option value="Matrimoniale" />
                                            <option value="Singola" />
                                        </datalist>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const newP = formData.partecipanti.filter((_: any, i: number) => i !== index);
                                                handleChange("partecipanti", newP);
                                                if (p.tipo === "ADULTO") handleChange("numAdulti", Math.max(0, (formData.numAdulti || 0) - 1));
                                                else handleChange("numBambini", Math.max(0, (formData.numBambini || 0) - 1));
                                            }}
                                            className="text-gray-400 hover:text-red-600"
                                            title="Rimuovi"
                                        >
                                            <span className="text-xl">&times;</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="hidden">
                    <input type="number" value={formData.numAdulti} readOnly />
                    <input type="number" value={formData.numBambini} readOnly />
                </div>
            </div>

            {/* Infor Section */}
            <div className="border-t pt-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Informazioni</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Operatore <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            list="operatori-list"
                            value={formData.operatore}
                            onChange={(e) => handleChange("operatore", e.target.value.toUpperCase())}
                            placeholder="Seleziona o scrivi operatore..."
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoComplete="off"
                        />
                        <datalist id="operatori-list">
                            {/* @ts-ignore */}
                            {operatori.map((op: any) => (
                                <option key={op.id} value={op.nome} />
                            ))}
                        </datalist>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Città di Partenza
                        </label>
                        <input
                            type="text"
                            value={formData.cittaPartenza}
                            onChange={(e) => handleChange("cittaPartenza", e.target.value)}
                            placeholder="es: Pescara, Roma FCO"
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Note / Richieste Speciali
                        </label>
                        <textarea
                            value={formData.note}
                            onChange={(e) => handleChange("note", e.target.value)}
                            rows={3}
                            placeholder="es: Viaggio di nozze, addio al nubilato, esigenze particolari..."
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            <NuovoClienteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onClienteCreato={handleClienteCreato}
            />
        </div>
    );
}
