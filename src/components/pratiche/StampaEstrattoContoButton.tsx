"use client";

import { Receipt } from "lucide-react";

export function StampaEstrattoContoButton({ id }: { id: string }) {

    const handleDownload = () => {
        // Apre il PDF in una nuova scheda
        window.open(`/api/pratiche/${id}/estratto-conto`, "_blank");
    };

    return (
        <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
            <Receipt className="h-4 w-4" />
            Estratto Conto
        </button>
    );
}
