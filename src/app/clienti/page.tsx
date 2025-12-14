import Link from "next/link";
import { prisma } from "@/lib/db";
import { Plus, Search, Filter, User, Edit2 } from "lucide-react";
import { DeleteClienteButton } from "@/components/clienti/DeleteClienteButton";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export const dynamic = "force-dynamic";

async function getClienti() {
    const clienti = await prisma.cliente.findMany({
        orderBy: [
            { cognome: "asc" },
            { nome: "asc" },
        ],
        include: {
            _count: {
                select: { pratiche: true },
            },
        },
    });

    return clienti;
}

import { AnagraficheTabs } from "@/components/anagrafiche/AnagraficheTabs";

export default async function ClientiPage() {
    const clienti = await getClienti();

    return (
        <div className="p-8">
            <AnagraficheTabs />
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Clienti</h1>
                    <p className="mt-2 text-gray-600">
                        Gestisci le anagrafiche dei tuoi clienti
                    </p>
                </div>
                <Link
                    href="/clienti/nuovo"
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
                >
                    <Plus className="h-5 w-5" />
                    Nuovo Cliente
                </Link>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cerca per nome, cognome, email..."
                            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                    <Filter className="h-4 w-4" />
                    Filtri
                </button>
            </div>

            {/* Clienti Table */}
            <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5">
                {clienti.length === 0 ? (
                    <div className="p-12 text-center">
                        <User className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                            Nessun cliente
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            Inizia creando il primo cliente
                        </p>
                        <Link
                            href="/clienti/nuovo"
                            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            Nuovo Cliente
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Contatti
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Indirizzo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Codice Fiscale
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Pratiche
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Creato il
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Azioni
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {clienti.map((cliente) => (
                                    <tr
                                        key={cliente.id}
                                        className="transition-colors hover:bg-gray-50"
                                    >
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                                                    <span className="text-sm font-medium text-blue-600">
                                                        {cliente.nome[0]}
                                                        {cliente.cognome[0]}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="font-medium text-gray-900">
                                                        {cliente.nome} {cliente.cognome}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {cliente.telefono || "-"}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {cliente.email || "-"}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {cliente.indirizzo}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {cliente.cap} {cliente.citta} ({cliente.provincia})
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                            {cliente.codiceFiscale}
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4">
                                            <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                                                {cliente._count.pratiche}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                            <div>{format(new Date(cliente.createdAt), "dd/MM/yyyy", { locale: it })}</div>
                                            <div className="text-xs text-gray-400">{format(new Date(cliente.createdAt), "HH:mm", { locale: it })}</div>
                                        </td>
                                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-3">
                                                <Link
                                                    href={`/clienti/${cliente.id}/edit`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Modifica Cliente"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Link>
                                                <DeleteClienteButton
                                                    id={cliente.id}
                                                    hasPratiche={cliente._count.pratiche > 0}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Stats */}
            {clienti.length > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                    Totale: {clienti.length} client{clienti.length === 1 ? "e" : "i"}
                </div>
            )}
        </div>
    );
}
