"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";

export default function NuovoClientePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        nome: "",
        cognome: "",
        dataNascita: "", // YYYY-MM-DD
        via: "",
        civico: "",
        cap: "",
        citta: "",
        provincia: "",
        codiceFiscale: "",
        email: "",
        telefono: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Parse CF to Date
    const calculateDataNascita = (cf: string) => {
        if (!cf || cf.length !== 16) return "";

        try {
            const yearPart = cf.substring(6, 8);
            const monthChar = cf.substring(8, 9).toUpperCase();
            const dayPart = cf.substring(9, 11);

            const months = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'H': 5, 'M': 6, 'P': 7, 'R': 8, 'S': 9, 'T': 10 };
            // @ts-ignore
            const month = months[monthChar];

            let day = parseInt(dayPart);
            // Female correction (day + 40)
            if (day > 40) day -= 40;

            let year = parseInt(yearPart);
            // Guess century: 00-24 -> 2000s, 25-99 -> 1900s
            const currentYearTwoDigits = new Date().getFullYear() % 100;
            const century = year <= currentYearTwoDigits ? 2000 : 1900;
            year += century;

            if (isNaN(day) || month === undefined || isNaN(year)) return "";

            // Format YYYY-MM-DD
            const d = new Date(Date.UTC(year, month, day));
            return d.toISOString().split('T')[0];
        } catch (e) {
            return "";
        }
    };

    const handleChange = (field: string, value: string) => {
        const newData = { ...formData, [field]: value };

        // Auto-calculate DOB if CF changes and is valid
        if (field === "codiceFiscale" && value.length === 16) {
            const dob = calculateDataNascita(value);
            if (dob) {
                newData.dataNascita = dob;
            }
        }

        setFormData(newData);
        // Save to LocalStorage immediately
        if (typeof window !== "undefined") {
            localStorage.setItem("unsaved_cliente", JSON.stringify(newData));
        }

        if (errors[field]) {
            setErrors({ ...errors, [field]: "" });
        }
    };

    // Load from LocalStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("unsaved_cliente");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setFormData(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to restore draft", e);
            }
        }
    }, []);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.nome.trim()) newErrors.nome = "Nome obbligatorio";
        if (!formData.cognome.trim()) newErrors.cognome = "Cognome obbligatorio";

        // Altri campi opzionali per preventivi
        if (formData.cap && !/^\d{5}$/.test(formData.cap))
            newErrors.cap = "CAP non valido (5 cifre)";

        if (formData.provincia && formData.provincia.length !== 2)
            newErrors.provincia = "Sigla provincia (2 lettere)";

        if (formData.codiceFiscale && !/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i.test(formData.codiceFiscale))
            newErrors.codiceFiscale = "Codice Fiscale non valido";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
        e.preventDefault();

        // If draft, skip strict validation? For now allow partial name/surname at least.
        const isValid = validate();
        if (!isDraft && !isValid) return;
        if (isDraft && (!formData.nome.trim() || !formData.cognome.trim())) {
            alert("Inserisci almeno Nome e Cognome per salvare la bozza.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch("/api/clienti", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    dataNascita: formData.dataNascita ? new Date(formData.dataNascita) : null,
                    stato: isDraft ? "BOZZA" : "ATTIVO"
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Show actual server error
                throw new Error(data.error || "Errore durante la creazione");
            }

            // Successo - reindirizza alla lista clienti
            localStorage.removeItem("unsaved_cliente");
            router.push("/clienti?success=true");
        } catch (error: any) {
            console.error("Errore creazione cliente:", error);
            alert(error.message || "Errore durante la creazione del cliente.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-3xl">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button
                            onClick={() => router.push("/clienti")}
                            className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Torna ai clienti
                        </button>
                        <h1 className="text-3xl font-bold text-gray-900">Nuovo Cliente</h1>
                        <p className="mt-2 text-gray-600">
                            Inserisci i dati anagrafici e di fatturazione
                        </p>
                    </div>
                    {/* Draft Controls */}
                    <button
                        type="button"
                        onClick={() => {
                            if (confirm("Vuoi davvero cancellare tutti i dati inseriti?")) {
                                setFormData({
                                    nome: "", cognome: "", dataNascita: "", via: "", civico: "",
                                    cap: "", citta: "", provincia: "", codiceFiscale: "", email: "", telefono: ""
                                });
                                localStorage.removeItem("unsaved_cliente");
                                alert("Campi ripuliti.");
                            }
                        }}
                        className="text-sm text-red-600 hover:text-red-700 underline"
                    >
                        Scarta Bozza / Pulisci
                    </button>
                </div>

                <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
                    {/* ... (existing fields) ... */}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 items-center">
                        <div className="flex-1"></div>
                        <button
                            type="button"
                            onClick={() => router.push("/clienti")}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Annulla
                        </button>

                        <button
                            type="button"
                            onClick={(e) => handleSubmit(e, true)}
                            disabled={isSubmitting}
                            className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
                        >
                            Salva come Bozza
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {isSubmitting ? "Salvataggio..." : "Salva e Attiva"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
