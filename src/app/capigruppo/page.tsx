"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Search, Phone, Mail, MapPin, Loader2, UserPlus } from "lucide-react";

interface Capogruppo {
    id: number;
    nome: string;
    cognome: string;
    telefono?: string;
    email?: string;
    citta?: string;
    tipo: "CAPOGRUPPO" | "GUIDA";
    note?: string;
}

export default function CapigruppoPage() {
    const [capigruppo, setCapigruppo] = useState<Capogruppo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [filterTipo, setFilterTipo] = useState<string>("ALL");

    const [formData, setFormData] = useState({
        nome: "",
        cognome: "",
        telefono: "",
        email: "",
        citta: "",
        tipo: "CAPOGRUPPO" as "CAPOGRUPPO" | "GUIDA",
        note: ""
    });

    const fetchCapigruppo = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/capigruppo");
            const data = await res.json();
            setCapigruppo(data);
        } catch (error) {
            console.error("Errore caricamento capigruppo:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCapigruppo();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/capigruppo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                setFormData({ nome: "", cognome: "", telefono: "", email: "", citta: "", tipo: "CAPOGRUPPO", note: "" });
                setShowForm(false);
                fetchCapigruppo();
            } else {
                alert("Errore nel salvataggio");
            }
        } catch (error) {
            console.error("Errore:", error);
        }
    };

    const filteredCapigruppo = capigruppo.filter(c => {
        const matchSearch =
            c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.cognome.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.citta?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchTipo = filterTipo === "ALL" || c.tipo === filterTipo;
        return matchSearch && matchTipo;
    });

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Capigruppo e Guide</h1>
                    <p className="text-gray-500 mt-1">Gestisci i referenti per i viaggi di gruppo</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <UserPlus className="h-5 w-5" />
                    Aggiungi
                </button>
            </div>

            {/* Form Inline */}
            {showForm && (
                <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
                    <h3 className="font-semibold mb-4">Nuovo Capogruppo / Guida</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="Nome *"
                            value={formData.nome}
                            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                            className="border rounded-lg px-3 py-2"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Cognome *"
                            value={formData.cognome}
                            onChange={(e) => setFormData({ ...formData, cognome: e.target.value })}
                            className="border rounded-lg px-3 py-2"
                            required
                        />
                        <select
                            value={formData.tipo}
                            onChange={(e) => setFormData({ ...formData, tipo: e.target.value as "CAPOGRUPPO" | "GUIDA" })}
                            className="border rounded-lg px-3 py-2"
                        >
                            <option value="CAPOGRUPPO">Capogruppo</option>
                            <option value="GUIDA">Guida</option>
                        </select>
                        <input
                            type="tel"
                            placeholder="Telefono"
                            value={formData.telefono}
                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            className="border rounded-lg px-3 py-2"
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="border rounded-lg px-3 py-2"
                        />
                        <input
                            type="text"
                            placeholder="Città"
                            value={formData.citta}
                            onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                            className="border rounded-lg px-3 py-2"
                        />
                        <div className="md:col-span-3">
                            <textarea
                                placeholder="Note"
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                className="w-full border rounded-lg px-3 py-2"
                                rows={2}
                            />
                        </div>
                        <div className="md:col-span-3 flex gap-2 justify-end">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg">
                                Annulla
                            </button>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Salva
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filtri */}
            <div className="bg-white rounded-lg p-4 shadow-sm border mb-6 flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cerca per nome, cognome, città..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    />
                </div>
                <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                >
                    <option value="ALL">Tutti i tipi</option>
                    <option value="CAPOGRUPPO">Solo Capigruppo</option>
                    <option value="GUIDA">Solo Guide</option>
                </select>
            </div>

            {/* Lista */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            ) : filteredCapigruppo.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nessun capogruppo o guida trovato</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCapigruppo.map((c) => (
                        <div key={c.id} className="bg-white rounded-lg p-4 shadow-sm border hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{c.cognome} {c.nome}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.tipo === "CAPOGRUPPO" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                                        }`}>
                                        {c.tipo === "CAPOGRUPPO" ? "Capogruppo" : "Guida"}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                                {c.telefono && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3 w-3" />
                                        <a href={`tel:${c.telefono}`} className="hover:text-blue-600">{c.telefono}</a>
                                    </div>
                                )}
                                {c.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3 w-3" />
                                        <a href={`mailto:${c.email}`} className="hover:text-blue-600">{c.email}</a>
                                    </div>
                                )}
                                {c.citta && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3 w-3" />
                                        <span>{c.citta}</span>
                                    </div>
                                )}
                            </div>
                            {c.note && (
                                <p className="mt-2 text-xs text-gray-500 italic">{c.note}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
