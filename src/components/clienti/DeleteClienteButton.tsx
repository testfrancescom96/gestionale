"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteClienteButton({ id, hasPratiche }: { id: string, hasPratiche: boolean }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (hasPratiche) {
            alert("Non puoi eliminare un cliente che ha delle pratiche associate.\nElimina prima le pratiche.");
            return;
        }

        if (!confirm("Sei sicuro di voler eliminare questo cliente?\nQuesta azione è irreversibile.")) {
            return;
        }

        setIsDeleting(true);

        try {
            const res = await fetch(`/api/clienti/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || "Errore durante l'eliminazione");
            }
        } catch (error) {
            console.error("Errore eliminazione cliente", error);
            alert("Errore di connessione");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`text-gray-400 hover:text-red-600 disabled:opacity-50`}
            title={hasPratiche ? "Attenzione: Cliente con pratiche" : "Elimina Cliente"}
        >
            <Trash2 className="h-4 w-4" />
        </button>
    );
}
