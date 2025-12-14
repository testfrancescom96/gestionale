"use client";

import { formatDistance, format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

type Pratica = {
    id: string;
    numero: number | null;
    dataRichiesta: Date;
    createdAt: Date;
    destinazione: string;
    stato: string;
    feedbackCliente: string | null;
    prezzoVendita: number | null;
    tipologia: string;
    cliente: {
        nome: string;
        cognome: string;
        telefono: string | null;
        indirizzo: string | null;
        codiceFiscale: string | null;
    };
    fornitore: {
        ragioneSociale: string;
    } | null;
};

const statoColors: Record<string, string> = {
    PREVENTIVO_DA_ELABORARE: "bg-yellow-100 text-yellow-800",
    IN_ATTESA_CONFERMA: "bg-blue-100 text-blue-800",
    CONFERMATO_E_PAGATO: "bg-green-100 text-green-800",
    ELABORATO: "bg-gray-100 text-gray-800",
    ANNULLATO: "bg-red-100 text-red-800",
    // Legacy statuses
    BOZZA: "bg-red-100 text-red-800",
    DA_ELABORARE: "bg-gray-100 text-gray-800",
    CONFERMATO: "bg-green-100 text-green-800",
};

const statoLabels: Record<string, string> = {
    PREVENTIVO_DA_ELABORARE: "Preventivo da Elaborare",
    IN_ATTESA_CONFERMA: "In Attesa",
    CONFERMATO_E_PAGATO: "Confermato",
    ELABORATO: "Elaborato",
    ANNULLATO: "Annullato",
    // Legacy
    BOZZA: "Bozza",
    DA_ELABORARE: "Da Elaborare",
    CONFERMATO: "Confermato",
};

export function PraticheTable({ pratiche }: { pratiche: Pratica[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            N°
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Cliente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Destinazione
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Tipologia
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Stato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Prezzo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Creato il
                        </th>
                        <th className="relative px-6 py-3">
                            <span className="sr-only">Azioni</span>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {pratiche.map((pratica) => (
                        <tr
                            key={pratica.id}
                            className="transition-colors hover:bg-gray-50"
                        >
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                #{pratica.numero || "—"}
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">
                                    {pratica.cliente.cognome} {pratica.cliente.nome}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {pratica.cliente.telefono || "—"}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">
                                    {pratica.destinazione}
                                </div>
                                {pratica.fornitore && (
                                    <div className="text-sm text-gray-500">
                                        {pratica.fornitore.ragioneSociale}
                                    </div>
                                )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {pratica.tipologia}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4">
                                <span
                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statoColors[pratica.stato] || statoColors.DA_ELABORARE
                                        }`}
                                >
                                    {statoLabels[pratica.stato] || pratica.stato}
                                </span>
                                {pratica.stato === "CONFERMATO" && (
                                    (!pratica.cliente.codiceFiscale || !pratica.cliente.indirizzo) ? (
                                        <div className="mt-1 flex items-center gap-1 text-xs text-amber-600 font-medium" title="Mancano Dati Fiscali Cliente">
                                            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
                                            Dati Mancanti
                                        </div>
                                    ) : (
                                        <div className="mt-1 flex items-center gap-1 text-xs text-green-600 font-medium" title="Pronta per Fatturazione">
                                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                            Fatturabile
                                        </div>
                                    )
                                )}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                {pratica.prezzoVendita
                                    ? `€ ${pratica.prezzoVendita.toFixed(2)}`
                                    : "—"}
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                <div>{format(new Date(pratica.createdAt), "dd/MM/yyyy", { locale: it })}</div>
                                <div className="text-xs text-gray-400">{format(new Date(pratica.createdAt), "HH:mm", { locale: it })}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                <Link
                                    href={`/pratiche/${pratica.id}`}
                                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                                >
                                    Dettagli
                                    <ExternalLink className="h-4 w-4" />
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div >
    );
}
