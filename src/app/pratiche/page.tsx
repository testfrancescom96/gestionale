import Link from "next/link";
import { prisma } from "@/lib/db";
import { Plus, Filter, FileText } from "lucide-react";
import { PraticheTable } from "@/components/pratiche/PraticheTable";
import { SearchInput } from "@/components/common/SearchInput";

async function getPratiche(query?: string) {
    const whereClause: any = {};

    if (query) {
        const isNumber = !isNaN(parseInt(query));
        whereClause.OR = [
            { cliente: { nome: { contains: query } } }, // SQLite is case-insensitive by default roughly, or needs specific collation. standard Contains usually works.
            { cliente: { cognome: { contains: query } } },
            { destinazione: { contains: query } },
        ];

        if (isNumber) {
            whereClause.OR.push({ numero: parseInt(query) });
        }
    }

    const pratiche = await prisma.pratica.findMany({
        where: whereClause,
        include: {
            cliente: true,
            fornitore: true,
            pagamenti: true,
        },
        orderBy: {
            dataRichiesta: "desc",
        },
    });

    return pratiche;
}

export default async function PratichePage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    const { q } = await searchParams;
    const pratiche = await getPratiche(q);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Pratiche</h1>
                    <p className="mt-2 text-gray-600">
                        Gestisci tutte le pratiche di viaggio
                    </p>
                </div>
                <Link
                    href="/pratiche/nuova"
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
                >
                    <Plus className="h-5 w-5" />
                    Nuova Pratica
                </Link>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-4">
                <div className="flex-1">
                    <SearchInput placeholder="Cerca per cliente, destinazione o numero pratica..." />
                </div>
                <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                    <Filter className="h-4 w-4" />
                    Filtri
                </button>
            </div>

            {/* Pratiche Table */}
            <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5">
                {pratiche.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                            {q ? "Nessun risultato trovato" : "Nessuna pratica"}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            {q ? "Prova a modificare i filtri di ricerca" : "Inizia creando la tua prima pratica di viaggio"}
                        </p>
                        {!q && (
                            <Link
                                href="/pratiche/nuova"
                                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                <Plus className="h-4 w-4" />
                                Nuova Pratica
                            </Link>
                        )}
                    </div>
                ) : (
                    <PraticheTable pratiche={pratiche} />
                )}
            </div>
        </div>
    );
}
