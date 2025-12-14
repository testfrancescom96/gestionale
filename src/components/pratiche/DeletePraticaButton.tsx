"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface DeletePraticaButtonProps {
    id: string;
}

export function DeletePraticaButton({ id }: DeletePraticaButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Sei sicuro di voler eliminare questa pratica? L'azione è irreversibile.")) {
            return;
        }

        setIsDeleting(true);

        try {
            const response = await fetch(`/api/pratiche/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Errore durante l'eliminazione");
            }

            router.push("/pratiche?deleted=true");
            router.refresh();
        } catch (error) {
            console.error("Errore:", error);
            alert("Si è verificato un errore durante l'eliminazione della pratica.");
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 hover:border-red-300 disabled:opacity-50"
        >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Eliminazione..." : "Elimina"}
        </button>
    );
}
