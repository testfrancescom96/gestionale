"use client";

import { useState, useEffect } from "react";
import { Bus, Plus, Phone, Mail, MapPin, Edit2, Trash2, Search } from "lucide-react";
import { AnagraficheTabs } from "@/components/anagrafiche/AnagraficheTabs";
import { NuovoFornitoreModal } from "@/components/fornitori/NuovoFornitoreModal";
import Link from "next/link";

interface Vettore {
    id: string;
    ragioneSociale: string;
    nomeComune?: string;
    partitaIva?: string;
    email?: string;
    telefono?: string;
    indirizzo?: string;
    citta?: string;
    cap?: string;
    tipoFornitore: string;
    note?: string;
}

export default function VettoriAnagrafichePage() {
    const [vettori, setVettori] = useState<Vettore[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);

    const loadVettori = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/fornitori");
            const data = await res.json();
            // Filter only VETTORE and AUTONOLEGGIO types
            const filtered = (data || []).filter((f: any) =>
                f.tipoFornitore === "VETTORE" || f.tipoFornitore === "AUTONOLEGGIO"
            );
            setVettori(filtered);
        } catch (error) {
            console.error("Errore:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVettori();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Eliminare questo vettore?")) return;
        try {
            await fetch(`/api/fornitori/${id}`, { method: "DELETE" });
            loadVettori();
        } catch (error) {
            console.error("Errore:", error);
        }
    };

    const filteredVettori = vettori.filter(v =>
        v.ragioneSociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.nomeComune?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (v.citta?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8">
            <AnagraficheTabs />

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Bus className="h-6 w-6 text-blue-600" />
                        Anagrafiche Vettori
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Compagnie di autobus e autonoleggi
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    <Plus className="h-5 w-5" />
                    Nuovo Vettore
                </button>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Cerca vettore..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-12 text-gray-500">Caricamento...</div>
            ) : filteredVettori.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <Bus className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Nessun vettore trovato</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-3 text-sm text-blue-600 hover:underline"
                    >
                        Aggiungi il primo vettore
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredVettori.map((v) => (
                        <div
                            key={v.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-900">
                                        {v.ragioneSociale}
                                    </h3>
                                    {v.nomeComune && (
                                        <p className="text-sm text-gray-500">{v.nomeComune}</p>
                                    )}
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${v.tipoFornitore === "VETTORE"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-purple-100 text-purple-700"
                                    }`}>
                                    {v.tipoFornitore === "VETTORE" ? "Bus" : "Noleggio"}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                                {v.telefono && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <a href={`tel:${v.telefono}`} className="hover:text-blue-600">{v.telefono}</a>
                                    </div>
                                )}
                                {v.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <a href={`mailto:${v.email}`} className="hover:text-blue-600 truncate">{v.email}</a>
                                    </div>
                                )}
                                {v.citta && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span>{v.citta}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end gap-2">
                                <Link
                                    href={`/fornitori/${v.id}/edit`}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Link>
                                <button
                                    onClick={() => handleDelete(v.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <NuovoFornitoreModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                tipoPredefinito="VETTORE"
                onFornitoreCreato={(newVettore) => {
                    setVettori(prev => [...prev, newVettore]);
                    setShowModal(false);
                }}
            />
        </div>
    );
}
