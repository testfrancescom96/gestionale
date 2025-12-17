"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, X, Calendar } from "lucide-react";

const statuses = [
    { value: "BOZZA", label: "Bozza" },
    { value: "PREVENTIVO_DA_ELABORARE", label: "Da Elaborare" },
    { value: "IN_ATTESA_CONFERMA", label: "In Attesa" },
    { value: "CONFERMATO_E_PAGATO", label: "Confermato" },
    { value: "ANNULLATO", label: "Annullato" },
];

export function FiltersPratiche() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);

    const [filters, setFilters] = useState({
        status: [] as string[],
        dateFrom: "",
        dateTo: "",
    });

    // Load filters from URL on mount
    useEffect(() => {
        const statusParam = searchParams.get("status");
        const dateFromParam = searchParams.get("dateFrom");
        const dateToParam = searchParams.get("dateTo");

        setFilters({
            status: statusParam ? statusParam.split(",") : [],
            dateFrom: dateFromParam || "",
            dateTo: dateToParam || "",
        });
    }, [searchParams]);

    const handleStatusChange = (value: string) => {
        setFilters(prev => {
            const newStatus = prev.status.includes(value)
                ? prev.status.filter(s => s !== value)
                : [...prev.status, value];
            return { ...prev, status: newStatus };
        });
    };

    const applyFilters = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (filters.status.length > 0) {
            params.set("status", filters.status.join(","));
        } else {
            params.delete("status");
        }

        if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
        else params.delete("dateFrom");

        if (filters.dateTo) params.set("dateTo", filters.dateTo);
        else params.delete("dateTo");

        router.push(`?${params.toString()}`);
        setIsOpen(false);
    };

    const clearFilters = () => {
        setFilters({ status: [], dateFrom: "", dateTo: "" });
        const params = new URLSearchParams(searchParams.toString());
        params.delete("status");
        params.delete("dateFrom");
        params.delete("dateTo");
        router.push(`?${params.toString()}`);
        setIsOpen(false);
    };

    const activeFilterCount = (filters.status.length > 0 ? 1 : 0) + (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors 
                    ${activeFilterCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
                <Filter className="h-4 w-4" />
                Filtri
                {activeFilterCount > 0 && (
                    <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                        {filters.status.length + (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0)}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 z-40 mt-2 w-72 rounded-lg border border-gray-100 bg-white p-4 shadow-lg ring-1 ring-gray-900/5">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Filtra per</h3>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-500">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Status */}
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">Stato</label>
                                <div className="space-y-2">
                                    {statuses.map(status => (
                                        <label key={status.value} className="flex items-center gap-2 text-sm text-gray-700">
                                            <input
                                                type="checkbox"
                                                checked={filters.status.includes(status.value)}
                                                onChange={() => handleStatusChange(status.value)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                            />
                                            {status.label}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Date Range */}
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase text-gray-500">Data Creazione</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-gray-400">Da</label>
                                        <input
                                            type="date"
                                            value={filters.dateFrom}
                                            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                                            className="w-full rounded border border-gray-300 p-1 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">A</label>
                                        <input
                                            type="date"
                                            value={filters.dateTo}
                                            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                                            className="w-full rounded border border-gray-300 p-1 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <button
                                    onClick={clearFilters}
                                    className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={applyFilters}
                                    className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    Applica
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
