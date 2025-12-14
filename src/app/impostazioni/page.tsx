"use client";

import { Settings } from "lucide-react";
import { OperatoriManager } from "@/components/impostazioni/OperatoriManager";
import { ListManager } from "@/components/impostazioni/ListManager";
import { useState, useEffect } from "react";

export default function SettingsPage() {
    const [aliquoteOptions, setAliquoteOptions] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        fetch("/api/impostazioni/aliquote-iva")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAliquoteOptions(data.map((a: any) => ({ value: a.valore, label: a.valore })));
                }
            })
            .catch(err => console.error(err));
    }, []);

    return (
        <div>
            <div className="flex items-center gap-2 mb-6">
                <Settings className="h-6 w-6 text-gray-700" />
                <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
            </div>

            <div className="space-y-6">
                <OperatoriManager />

                <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        <ListManager
                            title="Tipi di Servizio"
                            description="Volo, Hotel, Transfer, Tour..."
                            apiEndpoint="/api/impostazioni/tipi-servizio"
                            placeholder="Nome Servizio"
                            fieldKey="nome"
                            extraField={{
                                key: "defaultAliquota",
                                label: "IVA Default",
                                options: aliquoteOptions
                            }}
                        />
                        <ListManager
                            title="Aliquote IVA"
                            description="22, 10, Esente, 74ter..."
                            apiEndpoint="/api/impostazioni/aliquote-iva"
                            placeholder="Valore (es. 22)"
                            fieldKey="valore"
                        />
                        <ListManager
                            title="Tipologie Viaggio"
                            description="Nuziale, Gruppo, Business..."
                            apiEndpoint="/api/impostazioni/tipi-viaggio"
                            placeholder="Tipologia"
                            fieldKey="nome"
                        />
                        <ListManager
                            title="Feedback Cliente"
                            description="Confermato, Prezzo Alto, Ci Pensa..."
                            apiEndpoint="/api/impostazioni/tipi-feedback"
                            placeholder="Feedback"
                            fieldKey="nome"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
