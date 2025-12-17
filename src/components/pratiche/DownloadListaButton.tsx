"use client";

import { FileText, Download } from "lucide-react";

export function DownloadListaButton({ id }: { id: string }) {
    const handleDownload = () => {
        window.open(`/api/pratiche/${id}/lista-partecipanti`, "_blank");
    };

    return (
        <button
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 border border-gray-300"
            title="Scarica Lista Passeggeri"
        >
            <Download className="h-4 w-4" />
            Lista Pax
        </button>
    );
}
