"use client";

import { useState, useEffect } from "react";
import { FileText, Upload, Info, ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Invoice {
    id: string;
    number: string;
    date: string;
    type: "SENT" | "RECEIVED"; // SENT | RECEIVED
    totalAmount: number;
    customerName: string;
    customerVat: string | null;
    status: string; // PAID | UNPAID
    xmlFileName: string | null;
}

export default function FattureTab() {
    const [view, setView] = useState<"DASHBOARD" | "SENT" | "RECEIVED">("DASHBOARD");
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    // Fetch invoices on mount or view change
    useEffect(() => {
        if (view === "DASHBOARD") {
            // Fetch stats if needed, or just all latest
            fetchInvoices();
        } else {
            fetchInvoices(view); // Filter by type
        }
    }, [view]);

    const fetchInvoices = async (type?: "SENT" | "RECEIVED") => {
        setLoading(true);
        try {
            const url = type ? `/api/invoices?type=${type}` : '/api/invoices';
            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) {
                setInvoices(data);
            }
        } catch (error) {
            console.error("Error loading invoices:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImportXML = async () => {
        if (!confirm("Avvio scansione cartella FATTURE (Emesse/Ricevute)...")) return;

        setImporting(true);
        try {
            // 1. Scan
            const scanRes = await fetch('/api/invoices/import', {
                method: 'POST',
                body: JSON.stringify({ action: 'scan' })
            });
            const scanData = await scanRes.json();

            if (!scanData.success || scanData.count === 0) {
                alert(`Nessun file trovato. (Path scansionato: ${scanData.path})`);
                setImporting(false);
                return;
            }

            // 2. Import
            if (!confirm(`Trovati ${scanData.count} XML. Procedere all'importazione?`)) {
                setImporting(false);
                return;
            }

            const importRes = await fetch('/api/invoices/import', {
                method: 'POST',
                body: JSON.stringify({ action: 'import' })
            });
            const importData = await importRes.json();

            alert(`Importazione completata!\nImportati: ${importData.imported}\nErrori: ${importData.errors?.length || 0}`);
            fetchInvoices(view !== "DASHBOARD" ? view : undefined);

        } catch (error) {
            alert("Errore importazione");
            console.error(error);
        } finally {
            setImporting(false);
        }
    };

    // Render List View
    const renderInvoiceList = (title: string, type: "SENT" | "RECEIVED") => (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setView("DASHBOARD")}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Torna alla dashboard"
                >
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                    {invoices.length} documenti
                </span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Data</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">Numero</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-500">
                                {type === 'SENT' ? 'Cliente' : 'Fornitore'}
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-gray-500">Importo</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-500">Stato</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-500">File</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">Caricamento...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">Nessuna fattura trovata</td></tr>
                        ) : (
                            invoices.map(inv => (
                                <tr key={inv.id} className="hover:bg-gray-50 group cursor-default">
                                    <td className="px-4 py-3 text-gray-600">
                                        {format(new Date(inv.date), "dd/MM/yyyy")}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900">{inv.number}</td>
                                    <td className="px-4 py-3 text-gray-700">
                                        {inv.customerName}
                                        {inv.customerVat && <span className="text-xs text-gray-400 block">{inv.customerVat}</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                                        € {inv.totalAmount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${inv.status === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                            }`}>
                                            {inv.status === "PAID" ? "PAGATA" : "DA PAGARE"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="text-xs text-gray-400 truncate max-w-[100px]" title={inv.xmlFileName || ""}>
                                            {inv.xmlFileName || "-"}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (view === "SENT") return renderInvoiceList("Fatture Emesse", "SENT");
    if (view === "RECEIVED") return renderInvoiceList("Fatture Ricevute", "RECEIVED");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-purple-600" />
                        Cassetto Fiscale
                    </h2>
                    <p className="text-sm text-gray-500">
                        Gestione unificata fatture da Agenzia delle Entrate
                    </p>
                </div>
                <button
                    onClick={handleImportXML}
                    disabled={importing}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-all disabled:opacity-50"
                >
                    {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {importing ? "Importazione..." : "Sincronizza XML"}
                </button>
            </div>

            {/* AdE Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. Fatture Elettroniche */}
                <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4 border-b border-blue-50 bg-blue-50/50">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-blue-600" />
                            Fatture Elettroniche
                        </h4>
                    </div>
                    <div className="p-4 bg-white">
                        <ul className="space-y-2 text-sm">
                            <li
                                onClick={() => setView("SENT")}
                                className="flex items-center gap-2 text-blue-600 hover:underline cursor-pointer hover:bg-blue-50 p-1.5 rounded -mx-1.5 transition-colors"
                            >
                                <ArrowLeft className="h-3 w-3 rotate-180" />
                                Le tue fatture emesse
                            </li>
                            <li
                                onClick={() => setView("RECEIVED")}
                                className="flex items-center gap-2 text-blue-600 hover:underline cursor-pointer hover:bg-blue-50 p-1.5 rounded -mx-1.5 transition-colors"
                            >
                                <ArrowLeft className="h-3 w-3" />
                                Le tue fatture ricevute
                            </li>
                            <li className="text-gray-400 cursor-not-allowed">→ FE passive messe a disposizione</li>
                            <li className="text-gray-400 cursor-not-allowed">→ Pagamento imposta di bollo</li>
                        </ul>
                        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                            <span>Stato import:</span>
                            <span className="text-green-600 font-medium">Attivo</span>
                        </div>
                    </div>
                </div>

                {/* 2. Fatture Transfrontaliere */}
                <div className="bg-white rounded-xl shadow-sm border border-green-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4 border-b border-green-50 bg-green-50/50">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-green-600" />
                            Fatture Transfrontaliere
                        </h4>
                    </div>
                    <div className="p-4 bg-white">
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="hover:text-green-700 cursor-pointer">→ Fatture tax free</li>
                            <li className="hover:text-green-700 cursor-pointer">→ Fatture transfrontaliere emesse</li>
                            <li className="hover:text-green-700 cursor-pointer">→ Fatture transfrontaliere ricevute</li>
                        </ul>
                    </div>
                </div>

                {/* 3. Corrispettivi */}
                <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4 border-b border-orange-50 bg-orange-50/50">
                        <h4 className="font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-orange-600" />
                            Corrispettivi
                        </h4>
                    </div>
                    <div className="p-4 bg-white">
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="hover:text-orange-700 cursor-pointer">→ Invii/Aggregati giornalieri</li>
                            <li className="hover:text-orange-700 cursor-pointer">→ Dettaglio singolo invio</li>
                        </ul>
                    </div>
                </div>

            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase">Totale Emesso (Annuale)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        € {invoices.filter(i => i.type === 'SENT').reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase">Totale Ricevuto (Annuale)</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                        € {invoices.filter(i => i.type === 'RECEIVED').reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </p>
                </div>
            </div>

            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-100 flex items-start gap-3">
                <Info className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="text-sm text-purple-800">
                    <p className="font-medium">Sincronizzazione Cartelle</p>
                    <p className="mt-1 opacity-90">
                        Il sistema legge automaticamente i file dalle cartelle
                        <code className="mx-1 bg-white/50 px-1 rounded">FATTURE/FATTURE EMESSE</code> e
                        <code className="mx-1 bg-white/50 px-1 rounded">FATTURE/FATTURE RICEVUTE</code>.
                        Clicca "Sincronizza XML" per aggiornare il database con i nuovi file.
                    </p>
                </div>
            </div>
        </div>
    );
}
