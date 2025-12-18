"use client";
import { Edit2, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { DeleteFornitoreButton } from "./DeleteFornitoreButton";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Fornitore {
    id: string;
    ragioneSociale: string;
    partitaIVA: string | null;
    codiceFiscale: string | null;
    email: string | null;
    telefono: string | null;
    indirizzo: string | null;
    citta: string | null;
    createdAt: Date;
    _count: {
        pratiche: number;
    }
}

interface FornitoriTableProps {
    fornitori: Fornitore[];
}

export function FornitoriTable({ fornitori }: FornitoriTableProps) {
    const [filterIncomplete, setFilterIncomplete] = useState(false);

    const isComplete = (f: Fornitore) => {
        // Consideriamo completo se ha P.IVA/CF E Indirizzo/Città
        const hasFiscal = f.partitaIVA || f.codiceFiscale;
        const hasAddress = f.indirizzo && f.citta;
        return hasFiscal && hasAddress;
    };

    const filteredFornitori = filterIncomplete
        ? fornitori.filter(f => !isComplete(f))
        : fornitori;

    const incompleteCount = fornitori.filter(f => !isComplete(f)).length;

    return (
        <div className="space-y-4">
            {/* Filter Toggle */}
            <div className="flex items-center justify-between bg-white px-4 py-2 border rounded-lg shadow-sm">
                <div className="text-sm text-gray-600">
                    Totale Fornitori: <strong>{fornitori.length}</strong>
                </div>
                <button
                    onClick={() => setFilterIncomplete(!filterIncomplete)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filterIncomplete
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                >
                    <AlertTriangle className={`h-4 w-4 ${incompleteCount > 0 ? "text-red-500" : "text-gray-400"}`} />
                    {filterIncomplete ? "Mostra Tutti" : `Mostra Incompleti (${incompleteCount})`}
                </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm text-gray-500">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                        <tr>
                            <th className="px-6 py-3">Ragione Sociale</th>
                            <th className="px-6 py-3">P.IVA / CF</th>
                            <th className="px-6 py-3">Contatti</th>
                            <th className="px-6 py-3">Stato Dati</th>
                            <th className="px-6 py-3">Creato il</th>
                            <th className="px-6 py-3 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                        {filteredFornitori.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    Nessun fornitore trovato.
                                </td>
                            </tr>
                        ) : (
                            filteredFornitori.map((f) => {
                                const complete = isComplete(f);
                                return (
                                    <tr key={f.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <Link href={`/fornitori/${f.id}`} className="hover:text-blue-600 hover:underline">
                                                {f.ragioneSociale}
                                            </Link>
                                            {f._count.pratiche > 0 && (
                                                <span className="ml-2 text-xs text-gray-400">
                                                    ({f._count.pratiche} pratiche)
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span>{f.partitaIVA || "—"}</span>
                                                <span className="text-xs text-gray-400">{f.codiceFiscale}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5 text-xs">
                                                {f.email && <span>📧 {f.email}</span>}
                                                {f.telefono && <span>📞 {f.telefono}</span>}
                                                {!f.email && !f.telefono && <span className="text-gray-400">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {complete ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                                                    <CheckCircle2 className="h-3 w-3" /> Completo
                                                </span>
                                            ) : (
                                                <div className="flex flex-col gap-1">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                                                        <AlertTriangle className="h-3 w-3" /> Incompleto
                                                    </span>
                                                    <span className="text-[10px] text-red-500">
                                                        {!f.partitaIVA && !f.codiceFiscale ? "Manca P.IVA/CF" : ""}
                                                        {(!f.partitaIVA && !f.codiceFiscale) && (!f.indirizzo || !f.citta) ? ", " : ""}
                                                        {!f.indirizzo || !f.citta ? "Manca Indirizzo" : ""}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                            <div>{format(new Date(f.createdAt), "dd/MM/yyyy", { locale: it })}</div>
                                            <div className="text-xs text-gray-400">{format(new Date(f.createdAt), "HH:mm", { locale: it })}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/fornitori/${f.id}/edit`}
                                                    className="rounded p-1 text-blue-600 hover:bg-blue-50"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Link>
                                                <DeleteFornitoreButton
                                                    id={f.id}
                                                    hasPratiche={f._count.pratiche > 0}
                                                    hasFatture={false}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
