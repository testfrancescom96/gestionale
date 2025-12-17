import Link from "next/link";
import { prisma } from "@/lib/db";
import { Plus, FileText } from "lucide-react";
import { PraticheTable } from "@/components/pratiche/PraticheTable";
import { SearchInput } from "@/components/common/SearchInput";
import { FiltersPratiche } from "@/components/pratiche/FiltersPratiche";

async function getPratiche(query?: string, status?: string, dateFrom?: string, dateTo?: string) {
    const whereClause: any = { AND: [] };

    // Search Query
    if (query) {
        const isNumber = !isNaN(parseInt(query));
        const searchConditions = [
            { cliente: { nome: { contains: query } } },
            { cliente: { cognome: { contains: query } } },
            { destinazione: { contains: query } },
        ];
        if (isNumber) {
            searchConditions.push({ numero: parseInt(query) } as any);
        }
        whereClause.AND.push({ OR: searchConditions });
    }

    // Status Filter
    if (status) {
        const statuses = status.split(",");
        if (statuses.length > 0) {
            whereClause.AND.push({ stato: { in: statuses } });
        }
    }

    // Date Filters
    if (dateFrom) {
        whereClause.AND.push({ createdAt: { gte: new Date(dateFrom) } });
    }
    if (dateTo) {
        // Add one day to include the end date fully if it's just YYYY-MM-DD
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereClause.AND.push({ createdAt: { lte: endDate } });
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
    searchParams: Promise<{ q?: string; status?: string; dateFrom?: string; dateTo?: string }>;
}) {
    const { q, status, dateFrom, dateTo } = await searchParams;
    const pratiche = await getPratiche(q, status, dateFrom, dateTo);

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
                    Nuovo Pratica
                </Link>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-4">
                <div className="flex-1">
                    <SearchInput placeholder="Cerca per cliente, destinazione o numero pratica..." />
                </div>
                <FiltersPratiche />
            </div>

            {/* Pratiche Table */}
            <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5">
                {pratiche.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">
                            {q || status || dateFrom ? "Nessun risultato trovato" : "Nessuna pratica"}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                            {q || status || dateFrom ? "Prova a modificare i filtri di ricerca" : "Inizia creando la tua prima pratica di viaggio"}
                        </p>
                        {(!q && !status && !dateFrom) && (
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
