"use client";

import { useState } from "react";
import {
    Wallet,
    Upload,
    Download,
    FileSpreadsheet,
    CreditCard,
    ArrowUpCircle,
    ArrowDownCircle,
    Filter,
    RefreshCw,
    Plus
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Transazione {
    id: string;
    data: string;
    descrizione: string;
    importo: number;
    tipo: "ENTRATA" | "USCITA";
    categoria: string;
    banca: string;
    riferimento?: string;
}

export default function ContabilitaPage() {
    const [transazioni, setTransazioni] = useState<Transazione[]>([]);
    const [loading, setLoading] = useState(false);
    const [filterBanca, setFilterBanca] = useState("TUTTE");
    const [filterTipo, setFilterTipo] = useState("TUTTI");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    // Form transazione manuale
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualForm, setManualForm] = useState({
        data: format(new Date(), 'yyyy-MM-dd'),
        descrizione: "",
        importo: "",
        tipo: "USCITA" as "ENTRATA" | "USCITA",
        banca: "MANUALE"
    });

    const banche = ["TUTTE", "DEUTSCHE", "HYPE", "PAYPAL", "REVOLUT", "VIVA", "MANUALE"];

    // Calcola totali
    const totaleEntrate = transazioni
        .filter(t => t.tipo === "ENTRATA")
        .reduce((sum, t) => sum + t.importo, 0);
    const totaleUscite = transazioni
        .filter(t => t.tipo === "USCITA")
        .reduce((sum, t) => sum + t.importo, 0);
    const saldo = totaleEntrate - totaleUscite;

    // Parse Revolut CSV (comma-separated, columns: Type,Product,Started Date,Completed Date,Description,Amount,Fee,Currency,State,Balance)
    const parseRevolutCsv = (text: string, banca: string): Transazione[] => {
        const lines = text.split('\n');
        const transactions: Transazione[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Revolut uses comma as separator
            const parts = line.split(',');
            if (parts.length < 6) continue;

            const dateStr = parts[2]; // Started Date
            const descrizione = parts[4] || 'Transazione Revolut';
            const amount = parseFloat(parts[5]?.replace(/[^\d.-]/g, '')) || 0;

            if (amount === 0) continue;

            transactions.push({
                id: `${banca}-${i}-${Date.now()}`,
                data: dateStr.split(' ')[0] || dateStr, // Take date only
                descrizione: descrizione.substring(0, 200),
                importo: Math.abs(amount),
                tipo: amount > 0 ? "ENTRATA" : "USCITA",
                categoria: "Da Categorizzare",
                banca
            });
        }
        return transactions;
    };

    // Parse Deutsche Bank CSV (semicolon-separated)
    const parseDeutscheCsv = (text: string, banca: string): Transazione[] => {
        const lines = text.split('\n');
        const transactions: Transazione[] = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(';');
            if (parts.length < 5) continue;

            const data = parts[0];
            const dare = parseFloat(parts[2]?.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
            const avere = parseFloat(parts[3]?.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
            const operazione = parts[5] || '';
            const dettagli = parts[6] || '';

            if (dare === 0 && avere === 0) continue;

            transactions.push({
                id: `${banca}-${i}-${Date.now()}`,
                data,
                descrizione: `${operazione} - ${dettagli}`.substring(0, 200),
                importo: avere > 0 ? avere : dare,
                tipo: avere > 0 ? "ENTRATA" : "USCITA",
                categoria: "Da Categorizzare",
                banca,
                riferimento: dettagli.match(/Causale:\s*([^\n]+)/)?.[1] || ''
            });
        }
        return transactions;
    };

    // Generic CSV parser
    const parseGenericCsv = (text: string, banca: string): Transazione[] => {
        const lines = text.split('\n');
        const transactions: Transazione[] = [];

        // Detect separator
        const firstLine = lines[0] || '';
        const separator = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(separator);
            if (parts.length < 2) continue;

            // Try to find date and amount
            let data = '';
            let importo = 0;
            let descrizione = '';

            for (const part of parts) {
                const cleanPart = part.replace(/"/g, '').trim();
                // Date detection
                if (!data && cleanPart.match(/\d{2}[\/-]\d{2}[\/-]\d{2,4}/)) {
                    data = cleanPart;
                }
                // Amount detection
                if (importo === 0) {
                    const num = parseFloat(cleanPart.replace(/[^\d,.-]/g, '').replace(',', '.'));
                    if (!isNaN(num) && num !== 0) {
                        importo = num;
                    }
                }
                // Description (longest text)
                if (cleanPart.length > descrizione.length && !cleanPart.match(/^[\d,.\-€]+$/)) {
                    descrizione = cleanPart;
                }
            }

            if (!data || importo === 0) continue;

            transactions.push({
                id: `${banca}-${i}-${Date.now()}`,
                data,
                descrizione: descrizione.substring(0, 200) || 'Transazione',
                importo: Math.abs(importo),
                tipo: importo > 0 ? "ENTRATA" : "USCITA",
                categoria: "Da Categorizzare",
                banca
            });
        }
        return transactions;
    };

    // Import CSV/XLS
    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>, banca: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                let newTransazioni: Transazione[] = [];

                // Use appropriate parser based on bank
                if (banca === 'REVOLUT') {
                    newTransazioni = parseRevolutCsv(text, banca);
                } else if (banca === 'DEUTSCHE') {
                    newTransazioni = parseDeutscheCsv(text, banca);
                } else {
                    // Generic parser for other banks
                    newTransazioni = parseGenericCsv(text, banca);
                }

                setTransazioni(prev => [...prev, ...newTransazioni]);
                alert(`Importate ${newTransazioni.length} transazioni da ${banca}`);
            } catch (error) {
                console.error("Errore parsing file:", error);
                alert("Errore durante l'importazione del file");
            } finally {
                setLoading(false);
            }
        };

        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    // Add manual transaction
    const handleAddManual = () => {
        if (!manualForm.descrizione || !manualForm.importo) {
            alert("Compila descrizione e importo");
            return;
        }

        const newTrans: Transazione = {
            id: `MANUALE-${Date.now()}`,
            data: manualForm.data,
            descrizione: manualForm.descrizione,
            importo: parseFloat(manualForm.importo) || 0,
            tipo: manualForm.tipo,
            categoria: "Manuale",
            banca: manualForm.banca
        };

        setTransazioni(prev => [...prev, newTrans]);
        setManualForm({
            data: format(new Date(), 'yyyy-MM-dd'),
            descrizione: "",
            importo: "",
            tipo: "USCITA",
            banca: "MANUALE"
        });
        setShowManualForm(false);
    };

    // Export Prima Nota
    const exportPrimaNota = () => {
        const filtered = getFilteredTransazioni();
        const header = "Data;Nome e cognome / Azienda;Oggetto dell'operazione;Entrate Banca;Uscita banca;Tipologia pagamento;Scontrino/fattura;Rapportino/ticket/ricevuta non fiscale;Note\n";

        const rows = filtered.map(t => {
            const entrata = t.tipo === "ENTRATA" ? `€ ${t.importo.toFixed(2)}` : "";
            const uscita = t.tipo === "USCITA" ? `€ ${t.importo.toFixed(2)}` : "";
            return `${t.data};;${t.descrizione};${entrata};${uscita};${t.banca};;;${t.riferimento || ""}`;
        }).join("\n");

        const csv = header + rows;
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Prima_Nota_${format(new Date(), "yyyy-MM")}.csv`;
        link.click();
    };

    // Export Fatturazione
    const exportFatturazione = () => {
        const filtered = getFilteredTransazioni().filter(t => t.tipo === "USCITA");
        const header = "Data;cognome / Azienda;Oggetto dell'operazione;Entrate;Scontrino / fattura / rapportino\n";

        const rows = filtered.map(t =>
            `${t.data};;${t.descrizione};€ ${t.importo.toFixed(2)};`
        ).join("\n");

        const csv = header + rows;
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Fatturazione_${format(new Date(), "yyyy-MM")}.csv`;
        link.click();
    };

    const getFilteredTransazioni = () => {
        return transazioni.filter(t => {
            if (filterBanca !== "TUTTE" && t.banca !== filterBanca) return false;
            if (filterTipo !== "TUTTI" && t.tipo !== filterTipo) return false;
            return true;
        });
    };

    const filteredTransazioni = getFilteredTransazioni();

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Wallet className="h-8 w-8 text-blue-600" />
                        Contabilità
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Import estratti conto e genera Prima Nota per il commercialista
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                            <ArrowUpCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Entrate</p>
                            <p className="text-xl font-bold text-green-600">€ {totaleEntrate.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-full">
                            <ArrowDownCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Uscite</p>
                            <p className="text-xl font-bold text-red-600">€ {totaleUscite.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${saldo >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            <CreditCard className={`h-5 w-5 ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Saldo Netto</p>
                            <p className={`text-xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                € {saldo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                            <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Movimenti</p>
                            <p className="text-xl font-bold text-blue-600">{transazioni.length}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Row */}
            <div className="flex flex-wrap gap-4 mb-6">
                {/* Import Buttons */}
                <div className="flex gap-2 flex-wrap">
                    {banche.filter(b => b !== "TUTTE" && b !== "MANUALE").map(banca => (
                        <label key={banca} className="cursor-pointer">
                            <input
                                type="file"
                                accept=".csv,.xls,.xlsx"
                                className="hidden"
                                onChange={(e) => handleImportCSV(e, banca)}
                            />
                            <span className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                <Upload className="h-4 w-4" />
                                {banca}
                            </span>
                        </label>
                    ))}

                    {/* Manual Transaction Button */}
                    <button
                        onClick={() => setShowManualForm(!showManualForm)}
                        className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Manuale
                    </button>
                </div>

                <div className="flex-1" />

                {/* Export Buttons */}
                <button
                    onClick={exportPrimaNota}
                    disabled={transazioni.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="h-4 w-4" />
                    Esporta Prima Nota
                </button>
                <button
                    onClick={exportFatturazione}
                    disabled={transazioni.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download className="h-4 w-4" />
                    Esporta Fatturazione
                </button>
            </div>

            {/* Manual Transaction Form */}
            {showManualForm && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-purple-800 mb-3">Aggiungi Transazione Manuale</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        <input
                            type="date"
                            value={manualForm.data}
                            onChange={(e) => setManualForm({ ...manualForm, data: e.target.value })}
                            className="border rounded-lg px-3 py-2 text-sm"
                        />
                        <input
                            type="text"
                            placeholder="Descrizione *"
                            value={manualForm.descrizione}
                            onChange={(e) => setManualForm({ ...manualForm, descrizione: e.target.value })}
                            className="md:col-span-2 border rounded-lg px-3 py-2 text-sm"
                        />
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Importo € *"
                            value={manualForm.importo}
                            onChange={(e) => setManualForm({ ...manualForm, importo: e.target.value })}
                            className="border rounded-lg px-3 py-2 text-sm"
                        />
                        <select
                            value={manualForm.tipo}
                            onChange={(e) => setManualForm({ ...manualForm, tipo: e.target.value as "ENTRATA" | "USCITA" })}
                            className="border rounded-lg px-3 py-2 text-sm"
                        >
                            <option value="USCITA">Uscita</option>
                            <option value="ENTRATA">Entrata</option>
                        </select>
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                        <button
                            onClick={() => setShowManualForm(false)}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleAddManual}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                        >
                            Aggiungi
                        </button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-4 mb-4 items-center">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                        value={filterBanca}
                        onChange={(e) => setFilterBanca(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                        {banche.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                    <option value="TUTTI">Tutti i movimenti</option>
                    <option value="ENTRATA">Solo Entrate</option>
                    <option value="USCITA">Solo Uscite</option>
                </select>
                <button
                    onClick={() => setTransazioni([])}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600"
                >
                    <RefreshCw className="h-4 w-4" />
                    Reset
                </button>
            </div>

            {/* Transazioni Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {filteredTransazioni.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-lg font-medium">Nessuna transazione</p>
                        <p className="text-sm mt-2">Importa un estratto conto CSV per iniziare</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Banca</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrizione</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Importo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTransazioni.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-gray-600">{t.data}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">{t.banca}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 max-w-md truncate" title={t.descrizione}>
                                        {t.descrizione}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-medium ${t.tipo === 'ENTRATA' ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.tipo === 'ENTRATA' ? '+' : '-'} € {t.importo.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
