"use client";

import { useState, useEffect } from "react";
import {
    Bus,
    Plus,
    Euro,
    Calendar,
    Check,
    X,
    Edit2,
    Trash2,
    FileText,
    Filter,
    Download
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { NuovoFornitoreModal } from "@/components/fornitori/NuovoFornitoreModal";

interface Noleggio {
    id: string;
    dataPartenza: string;
    dataRientro?: string;
    evento: string;
    nomeVettore?: string;
    fornitore?: { ragioneSociale: string; nomeComune?: string };
    capienzaBus?: number;
    numAutisti: number;
    costoNoleggio: number;
    costoZTL: number;
    costoExtra: number;
    numeroFattura?: string;
    fatturaRicevuta: boolean;
    pagato: boolean;
    dataPagamento?: string;
    note?: string;
    // Bus details (optional)
    hasBagno?: boolean;
    hasPrese?: boolean;
    targaBus?: string;
    noteBus?: string;
}

interface Stats {
    totaleNoleggi: number;
    totaleNoleggio: number;
    totaleZTL: number;
    totalePagato: number;
    daPagare: number;
}

export default function VettoriPage() {
    const [noleggi, setNoleggi] = useState<Noleggio[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [fornitori, setFornitori] = useState<any[]>([]);
    const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
    const [filterVettore, setFilterVettore] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [showFornitoreModal, setShowFornitoreModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        dataPartenza: "",
        dataRientro: "",
        evento: "",
        fornitoreId: "",
        nomeVettore: "",
        capienzaBus: "",
        hasBagno: false,
        hasPrese: false,
        targaBus: "",
        noteBus: "",
        numAutisti: "1",
        costoNoleggio: "",
        costoZTL: "",
        numeroFattura: "",
        pagato: false,
        dataPagamento: "",
        note: ""
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterYear) params.set("year", filterYear);
            if (filterVettore) params.set("fornitoreId", filterVettore);

            const [noleggiRes, fornitoriRes] = await Promise.all([
                fetch(`/api/noleggi-vettori?${params.toString()}`),
                fetch("/api/fornitori")
            ]);

            const noleggiData = await noleggiRes.json();
            const fornitoriData = await fornitoriRes.json();

            setNoleggi(noleggiData.noleggi || []);
            setStats(noleggiData.stats || null);
            setFornitori(fornitoriData || []);
        } catch (error) {
            console.error("Errore:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filterYear, filterVettore]);

    const resetForm = () => {
        setFormData({
            dataPartenza: "",
            dataRientro: "",
            evento: "",
            fornitoreId: "",
            nomeVettore: "",
            capienzaBus: "",
            hasBagno: false,
            hasPrese: false,
            targaBus: "",
            noteBus: "",
            numAutisti: "1",
            costoNoleggio: "",
            costoZTL: "",
            numeroFattura: "",
            pagato: false,
            dataPagamento: "",
            note: ""
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId ? `/api/noleggi-vettori/${editingId}` : "/api/noleggi-vettori";
            const method = editingId ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                resetForm();
                loadData();
            } else {
                const data = await res.json();
                alert(data.error || "Errore");
            }
        } catch (error) {
            console.error("Errore:", error);
        }
    };

    const handleEdit = (n: Noleggio) => {
        setFormData({
            dataPartenza: n.dataPartenza ? n.dataPartenza.split("T")[0] : "",
            dataRientro: n.dataRientro ? n.dataRientro.split("T")[0] : "",
            evento: n.evento,
            fornitoreId: n.fornitore ? "" : "", // Would need to store fornitoreId
            nomeVettore: n.nomeVettore || n.fornitore?.ragioneSociale || "",
            capienzaBus: n.capienzaBus?.toString() || "",
            hasBagno: (n as any).hasBagno || false,
            hasPrese: (n as any).hasPrese || false,
            targaBus: (n as any).targaBus || "",
            noteBus: (n as any).noteBus || "",
            numAutisti: n.numAutisti.toString(),
            costoNoleggio: n.costoNoleggio.toString(),
            costoZTL: n.costoZTL.toString(),
            numeroFattura: n.numeroFattura || "",
            pagato: n.pagato,
            dataPagamento: n.dataPagamento ? n.dataPagamento.split("T")[0] : "",
            note: n.note || ""
        });
        setEditingId(n.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Eliminare questo noleggio?")) return;
        try {
            await fetch(`/api/noleggi-vettori/${id}`, { method: "DELETE" });
            loadData();
        } catch (error) {
            console.error("Errore:", error);
        }
    };

    const togglePagato = async (n: Noleggio) => {
        try {
            await fetch(`/api/noleggi-vettori/${n.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...n,
                    pagato: !n.pagato,
                    dataPagamento: !n.pagato ? new Date().toISOString() : null
                })
            });
            loadData();
        } catch (error) {
            console.error("Errore:", error);
        }
    };

    const exportCSV = () => {
        const header = "Data;Rientro;Evento;Vettore;Costo Noleggio;ZTL;Totale;N° Fattura;Pagato;Data Pagamento;Note\n";
        const rows = noleggi.map(n => {
            const totale = (n.costoNoleggio || 0) + (n.costoZTL || 0);
            return `${format(new Date(n.dataPartenza), "dd/MM/yyyy")};${n.dataRientro ? format(new Date(n.dataRientro), "dd/MM/yyyy") : ""};${n.evento};${n.nomeVettore || n.fornitore?.ragioneSociale || ""};€ ${n.costoNoleggio};€ ${n.costoZTL};€ ${totale};${n.numeroFattura || ""};${n.pagato ? "SI" : "NO"};${n.dataPagamento ? format(new Date(n.dataPagamento), "dd/MM/yyyy") : ""};${n.note || ""}`;
        }).join("\n");

        const csv = header + rows;
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Noleggi_Vettori_${filterYear}.csv`;
        link.click();
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Bus className="h-8 w-8 text-blue-600" />
                        Gestione Vettori
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Noleggi bus, fatture e pagamenti
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                    <Plus className="h-5 w-5" />
                    Nuovo Noleggio
                </button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <p className="text-sm text-gray-500">Viaggi</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totaleNoleggi}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <p className="text-sm text-gray-500">Totale Noleggi</p>
                        <p className="text-2xl font-bold text-blue-600">€ {stats.totaleNoleggio.toLocaleString('it-IT')}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <p className="text-sm text-gray-500">Totale ZTL</p>
                        <p className="text-2xl font-bold text-gray-600">€ {stats.totaleZTL.toLocaleString('it-IT')}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <p className="text-sm text-gray-500">Pagato</p>
                        <p className="text-2xl font-bold text-green-600">€ {stats.totalePagato.toLocaleString('it-IT')}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <p className="text-sm text-gray-500">Da Pagare</p>
                        <p className="text-2xl font-bold text-red-600">€ {stats.daPagare.toLocaleString('it-IT')}</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-4 mb-6 items-center">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                        value={filterYear}
                        onChange={(e) => setFilterYear(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <select
                    value={filterVettore}
                    onChange={(e) => setFilterVettore(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="">Tutti i vettori</option>
                    {fornitori.filter(f => f.tipoFornitore === "VETTORE" || f.tipoFornitore === "AUTONOLEGGIO").map(f => (
                        <option key={f.id} value={f.id}>{f.ragioneSociale}</option>
                    ))}
                </select>
                <div className="flex-1" />
                <button
                    onClick={exportCSV}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                    <Download className="h-4 w-4" />
                    Esporta CSV
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                    <h3 className="font-semibold mb-4">{editingId ? "Modifica Noleggio" : "Nuovo Noleggio"}</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="date"
                            value={formData.dataPartenza}
                            onChange={(e) => setFormData({ ...formData, dataPartenza: e.target.value })}
                            className="border rounded-lg px-3 py-2 text-sm"
                            placeholder="Data Partenza"
                            required
                        />
                        <input
                            type="date"
                            value={formData.dataRientro}
                            onChange={(e) => setFormData({ ...formData, dataRientro: e.target.value })}
                            className="border rounded-lg px-3 py-2 text-sm"
                            placeholder="Data Rientro"
                        />
                        <input
                            type="text"
                            value={formData.evento}
                            onChange={(e) => setFormData({ ...formData, evento: e.target.value })}
                            className="border rounded-lg px-3 py-2 text-sm md:col-span-2"
                            placeholder="Evento / Destinazione"
                            required
                        />

                        <div className="flex gap-2">
                            <select
                                value={formData.fornitoreId}
                                onChange={(e) => {
                                    const selected = fornitori.find(f => f.id === e.target.value);
                                    setFormData({
                                        ...formData,
                                        fornitoreId: e.target.value,
                                        nomeVettore: selected ? selected.ragioneSociale : formData.nomeVettore
                                    });
                                }}
                                className="border rounded-lg px-3 py-2 text-sm flex-1"
                            >
                                <option value="">Seleziona Vettore...</option>
                                {fornitori.filter(f => f.tipoFornitore === "VETTORE" || f.tipoFornitore === "AUTONOLEGGIO").map(f => (
                                    <option key={f.id} value={f.id}>{f.ragioneSociale}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setShowFornitoreModal(true)}
                                className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                                title="Nuovo Vettore (Anagrafica)"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        <input
                            type="text"
                            value={formData.nomeVettore}
                            onChange={(e) => setFormData({ ...formData, nomeVettore: e.target.value })}
                            className="border rounded-lg px-3 py-2 text-sm"
                            placeholder="Nome Vettore (Manuale)"
                        />

                        <input
                            type="number"
                            value={formData.capienzaBus}
                            onChange={(e) => setFormData({ ...formData, capienzaBus: e.target.value })}
                            className="border rounded-lg px-3 py-2 text-sm"
                            placeholder="Capienza Bus"
                        />

                        <div className="flex flex-col gap-2 border p-2 rounded-lg bg-gray-50">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={formData.hasBagno}
                                    onChange={(e) => setFormData({ ...formData, hasBagno: e.target.checked })}
                                    className="rounded"
                                />
                                Bagno 🚻
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={formData.hasPrese}
                                    onChange={(e) => setFormData({ ...formData, hasPrese: e.target.checked })}
                                    className="rounded"
                                />
                                Prese USB 🔌
                            </label>
                        </div>

                        <input
                            type="text"
                            value={formData.targaBus}
                            onChange={(e) => setFormData({ ...formData, targaBus: e.target.value })}
                            className="border rounded-lg px-3 py-2 text-sm"
                            placeholder="Targa Bus"
                        />
                        <input
                            type="text"
                            value={formData.noteBus}
                            onChange={(e) => setFormData({ ...formData, noteBus: e.target.value })}
                            className="border rounded-lg px-3 py-2 text-sm"
                            placeholder="Note Bus"
                        />

                        <input
                            type="number"
                            value={formData.costoNoleggio}
                            onChange={(e) => setFormData({ ...formData, costoNoleggio: e.target.value })}
                            className="border rounded-lg px-3 py-2 text-sm"
                            placeholder="Costo Noleggio €"
                        />
                        <input
                            type="number"
                            value={formData.costoZTL}
                            onChange={(e) => setFormData({ ...formData, costoZTL: e.target.value })}
                            className="border rounded-lg px-3 py-2 text-sm"
                            placeholder="Costo ZTL/Park €"
                        />
                        <input
                            type="text"
                            value={formData.numeroFattura}
                            onChange={(e) => setFormData({ ...formData, numeroFattura: e.target.value })}
                            className="border rounded-lg px-3 py-2 text-sm"
                            placeholder="N° Fattura"
                        />
                        <div className="flex items-center gap-4 md:col-span-2">
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={formData.pagato}
                                    onChange={(e) => setFormData({ ...formData, pagato: e.target.checked })}
                                    className="rounded"
                                />
                                Pagato
                            </label>
                            {formData.pagato && (
                                <input
                                    type="date"
                                    value={formData.dataPagamento}
                                    onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
                                    className="border rounded-lg px-3 py-2 text-sm"
                                    placeholder="Data Pagamento"
                                />
                            )}
                        </div>
                        <input
                            type="text"
                            value={formData.note}
                            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                            className="border rounded-lg px-3 py-2 text-sm md:col-span-2"
                            placeholder="Note Noleggio"
                        />
                        <div className="flex gap-2 md:col-span-4">
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                            >
                                {editingId ? "Salva Modifiche" : "Aggiungi"}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-100"
                            >
                                Annulla
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evento</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vettore</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bus</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Noleggio</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ZTL</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fattura</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pagato</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Caricamento...</td></tr>
                        ) : noleggi.length === 0 ? (
                            <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Nessun noleggio trovato</td></tr>
                        ) : (
                            noleggi.map(n => (
                                <tr key={n.id} className={`hover:bg-gray-50 ${n.pagato ? 'bg-green-50/30' : ''}`}>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{format(new Date(n.dataPartenza), "dd/MM/yy")}</div>
                                        {n.dataRientro && (
                                            <div className="text-xs text-gray-400">→ {format(new Date(n.dataRientro), "dd/MM/yy")}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate" title={n.evento}>
                                        {n.evento}
                                    </td>
                                    <td className="px-4 py-3 text-gray-600">
                                        {n.nomeVettore || n.fornitore?.ragioneSociale || "-"}
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs">
                                        {(n as any).capienzaBus ? `${(n as any).capienzaBus} pax` : ''}
                                        {(n as any).hasBagno && ' 🚻'}
                                        {(n as any).hasPrese && ' 🔌'}
                                        {(n as any).targaBus ? ` - ${(n as any).targaBus}` : ''}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium">€ {n.costoNoleggio.toLocaleString('it-IT')}</td>
                                    <td className="px-4 py-3 text-right text-gray-600">€ {n.costoZTL.toLocaleString('it-IT')}</td>
                                    <td className="px-4 py-3 text-center">
                                        {n.numeroFattura ? (
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{n.numeroFattura}</span>
                                        ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => togglePagato(n)}
                                            className={`p-1.5 rounded-full ${n.pagato ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                                        >
                                            {n.pagato ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex gap-1 justify-end">
                                            <button onClick={() => handleEdit(n)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => handleDelete(n.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <NuovoFornitoreModal
                isOpen={showFornitoreModal}
                onClose={() => setShowFornitoreModal(false)}
                tipoPredefinito="VETTORE"
                onFornitoreCreato={(newFornitore) => {
                    setFornitori(prev => [...prev, newFornitore]);
                    // Auto-select
                    setFormData(prev => ({
                        ...prev,
                        fornitoreId: newFornitore.id,
                        nomeVettore: newFornitore.ragioneSociale
                    }));
                }}
            />
        </div>
    );
}
