import Link from "next/link";
import { prisma } from "@/lib/db";
import { Plus, Search, Filter, Building, Edit2 } from "lucide-react";
import { DeleteFornitoreButton } from "@/components/fornitori/DeleteFornitoreButton";
import { FornitoriTable } from "@/components/fornitori/FornitoriTable";

export const dynamic = "force-dynamic";

async function getFornitori() {
    const fornitori = await prisma.fornitore.findMany({
        orderBy: {
            ragioneSociale: "asc",
        },
        include: {
            _count: {
                select: { pratiche: true },
            },
        },
    });

    return fornitori;
}

import { AnagraficheTabs } from "@/components/anagrafiche/AnagraficheTabs";

export default async function FornitoriPage() {
    const fornitori = await getFornitori();

    return (
        <div className="p-8">
            <AnagraficheTabs />
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Fornitori</h1>
                    <p className="mt-2 text-gray-600">
                        Gestisci i tuoi fornitori di viaggio e le loro modalità di fatturazione
                    </p>
                </div>
                <Link
                    href="/fornitori/nuovo"
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
                >
                    <Plus className="h-5 w-5" />
                    Nuovo Fornitore
                </Link>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cerca per ragione sociale, P.IVA..."
                            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
                <button className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                    <Filter className="h-4 w-4" />
                    Filtri
                </button>
            </div>

            {/* Fornitori Table */}
            <FornitoriTable fornitori={fornitori} />

            {/* Stats */}
            {fornitori.length > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                    Totale: {fornitori.length} fornitor{fornitori.length === 1 ? "e" : "i"}
                </div>
            )}
        </div>
    );
}
