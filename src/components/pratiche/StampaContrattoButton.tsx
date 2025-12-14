"use client";

import { FileText } from "lucide-react";

export function StampaContrattoButton({ id }: { id: string }) {

    const handleDownload = () => {
        // Apre il PDF in una nuova scheda
        window.open(`/api/pratiche/${id}/contratto`, "_blank");
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={() => window.open(`/api/pratiche/${id}/contratto`, "_blank")}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
                <FileText className="h-4 w-4" />
                Stampa Contratto
            </button>
            <button
                onClick={() => window.open(`/api/pratiche/${id}/contratto?debug=true`, "_blank")}
                className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                title="Scarica PDF con i nomi dei campi per verificare la mappatura"
            >
                Mappa Campi
            </button>
        </div>
    );
}
