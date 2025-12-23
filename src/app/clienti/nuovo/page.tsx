"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";

interface DuplicateClient {
    id: number;
    nome: string;
    cognome: string;
    codiceFiscale: string;
    telefono?: string;
}

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

    // Duplicate checks
    const [cfDuplicate, setCfDuplicate] = useState<DuplicateClient | null>(null);
    const [cognomeSuggestions, setCognomeSuggestions] = useState<DuplicateClient[]>([]);
    const [checkingCf, setCheckingCf] = useState(false);

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

    // Check CF duplicate
    const checkCfDuplicate = async (cf: string) => {
        if (cf.length < 10) {
            setCfDuplicate(null);
            return;
        }
        setCheckingCf(true);
        try {
            const res = await fetch(`/api/clienti/check-duplicates?cf=${encodeURIComponent(cf)}`);
            const data = await res.json();
            setCfDuplicate(data.cfDuplicate || null);
        } catch (e) {
            console.error("Errore check CF:", e);
        } finally {
            setCheckingCf(false);
        }
    };

    // Check cognome suggestions
    const checkCognomeSuggestions = async (cognome: string) => {
        if (cognome.length < 2) {
            setCognomeSuggestions([]);
            return;
        }
        try {
            const res = await fetch(`/api/clienti/check-duplicates?cognome=${encodeURIComponent(cognome)}`);
            const data = await res.json();
            setCognomeSuggestions(data.cognomeSuggestions || []);
        } catch (e) {
            console.error("Errore check cognome:", e);
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
            // Check for duplicate after full CF
            checkCfDuplicate(value);
        }

        // Check cognome suggestions
        if (field === "cognome") {
            checkCognomeSuggestions(value);
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
        <div className="min-h-full bg-gray-50 p-8 pb-16">
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
                    {/* Dati Personali */}
                    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Dati Personali</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome *</label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={(e) => handleChange("nome", e.target.value)}
                                    className={`mt-1 w-full rounded-lg border ${errors.nome ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                />
                                {errors.nome && <p className="mt-1 text-xs text-red-500">{errors.nome}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cognome *</label>
                                <input
                                    type="text"
                                    value={formData.cognome}
                                    onChange={(e) => handleChange("cognome", e.target.value)}
                                    className={`mt-1 w-full rounded-lg border ${errors.cognome ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                />
                                {errors.cognome && <p className="mt-1 text-xs text-red-500">{errors.cognome}</p>}

                                {/* Suggerimenti cognome */}
                                {cognomeSuggestions.length > 0 && (
                                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-xs font-medium text-blue-700 mb-2">
                                            ⚠️ Clienti esistenti con cognome simile:
                                        </p>
                                        <div className="space-y-1 max-h-32 overflow-y-auto">
                                            {cognomeSuggestions.map(c => (
                                                <div key={c.id} className="flex items-center justify-between text-xs">
                                                    <span className="text-blue-800">{c.cognome} {c.nome}</span>
                                                    <Link
                                                        href={`/clienti/${c.id}`}
                                                        className="text-blue-600 hover:underline flex items-center gap-1"
                                                        target="_blank"
                                                    >
                                                        Apri <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Codice Fiscale</label>
                                <input
                                    type="text"
                                    value={formData.codiceFiscale}
                                    onChange={(e) => handleChange("codiceFiscale", e.target.value.toUpperCase())}
                                    maxLength={16}
                                    className={`mt-1 w-full rounded-lg border ${errors.codiceFiscale ? "border-red-500" : cfDuplicate ? "border-yellow-500" : "border-gray-300"} px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                    placeholder="Inserisci per calcolare data nascita"
                                />
                                {errors.codiceFiscale && <p className="mt-1 text-xs text-red-500">{errors.codiceFiscale}</p>}

                                {/* Warning CF duplicato */}
                                {cfDuplicate && (
                                    <div className="mt-2 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-yellow-800">
                                                    Codice Fiscale già esistente!
                                                </p>
                                                <p className="text-xs text-yellow-700 mt-1">
                                                    Cliente: {cfDuplicate.cognome} {cfDuplicate.nome}
                                                </p>
                                                <div className="mt-2 flex gap-2">
                                                    <Link
                                                        href={`/clienti/${cfDuplicate.id}`}
                                                        className="text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-2 py-1 rounded flex items-center gap-1"
                                                    >
                                                        Apri Cliente <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCfDuplicate(null)}
                                                        className="text-xs text-yellow-600 hover:text-yellow-800 underline"
                                                    >
                                                        Continua comunque
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Data di Nascita</label>
                                <input
                                    type="date"
                                    value={formData.dataNascita}
                                    onChange={(e) => handleChange("dataNascita", e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contatti */}
                    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Contatti</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Telefono</label>
                                <input
                                    type="tel"
                                    value={formData.telefono}
                                    onChange={(e) => handleChange("telefono", e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Indirizzo */}
                    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">Indirizzo</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                            <div className="md:col-span-4">
                                <label className="block text-sm font-medium text-gray-700">Via</label>
                                <input
                                    type="text"
                                    value={formData.via}
                                    onChange={(e) => handleChange("via", e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">N° Civico</label>
                                <input
                                    type="text"
                                    value={formData.civico}
                                    onChange={(e) => handleChange("civico", e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700">CAP</label>
                                <input
                                    type="text"
                                    value={formData.cap}
                                    onChange={(e) => handleChange("cap", e.target.value)}
                                    maxLength={5}
                                    className={`mt-1 w-full rounded-lg border ${errors.cap ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                />
                                {errors.cap && <p className="mt-1 text-xs text-red-500">{errors.cap}</p>}
                            </div>
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-gray-700">Città</label>
                                <input
                                    type="text"
                                    value={formData.citta}
                                    onChange={(e) => handleChange("citta", e.target.value)}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700">Provincia</label>
                                <input
                                    type="text"
                                    value={formData.provincia}
                                    onChange={(e) => handleChange("provincia", e.target.value.toUpperCase())}
                                    maxLength={2}
                                    className={`mt-1 w-full rounded-lg border ${errors.provincia ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                    placeholder="es. PE"
                                />
                                {errors.provincia && <p className="mt-1 text-xs text-red-500">{errors.provincia}</p>}
                            </div>
                        </div>
                    </div>

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
