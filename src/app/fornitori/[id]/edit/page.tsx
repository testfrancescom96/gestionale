"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { FornitoreForm } from "@/components/fornitori/FornitoreForm";

export default function ModificaFornitorePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [initialData, setInitialData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadFornitore = async () => {
            try {
                const res = await fetch(`/api/fornitori/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setInitialData(data);
                } else {
                    alert("Fornitore non trovato");
                }
            } catch (error) {
                console.error("Errore caricamento fornitore", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadFornitore();
    }, [id]);

    if (isLoading) return <div className="p-8">Caricamento...</div>;
    if (!initialData) return <div className="p-8">Errore nel caricamento</div>;

    return (
        <div className="p-8">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/fornitori" className="rounded-full bg-gray-100 p-2 hover:bg-gray-200">
                    <ArrowLeft className="h-6 w-6 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Modifica Fornitore</h1>
                    <p className="text-sm text-gray-500">Aggiorna i dati e i servizi</p>
                </div>
            </div>

            <div className="max-w-4xl">
                <FornitoreForm initialData={initialData} isEditing={true} />
            </div>
        </div>
    );
}
