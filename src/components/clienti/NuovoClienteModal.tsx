"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface NuovoClienteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClienteCreato: (cliente: any) => void;
    initialData?: any; // Add this
}

import { useEffect } from "react"; // Add this

export function NuovoClienteModal({
    isOpen,
    onClose,
    onClienteCreato,
    initialData,
}: NuovoClienteModalProps) {
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

    // Load initial data for editing
    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                nome: initialData.nome || "",
                cognome: initialData.cognome || "",
                dataNascita: initialData.dataNascita ? new Date(initialData.dataNascita).toISOString().split('T')[0] : "",
                via: initialData.via || "", // If address is split in DB? Or "indirizzo" field?
                civico: "", // Might need parsing if "indirizzo" is single string
                cap: initialData.cap || "",
                citta: initialData.citta || "",
                provincia: initialData.provincia || "",
                codiceFiscale: initialData.codiceFiscale || "",
                email: initialData.email || "",
                telefono: initialData.telefono || "",
            });
            // Note: If 'indirizzo' is a single string in DB, we might need to rely on that or existing modal doesn't support 'indirizzo' single field?
            // The modal has via/civico/cap/citta. The DB has 'indirizzo', 'citta', 'cap'.
            // I'll map 'indirizzo' to 'via' for now.
            if (initialData.indirizzo) {
                setFormData(prev => ({ ...prev, via: initialData.indirizzo }));
            }
        } else if (isOpen && !initialData) {
            // Reset if new
            setFormData({
                nome: "", cognome: "", dataNascita: "", via: "", civico: "", cap: "", citta: "", provincia: "", codiceFiscale: "", email: "", telefono: ""
            });
        }
    }, [isOpen, initialData]);

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
            // Simple heuristic, can be improved
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
        if (field === "codiceFiscale") {
            const cleanCF = value.trim().toUpperCase();
            if (cleanCF.length === 16) {
                const dob = calculateDataNascita(cleanCF);
                if (dob) {
                    newData.dataNascita = dob;
                }
            }
        }

        setFormData(newData);
        // Clear error when user types
        if (errors[field]) {
            setErrors({ ...errors, [field]: "" });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.nome.trim()) newErrors.nome = "Nome obbligatorio";
        if (!formData.cognome.trim()) newErrors.cognome = "Cognome obbligatorio";

        // Validazioni opzionali solo se i campi sono compilati
        if (formData.cap && !/^\d{5}$/.test(formData.cap))
            newErrors.cap = "CAP non valido (5 cifre)";

        if (formData.provincia && formData.provincia.length !== 2)
            newErrors.provincia = "Sigla provincia (2 lettere)";

        if (formData.codiceFiscale && !/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i.test(formData.codiceFiscale))
            newErrors.codiceFiscale = "Codice Fiscale non valido";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            const response = await fetch("/api/clienti", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    dataNascita: formData.dataNascita ? new Date(formData.dataNascita) : null
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Errore durante la creazione");
            }

            // Passa il cliente creato (con ID dal database)
            onClienteCreato(data.cliente);
            onClose();

            // Reset form
            setFormData({
                nome: "",
                cognome: "",
                dataNascita: "",
                via: "",
                civico: "",
                cap: "",
                citta: "",
                provincia: "",
                codiceFiscale: "",
                email: "",
                telefono: "",
            });
        } catch (error: any) {
            console.error("Errore creazione cliente:", error);
            alert(error.message || "Errore durante la creazione del cliente. Riprova.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between border-b pb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        Nuovo Cliente
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Dati Anagrafici */}
                    <div>
                        <h3 className="mb-4 font-medium text-gray-900">Dati Anagrafici</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Nome <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.nome}
                                    onChange={(e) => handleChange("nome", e.target.value)}
                                    className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-1 ${errors.nome
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        }`}
                                />
                                {errors.nome && (
                                    <p className="mt-1 text-xs text-red-600">{errors.nome}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Cognome <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.cognome}
                                    onChange={(e) => handleChange("cognome", e.target.value)}
                                    className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-1 ${errors.cognome
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        }`}
                                />
                                {errors.cognome && (
                                    <p className="mt-1 text-xs text-red-600">{errors.cognome}</p>
                                )}
                            </div>
                        </div>

                        {/* Data Nascita */}
                        <div className="mt-4">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Data di Nascita
                            </label>
                            <input
                                type="date"
                                value={formData.dataNascita}
                                onChange={(e) => handleChange("dataNascita", e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Calcolata automaticamente se inserisci il Codice Fiscale.
                            </p>
                        </div>
                    </div>

                    {/* Indirizzo Residenza */}
                    <div>
                        <h3 className="mb-4 font-medium text-gray-900">
                            Indirizzo di Residenza
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2">
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Via
                                </label>
                                <input
                                    type="text"
                                    value={formData.via}
                                    onChange={(e) => handleChange("via", e.target.value)}
                                    placeholder="es: Via Roma"
                                    className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-1 ${errors.via
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        }`}
                                />
                                {errors.via && (
                                    <p className="mt-1 text-xs text-red-600">{errors.via}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Civico
                                </label>
                                <input
                                    type="text"
                                    value={formData.civico}
                                    onChange={(e) => handleChange("civico", e.target.value)}
                                    placeholder="es: 10"
                                    className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-1 ${errors.civico
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        }`}
                                />
                                {errors.civico && (
                                    <p className="mt-1 text-xs text-red-600">{errors.civico}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    CAP
                                </label>
                                <input
                                    type="text"
                                    value={formData.cap}
                                    onChange={(e) => handleChange("cap", e.target.value)}
                                    placeholder="es: 65100"
                                    maxLength={5}
                                    className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-1 ${errors.cap
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        }`}
                                />
                                {errors.cap && (
                                    <p className="mt-1 text-xs text-red-600">{errors.cap}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Città
                                </label>
                                <input
                                    type="text"
                                    value={formData.citta}
                                    onChange={(e) => handleChange("citta", e.target.value)}
                                    placeholder="es: Pescara"
                                    className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-1 ${errors.citta
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        }`}
                                />
                                {errors.citta && (
                                    <p className="mt-1 text-xs text-red-600">{errors.citta}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Provincia
                                </label>
                                <input
                                    type="text"
                                    value={formData.provincia}
                                    onChange={(e) =>
                                        handleChange("provincia", e.target.value.toUpperCase())
                                    }
                                    placeholder="es: PE"
                                    maxLength={2}
                                    className={`w-full rounded-lg border px-4 py-2 text-sm uppercase focus:outline-none focus:ring-1 ${errors.provincia
                                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        }`}
                                />
                                {errors.provincia && (
                                    <p className="mt-1 text-xs text-red-600">{errors.provincia}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Dati Fiscali */}
                    <div>
                        <h3 className="mb-4 font-medium text-gray-900">Dati Fiscali</h3>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Codice Fiscale
                            </label>
                            <input
                                type="text"
                                value={formData.codiceFiscale}
                                onChange={(e) =>
                                    handleChange("codiceFiscale", e.target.value.toUpperCase())
                                }
                                placeholder="es: RSSMRA80A01H501U"
                                maxLength={16}
                                className={`w-full rounded-lg border px-4 py-2 text-sm uppercase focus:outline-none focus:ring-1 ${errors.codiceFiscale
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                    }`}
                            />
                            {errors.codiceFiscale && (
                                <p className="mt-1 text-xs text-red-600">{errors.codiceFiscale}</p>
                            )}
                        </div>
                    </div>

                    {/* Contatti (Opzionali) */}
                    <div>
                        <h3 className="mb-4 font-medium text-gray-900">
                            Contatti <span className="text-sm font-normal text-gray-500">(opzionali)</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    placeholder="cliente@example.com"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Telefono
                                </label>
                                <input
                                    type="tel"
                                    value={formData.telefono}
                                    onChange={(e) => handleChange("telefono", e.target.value)}
                                    placeholder="es: 333 1234567"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 border-t pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Crea Cliente
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
