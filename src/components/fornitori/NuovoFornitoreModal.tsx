"use client";

// Reset form when opened
useEffect(() => {
    if (isOpen) {
        setFormData({
            denominazione: "",
            partitaIva: "",
            indirizzo: "",
            citta: "",
            cap: "",
            telefono: "",
            email: "",
        });
    }
}, [isOpen]);

if (!isOpen) return null;

const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
};

interface NuovoFornitoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFornitoreCreato: (fornitore: any) => void;
}

export function NuovoFornitoreModal({ isOpen, onClose, onFornitoreCreato }: NuovoFornitoreModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        denominazione: "",
        partitaIva: "",
        indirizzo: "",
        citta: "",
        cap: "",
        telefono: "",
        email: "",
    });

    if (!isOpen) return null;

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!formData.denominazione.trim()) {
            alert("La denominazione è obbligatoria");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch("/api/fornitori", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const nuovoFornitore = await res.json();
                onFornitoreCreato(nuovoFornitore);
                onClose();
            } else {
                alert("Errore creazione fornitore");
            }
        } catch (error) {
            console.error(error);
            alert("Errore di rete");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl ring-1 ring-gray-900/5">
                <div className="flex items-center justify-between border-b p-4">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Nuovo Fornitore Rapido</h2>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                        💡 Puoi inserire solo la denominazione ora e completare i dati in seguito.
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Denominazione / Ragione Sociale *</label>
                        <input
                            className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                            placeholder="Es. Hotel Bella Vista, Mario Rossi Tour..."
                            value={formData.denominazione}
                            onChange={(e) => handleChange("denominazione", e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Partita IVA (Opzionale)</label>
                            <input
                                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                                value={formData.partitaIva}
                                onChange={(e) => handleChange("partitaIva", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email (Opzionale)</label>
                            <input
                                className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t bg-gray-50 p-4">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                        Annulla
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {isLoading ? "Salvataggio..." : "Salva e Usa"}
                    </button>
                </div>
            </div>
        </div>
    );
}
