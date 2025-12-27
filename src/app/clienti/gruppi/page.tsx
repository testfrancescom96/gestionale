"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Calendar, ChevronDown, ChevronRight, Download, Users } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Trip {
    id: string;
    destinazione: string;
    dataPartenza: string;
    tipo: string;
}

interface GroupCustomer {
    id: string; // Participant ID (of latest) or generated
    nome: string;
    cognome: string;
    email: string | null;
    telefono: string | null;
    viaggi: Trip[];
    totalTrips: number;
}

export default function GroupCustomersPage() {
    const [customers, setCustomers] = useState<GroupCustomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/clienti/gruppi');
            const data = await res.json();
            if (Array.isArray(data)) {
                setCustomers(data);
            }
        } catch (error) {
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRow = (id: string) => {
        const newSet = new Set(expandedRows);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedRows(newSet);
    };

    const filtered = customers.filter(c =>
        (c.nome + " " + c.cognome).toLowerCase().includes(search.toLowerCase())
    );

    const handleExport = () => {
        // Simple CSV Export
        const headers = ["Nome", "Cognome", "Totale Viaggi", "Ultimo Viaggio", "Data Ultimo"];
        const rows = filtered.map(c => {
            const lastTrip = c.viaggi[0]; // Assuming sorted by date descending in API? Need to check.
            // API sorted by created desc, so [0] is latest.
            return [
                c.nome,
                c.cognome,
                c.totalTrips,
                lastTrip?.destinazione || "",
                lastTrip?.dataPartenza ? format(new Date(lastTrip.dataPartenza), 'dd/MM/yyyy') : ""
            ].join(",");
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "clienti_gruppi.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Users className="h-8 w-8 text-blue-600" />
                        Clienti Viaggi di Gruppo
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Elenco partecipanti a viaggi di gruppo, tour e crociere
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                    <Download className="h-4 w-4" />
                    Esporta CSV
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex gap-4">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cerca nome o cognome..."
                            className="pl-9 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center text-sm text-gray-500 ml-auto">
                        {filtered.length} clienti trovati
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-3 w-10"></th>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3 text-center">Viaggi Totali</th>
                                <th className="px-6 py-3">Ultimo Viaggio</th>
                                <th className="px-6 py-3 text-right">Contatti</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Caricamento...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nessun cliente trovato</td></tr>
                            ) : (
                                filtered.map((customer, idx) => {
                                    // Generate a stable key since ID refers to latest participant entry
                                    const rowKey = customer.nome + customer.cognome + idx;
                                    const isExpanded = expandedRows.has(rowKey);
                                    const latestTrip = customer.viaggi[0];

                                    return (
                                        <>
                                            <tr
                                                key={rowKey}
                                                className={`hover:bg-gray-50 cursor-pointer transition-colors ${isExpanded ? "bg-blue-50/50" : ""}`}
                                                onClick={() => toggleRow(rowKey)}
                                            >
                                                <td className="px-6 py-4 text-gray-400">
                                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {customer.nome} {customer.cognome}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {customer.totalTrips}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {latestTrip ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{latestTrip.destinazione}</span>
                                                            <span className="text-xs text-gray-400">
                                                                {latestTrip.dataPartenza ? format(new Date(latestTrip.dataPartenza), 'MMM yyyy', { locale: it }) : "-"}
                                                            </span>
                                                        </div>
                                                    ) : "-"}
                                                </td>
                                                <td className="px-6 py-4 text-right text-gray-500">
                                                    {/* Contact placeholders - API currently returns null mostly unless linked */}
                                                    <div className="flex flex-col items-end gap-1">
                                                        {customer.email && <span className="text-xs">{customer.email}</span>}
                                                        {customer.telefono && <span className="text-xs">{customer.telefono}</span>}
                                                        {!customer.email && !customer.telefono && <span className="text-xs italic opacity-50">Nessun dettaglio</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr key={`${rowKey}-detail`} className="bg-gray-50/50">
                                                    <td colSpan={5} className="px-6 py-4 pl-16">
                                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Storico Viaggi</h4>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {customer.viaggi.map((trip) => (
                                                                <div key={trip.id} className="bg-white p-3 rounded border border-gray-200 shadow-sm flex items-start gap-3">
                                                                    <MapPin className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                                                                    <div>
                                                                        <div className="font-medium text-sm text-gray-900">{trip.destinazione}</div>
                                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                                            <Calendar className="h-3 w-3" />
                                                                            {trip.dataPartenza ? format(new Date(trip.dataPartenza), 'dd MMM yyyy', { locale: it }) : "Data N/A"}
                                                                        </div>
                                                                        <div className="text-xs text-gray-400 mt-1 uppercase text-[10px] border px-1 rounded w-fit">
                                                                            {trip.tipo}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
