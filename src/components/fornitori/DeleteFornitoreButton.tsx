"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteFornitoreButtonProps {
    id: string;
    hasPratiche: boolean;
    hasFatture: boolean;
}

export function DeleteFornitoreButton({ id, hasPratiche, hasFatture }: DeleteFornitoreButtonProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (hasPratiche) {
            alert("Non puoi eliminare un fornitore associato a delle pratiche.");
            return;
        }
        if (hasFatture) {
            alert("Non puoi eliminare un fornitore che ha fatture di acquisto registrate.");
            return;
        }

        if (!confirm("Sei sicuro di voler eliminare questo fornitore?\nQuesta azione è irreversibile.")) {
            return;
        }

        setIsDeleting(true);

        try {
            const res = await fetch(`/api/fornitori/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || "Errore durante l'eliminazione");
            }
        } catch (error) {
            console.error("Errore eliminazione fornitore", error);
            alert("Errore di connessione");
        } finally {
            setIsDeleting(false);
        }
    };

    const isDisabled = isDeleting || hasPratiche || hasFatture;
    let title = "Elimina Fornitore";
    if (hasPratiche) title = "Impossibile eliminare: ha pratiche associate";
    else if (hasFatture) title = "Impossibile eliminare: ha fatture registrate";

    return (
        <button
            onClick={handleDelete}
            disabled={isDisabled}
            className={`text-gray-400 hover:text-red-600 disabled:opacity-50 ${isDisabled ? "cursor-not-allowed" : ""}`}
            title={title}
        >
            <Trash2 className="h-4 w-4" />
        </button>
    );
}
