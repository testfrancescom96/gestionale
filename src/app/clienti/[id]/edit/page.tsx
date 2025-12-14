"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { CustomFieldsRenderer } from "@/components/custom-fields/CustomFieldsRenderer";

export default function ModificaClientePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state flattened for simplicity
    const [formData, setFormData] = useState({
        nome: "",
        cognome: "",
        email: "",
        telefono: "",
        indirizzo: "",
        citta: "",
        cap: "",
        provincia: "",
        codiceFiscale: "",
        dataNascita: "",
    });

    useEffect(() => {
        const loadCliente = async () => {
            try {
                const res = await fetch(`/api/clienti/${id}`);
                if (res.ok) {
                    const data = await res.json();
                    setFormData({
                        nome: data.nome || "",
                        cognome: data.cognome || "",
                        email: data.email || "",
                        telefono: data.telefono || "",
                        indirizzo: data.indirizzo || "",
                        citta: data.citta || "",
                        cap: data.cap || "",
                        provincia: data.provincia || "",
                        codiceFiscale: data.codiceFiscale || "",
                        dataNascita: data.dataNascita ? new Date(data.dataNascita).toISOString().split('T')[0] : "",
                    });
                } else {
                    alert("Cliente non trovato");
                    router.push("/clienti");
                }
            } catch (error) {
                console.error("Errore caricamento cliente", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadCliente();
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`/api/clienti/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push("/clienti");
                router.refresh();
            } else {
                alert("Errore durante il salvataggio");
            }
        } catch (error) {
            console.error("Errore salvataggio", error);
            alert("Errore di connessione");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (isLoading) return <div className="p-8">Caricamento...</div>;

    return (
        <div className="p-8">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/clienti" className="rounded-full bg-gray-100 p-2 hover:bg-gray-200">
                    <ArrowLeft className="h-6 w-6 text-gray-600" />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Modifica Cliente</h1>
            </div>

            <div className="max-w-2xl rounded-lg bg-white p-6 shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Dati Personali */}
                        <div className="md:col-span-2">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Dati Personali</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome *</label>
                            <input
                                name="nome"
                                type="text"
                                required
                                value={formData.nome}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Cognome *</label>
                            <input
                                name="cognome"
                                type="text"
                                required
                                value={formData.cognome}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Codice Fiscale</label>
                            <input
                                name="codiceFiscale"
                                type="text"
                                value={formData.codiceFiscale}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Data di Nascita</label>
                            <input
                                name="dataNascita"
                                type="date"
                                value={formData.dataNascita}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        {/* Contatti */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Recapiti</h3>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Telefono</label>
                            <input
                                name="telefono"
                                type="tel"
                                value={formData.telefono}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        {/* Campi Personalizzati */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Campi Personalizzati</h3>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <CustomFieldsRenderer
                                    entity="CLIENTE"
                                    entityId={id}
                                    onChange={(fieldDefId, value) => {
                                        fetch("/api/custom-fields/values", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                fieldDefId,
                                                clienteId: id,
                                                value,
                                            }),
                                            keepalive: true,
                                        }).catch(console.error);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Indirizzo */}
                        <div className="md:col-span-2 mt-4">
                            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Indirizzo</h3>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Via e Civico</label>
                            <input
                                name="indirizzo"
                                type="text"
                                value={formData.indirizzo}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Città</label>
                            <input
                                name="citta"
                                type="text"
                                value={formData.citta}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">CAP</label>
                            <input
                                name="cap"
                                type="text"
                                value={formData.cap}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Provincia</label>
                            <input
                                name="provincia"
                                type="text"
                                maxLength={2}
                                value={formData.provincia}
                                onChange={handleChange}
                                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                        <Link
                            href="/clienti"
                            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Annulla
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {isSubmitting ? "Salvataggio..." : "Salva Modifiche"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
