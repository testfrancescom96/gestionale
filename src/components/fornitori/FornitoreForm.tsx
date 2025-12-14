"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { CustomFieldsRenderer } from "@/components/custom-fields/CustomFieldsRenderer";

interface Service {
    id?: string;
    nome: string;
    aliquotaIva: string;
    descrizione?: string;
}

interface FornitoreFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export function FornitoreForm({ initialData, isEditing = false }: FornitoreFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        ragioneSociale: "",
        nomeComune: "",
        via: "",
        civico: "",
        cap: "",
        citta: "",
        provincia: "",
        indirizzo: "", // Deprecato ma mantenuto per compatibilità
        partitaIVA: "",
        codiceFiscale: "",
        email: "",
        telefono: "",
        sitoWeb: "",
        pec: "",
        codiceSDI: "",
        tipoFornitore: "TOUR_OPERATOR",
        tipologiaFatturazione: "ORDINARIA",
        applicaRitenuta: false,
        percentualeRitenuta: 0,
        note: "",
    });

    const [servizi, setServizi] = useState<Service[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Stati per le liste personalizzabili
    const [tipiServizio, setTipiServizio] = useState<{ id: string, nome: string, defaultAliquota?: string }[]>([]);
    const [aliquoteIva, setAliquoteIva] = useState<{ id: string, valore: string }[]>([]);

    useEffect(() => {
        // Carica dati iniziali se in modifica
        if (initialData) {
            setFormData({
                ragioneSociale: initialData.ragioneSociale || "",
                nomeComune: initialData.nomeComune || "",
                via: initialData.via || "",
                civico: initialData.civico || "",
                cap: initialData.cap || "",
                citta: initialData.citta || "",
                provincia: initialData.provincia || "",
                indirizzo: initialData.indirizzo || "",
                partitaIVA: initialData.partitaIVA || "",
                codiceFiscale: initialData.codiceFiscale || "",
                email: initialData.email || "",
                telefono: initialData.telefono || "",
                sitoWeb: initialData.sitoWeb || "",
                pec: initialData.pec || "",
                codiceSDI: initialData.codiceSDI || "",
                tipoFornitore: initialData.tipoFornitore || "TOUR_OPERATOR",
                tipologiaFatturazione: initialData.tipologiaFatturazione || "ORDINARIA",
                applicaRitenuta: initialData.applicaRitenuta || false,
                percentualeRitenuta: initialData.percentualeRitenuta || 0,
                note: initialData.note || "",
            });
            if (initialData.servizi) {
                setServizi(initialData.servizi);
            }
        }

        // Carica liste personalizzabili
        const fetchData = async () => {
            try {
                const [resTipi, resAliquote] = await Promise.all([
                    fetch("/api/impostazioni/tipi-servizio"),
                    fetch("/api/impostazioni/aliquote-iva")
                ]);
                if (resTipi.ok) setTipiServizio(await resTipi.json());
                if (resAliquote.ok) setAliquoteIva(await resAliquote.json());
            } catch (error) {
                console.error("Errore caricamento liste", error);
            }
        };
        fetchData();
    }, [initialData]);

    const handleChange = (field: string, value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: "" }));
        }

        // Save to LocalStorage immediately (if creating new)
        if (!isEditing && typeof window !== "undefined") {
            const draft = {
                formData: newData,
                servizi: servizi // Also save services!
            };
            localStorage.setItem("unsaved_fornitore", JSON.stringify(draft));
        }
    };

    // Save services to local storage too
    useEffect(() => {
        if (!isEditing && typeof window !== "undefined" && servizi.length > 0) {
            const draft = {
                formData: formData,
                servizi: servizi
            };
            localStorage.setItem("unsaved_fornitore", JSON.stringify(draft));
        }
    }, [servizi, isEditing]);

    // Restore from LocalStorage on mount
    useEffect(() => {
        if (!isEditing && typeof window !== "undefined") {
            const saved = localStorage.getItem("unsaved_fornitore");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.formData) setFormData(prev => ({ ...prev, ...parsed.formData }));
                    if (parsed.servizi) setServizi(parsed.servizi);
                } catch (e) {
                    console.error("Failed to restore draft", e);
                }
            }
        }
    }, [isEditing]);

    // --- Gestione Servizi ---
    const addService = () => {
        setServizi([...servizi, { nome: "", aliquotaIva: "22" }]);
    };

    const removeService = (index: number) => {
        const newServizi = [...servizi];
        newServizi.splice(index, 1);
        setServizi(newServizi);
    };

    const updateService = (index: number, field: keyof Service, value: string) => {
        const newServizi = [...servizi];
        newServizi[index] = { ...newServizi[index], [field]: value };

        // Auto-select IVA se cambio il nome del servizio
        if (field === "nome") {
            const foundType = tipiServizio.find(t => t.nome === value);
            if (foundType && foundType.defaultAliquota) {
                newServizi[index].aliquotaIva = foundType.defaultAliquota;
            }
        }

        setServizi(newServizi);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.ragioneSociale.trim()) newErrors.ragioneSociale = "Ragione sociale obbligatoria";
        // if (!formData.partitaIVA.trim()) newErrors.partitaIVA = "Partita IVA obbligatoria"; // Potrebbe non averla se estero? Facciamo che è obbligatoria per coerenza
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);

        const payload = {
            ...formData,
            servizi: servizi, // Inviamo tutto l'array
        };

        try {
            const url = isEditing ? `/api/fornitori/${initialData.id}` : "/api/fornitori";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Errore salvataggio");
            }

            if (typeof window !== "undefined") localStorage.removeItem("unsaved_fornitore");
            router.push("/fornitori");
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Errore durante il salvataggio");
        } finally {
            // Keep submitting state a bit longer to prevent double clicks during refresh
            setTimeout(() => {
                if (isMounted) setIsSubmitting(false);
            }, 1000);
        }
    };

    // Prevent memory leaks
    const [isMounted, setIsMounted] = useState(true);
    useEffect(() => {
        return () => {
            setIsMounted(false);
        }
    }, [])

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                {/* Dati Aziendali */}
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Dati Aziendali</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Ragione Sociale *</label>
                                <input
                                    type="text"
                                    value={formData.ragioneSociale}
                                    onChange={(e) => handleChange("ragioneSociale", e.target.value)}
                                    placeholder="Es. Mario Rossi S.R.L."
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                                {errors.ragioneSociale && <p className="text-xs text-red-600 mt-1">{errors.ragioneSociale}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nome Comune (Alias)</label>
                                <input
                                    type="text"
                                    value={formData.nomeComune || ""}
                                    onChange={(e) => handleChange("nomeComune", e.target.value)}
                                    placeholder="Es. Mario Rossi (Nome per ricerca veloce)"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">Se compilato, verrà usato per cercare il fornitore.</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo Fornitore</label>
                        <select
                            value={formData.tipoFornitore}
                            onChange={(e) => handleChange("tipoFornitore", e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                            <option value="TOUR_OPERATOR">Tour Operator</option>
                            <option value="COMPAGNIA_AEREA">Compagnia Aerea</option>
                            <option value="HOTEL">Hotel</option>
                            <option value="TRASPORTI">Trasporti</option>
                            <option value="ASSICURAZIONE">Assicurazione</option>
                            <option value="ALTRO">Altro</option>
                        </select>
                    </div>
                </div>

                {/* Fatturazione e Servizi */}
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4 mt-8">Configurazione Fiscale & Servizi</h3>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Regime / Tipologia Documento</label>
                        <select
                            value={formData.tipologiaFatturazione}
                            onChange={(e) => handleChange("tipologiaFatturazione", e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-yellow-50"
                        >
                            <option value="ORDINARIA">Ordinaria (Fattura Standard)</option>
                            <option value="74TER">74-quater (Regime Speciale Agenzie)</option>
                            <option value="AUTOFATTURA_COMMISSIONI">Autofattura per Commissioni (Es. T.O.)</option>
                            <option value="FATTURA_ESTERA">Fattura Estera (Reverse Charge/TD17)</option>
                            <option value="ESENTE">Esente / Non Imponibile</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Seleziona il regime fiscale predefinito per questo fornitore.</p>
                    </div>

                    {/* Lista Servizi Dinamica */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">Servizi Offerti e IVA Parametrica</label>
                            <button type="button" onClick={addService} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                <Plus className="h-4 w-4" /> Aggiungi Servizio
                            </button>
                        </div>

                        {servizi.length === 0 ? (
                            <p className="text-xs text-gray-500 italic">Nessun servizio configurato.</p>
                        ) : (
                            <div className="space-y-3">
                                {servizi.map((service, index) => (
                                    <div key={index} className="flex gap-3 items-start flex-wrap md:flex-nowrap border-b pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                                        <div className="flex-1 min-w-[200px]">
                                            <div className="flex gap-2">
                                                <select
                                                    value={service.nome}
                                                    onChange={(e) => updateService(index, "nome", e.target.value)}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                >
                                                    <option value="">Seleziona Servizio...</option>
                                                    {tipiServizio.map(t => (
                                                        <option key={t.id} value={t.nome}>{t.nome}</option>
                                                    ))}
                                                    <option value="NEW_SERVICE">+ Aggiungi Nuovo...</option>
                                                </select>
                                                {service.nome === "NEW_SERVICE" && (
                                                    <input
                                                        autoFocus
                                                        placeholder="Nome nuovo servizio"
                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                        onBlur={async (e) => {
                                                            const val = e.target.value;
                                                            if (val) {
                                                                // Save new service on the fly
                                                                try {
                                                                    const res = await fetch("/api/impostazioni/tipi-servizio", {
                                                                        method: "POST",
                                                                        body: JSON.stringify({ nome: val })
                                                                    });
                                                                    if (res.ok) {
                                                                        const newItem = await res.json();
                                                                        setTipiServizio(prev => [...prev, newItem].sort((a, b) => a.nome.localeCompare(b.nome)));
                                                                        updateService(index, "nome", newItem.nome);
                                                                    }
                                                                } catch (err) { console.error(err); }
                                                            } else {
                                                                updateService(index, "nome", "");
                                                            }
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="w-40">
                                            <div className="flex gap-2">
                                                <select
                                                    value={service.aliquotaIva}
                                                    onChange={(e) => updateService(index, "aliquotaIva", e.target.value)}
                                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                >
                                                    <option value="">IVA...</option>
                                                    {aliquoteIva.map(a => (
                                                        <option key={a.id} value={a.valore}>{a.valore}</option>
                                                    ))}
                                                    <option value="NEW_IVA">+ Aggiungi...</option>
                                                </select>
                                                {service.aliquotaIva === "NEW_IVA" && (
                                                    <input
                                                        autoFocus
                                                        placeholder="Valore"
                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                                        onBlur={async (e) => {
                                                            const val = e.target.value;
                                                            if (val) {
                                                                // Save new IVA on the fly
                                                                try {
                                                                    const res = await fetch("/api/impostazioni/aliquote-iva", {
                                                                        method: "POST",
                                                                        body: JSON.stringify({ valore: val })
                                                                    });
                                                                    if (res.ok) {
                                                                        const newItem = await res.json();
                                                                        setAliquoteIva(prev => [...prev, newItem].sort((a, b) => a.valore.localeCompare(b.valore)));
                                                                        updateService(index, "aliquotaIva", newItem.valore);
                                                                    }
                                                                } catch (err) { console.error(err); }
                                                            } else {
                                                                updateService(index, "aliquotaIva", "");
                                                            }
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => removeService(index)} className="text-red-500 hover:text-red-700 p-2">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Dati Fiscali Dettagliati */}
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4 mt-8">Dati Fiscali</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Partita IVA</label>
                        <input
                            type="text"
                            value={formData.partitaIVA}
                            onChange={(e) => handleChange("partitaIVA", e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Codice Fiscale</label>
                        <input
                            type="text"
                            value={formData.codiceFiscale}
                            onChange={(e) => handleChange("codiceFiscale", e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Codice SDI</label>
                        <input
                            type="text"
                            value={formData.codiceSDI}
                            onChange={(e) => handleChange("codiceSDI", e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Pec</label>
                        <input
                            type="text"
                            value={formData.pec}
                            onChange={(e) => handleChange("pec", e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                    </div>
                </div>

                {/* Contatti */}
                <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4 mt-8">Contatti & Sede</h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Telefono</label>
                        <input
                            type="text"
                            value={formData.telefono}
                            onChange={(e) => handleChange("telefono", e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                    </div>
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-6 gap-6">
                        <div className="md:col-span-4">
                            <label className="block text-sm font-medium text-gray-700">Via / Piazza</label>
                            <input
                                type="text"
                                value={formData.via}
                                onChange={(e) => handleChange("via", e.target.value)}
                                placeholder="Es: Via Roma"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Civico</label>
                            <input
                                type="text"
                                value={formData.civico}
                                onChange={(e) => handleChange("civico", e.target.value)}
                                placeholder="Es: 10/B"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-6 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">CAP</label>
                            <input
                                type="text"
                                value={formData.cap}
                                onChange={(e) => handleChange("cap", e.target.value)}
                                placeholder="00100"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Città</label>
                            <input
                                type="text"
                                value={formData.citta}
                                onChange={(e) => handleChange("citta", e.target.value)}
                                placeholder="Roma"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Provincia</label>
                            <input
                                type="text"
                                value={formData.provincia}
                                onChange={(e) => handleChange("provincia", e.target.value)}
                                placeholder="RM"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Note</label>
                        <textarea
                            value={formData.note}
                            onChange={(e) => handleChange("note", e.target.value)}
                            rows={3}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Campi Personalizzati (Solo in modifica) */}
            {isEditing && initialData?.id && (
                <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5 mt-6">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">Campi Personalizzati</h3>
                    <CustomFieldsRenderer
                        entity="FORNITORE"
                        entityId={initialData.id}
                        onChange={(fieldDefId, value) => {
                            fetch("/api/custom-fields/values", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    fieldDefId,
                                    fornitoreId: initialData.id,
                                    value,
                                }),
                                keepalive: true,
                            }).catch(console.error);
                        }}
                    />
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={() => router.push("/fornitori")}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Annulla
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    <Save className="h-4 w-4" />
                    {isSubmitting ? "Salvataggio..." : "Salva Fornitore"}
                </button>
            </div>
        </form>
    );
}
