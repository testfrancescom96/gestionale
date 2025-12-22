"use client";

import { useState } from "react";
import { FileText, Upload, FolderOpen, Info, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";

interface Fattura {
    id: string;
    numero: string;
    data: string;
    tipo: "ATTIVA" | "PASSIVA";
    fornitore: string;
    partitaIva: string;
    imponibile: number;
    iva: number;
    totale: number;
    stato: "PAGATA" | "DA_PAGARE" | "IN_SCADENZA";
    source: "XML_UPLOAD" | "MANUALE";
}

export default function FattureTab() {
    const [fatture, setFatture] = useState<Fattura[]>([]);
    const [showAdEInfo, setShowAdEInfo] = useState(true);

    // Placeholder per futuro upload
    const handleUploadXML = () => {
        alert("Funzionalità upload in sviluppo. Per ora consulta le sezioni AdE sotto.");
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-purple-600" />
                        Gestione Fatture
                    </h2>
                    <p className="text-sm text-gray-500">
                        Fatture elettroniche da Agenzia delle Entrate
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleUploadXML}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                    >
                        <Upload className="h-4 w-4" />
                        Carica XML
                    </button>
                    <button
                        onClick={() => setShowAdEInfo(!showAdEInfo)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    >
                        <Info className="h-4 w-4" />
                        {showAdEInfo ? "Nascondi" : "Mostra"} Info AdE
                    </button>
                </div>
            </div>

            {/* Info Panel - Sezioni Agenzia delle Entrate */}
            {showAdEInfo && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                        <ExternalLink className="h-5 w-5" />
                        Sezioni Agenzia delle Entrate - Fatture e Corrispettivi
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Fatture Elettroniche */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                Fatture Elettroniche
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>→ Le tue fatture emesse</li>
                                <li>→ Le tue fatture ricevute</li>
                                <li>→ FE passive messe a disposizione</li>
                                <li>→ Pagamento imposta di bollo</li>
                                <li>→ Ricerca per SDI/file</li>
                                <li className="text-blue-600 font-medium mt-2">📥 Download massivi disponibile</li>
                            </ul>
                        </div>

                        {/* Dati Fatture Transfrontaliere */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-green-600" />
                                Fatture Transfrontaliere
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>→ Fatture tax free</li>
                                <li>→ Fatture transfrontaliere emesse</li>
                                <li>→ Fatture transfrontaliere ricevute</li>
                                <li>→ Ricerca per SDI/file o Cr/fo</li>
                            </ul>
                        </div>

                        {/* Corrispettivi */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-orange-600" />
                                Corrispettivi
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>→ Invii/Aggregati giornalieri</li>
                                <li>→ Dettaglio singolo invio</li>
                            </ul>
                        </div>

                        {/* Spesometro */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100 opacity-60">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                Spesometro
                            </h4>
                            <ul className="text-sm text-gray-500 space-y-1">
                                <li>📅 Operazioni 2017-2018 (storico)</li>
                            </ul>
                        </div>

                        {/* Comunicazioni */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
                            <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                Comunicazioni
                            </h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>→ Omessa/irregolare fatturazione</li>
                                <li>→ Liquidazioni periodiche IVA</li>
                                <li>→ Lettere di compliance</li>
                                <li>→ Comunicazioni di irregolarità</li>
                            </ul>
                        </div>

                        {/* Workflow suggerito */}
                        <div className="bg-purple-50 rounded-lg p-4 shadow-sm border border-purple-200">
                            <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Workflow Consigliato
                            </h4>
                            <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
                                <li>Scarica XML da "Fatture ricevute"</li>
                                <li>Organizza in cartelle per mese</li>
                                <li>Carica qui con "Carica XML"</li>
                                <li>Sistema parsa automaticamente</li>
                            </ol>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <strong>💡 Nota:</strong> Il download massivo su AdE è ancora in beta.
                            Per ora scarica le fatture singolarmente dalla sezione "Le tue fatture ricevute"
                            e caricale qui come file XML.
                        </p>
                    </div>
                </div>
            )}

            {/* Stats placeholder */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <p className="text-sm text-gray-500">Fatture Ricevute</p>
                    <p className="text-2xl font-bold text-blue-600">{fatture.filter(f => f.tipo === "PASSIVA").length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <p className="text-sm text-gray-500">Fatture Emesse</p>
                    <p className="text-2xl font-bold text-green-600">{fatture.filter(f => f.tipo === "ATTIVA").length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <p className="text-sm text-gray-500">Da Pagare</p>
                    <p className="text-2xl font-bold text-red-600">{fatture.filter(f => f.stato === "DA_PAGARE").length}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border">
                    <p className="text-sm text-gray-500">Pagate</p>
                    <p className="text-2xl font-bold text-gray-600">{fatture.filter(f => f.stato === "PAGATA").length}</p>
                </div>
            </div>

            {/* Empty state / Table */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {fatture.length === 0 ? (
                    <div className="p-12 text-center">
                        <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Nessuna fattura caricata</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Scarica le fatture XML dall'Agenzia delle Entrate e caricale qui
                        </p>
                        <button
                            onClick={handleUploadXML}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                        >
                            <Upload className="h-4 w-4" />
                            Carica i tuoi primi XML
                        </button>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Numero</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornitore</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">P.IVA</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Totale</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Stato</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {fatture.map(f => (
                                <tr key={f.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{f.numero}</td>
                                    <td className="px-4 py-3 text-gray-600">{f.data}</td>
                                    <td className="px-4 py-3 text-gray-900">{f.fornitore}</td>
                                    <td className="px-4 py-3 text-gray-500">{f.partitaIva}</td>
                                    <td className="px-4 py-3 text-right font-medium">€ {f.totale.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${f.stato === "PAGATA" ? "bg-green-100 text-green-700" :
                                                f.stato === "DA_PAGARE" ? "bg-red-100 text-red-700" :
                                                    "bg-yellow-100 text-yellow-700"
                                            }`}>
                                            {f.stato.replace("_", " ")}
                                        </span>
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
