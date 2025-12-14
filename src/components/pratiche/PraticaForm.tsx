"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Save, Calculator } from "lucide-react";
import { Step1 } from "@/components/pratiche/Step1";
import { Step2 } from "@/components/pratiche/Step2";
import { Step3 } from "@/components/pratiche/Step3";

interface PraticaFormProps {
    initialData?: any;
    isEditing?: boolean;
}

export function PraticaForm({ initialData, isEditing = false }: PraticaFormProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Default values combined with initialData
    const [formData, setFormData] = useState({
        clienteId: initialData?.clienteId || "",
        destinazione: initialData?.destinazione || "",
        tipologia: initialData?.tipologia || "CROCIERA",
        periodoRichiesto: initialData?.periodoRichiesto || "",
        dataPartenza: initialData?.dataPartenza ? new Date(initialData.dataPartenza).toISOString().split('T')[0] : "",
        dataRitorno: initialData?.dataRitorno ? new Date(initialData.dataRitorno).toISOString().split('T')[0] : "",
        numAdulti: initialData?.numAdulti || 2,
        numBambini: initialData?.numBambini || 0,
        etaBambini: initialData?.etaBambini || "",
        tipologiaCamera: initialData?.tipologiaCamera || "",
        operatore: initialData?.operatore || "MANU",
        cittaPartenza: initialData?.cittaPartenza || "",
        note: initialData?.note || "",

        // Step 2
        // Step 2 (Multi-Fornitore)
        fornitoreId: initialData?.fornitoreId || "",
        nomeFornitore: initialData?.nomeFornitore || "",
        costi: initialData?.costi || [],

        // Partecipanti (Detailed)
        partecipanti: initialData?.partecipanti || [],

        budgetCliente: initialData?.budgetCliente || 0,
        prezzoVendita: initialData?.prezzoVendita || 0,
        costoFornitore: initialData?.costoFornitore || 0,
        regimeIVA: initialData?.regimeIVA || "74TER",
        aliquotaIVA: initialData?.aliquotaIVA || 22,

        // Step 3
        stato: initialData?.stato || "PREVENTIVO_DA_ELABORARE",
        feedbackCliente: initialData?.feedbackCliente || "",
        richiedeAcconto: initialData?.richiedeAcconto || false,
        percentualeAcconto: initialData?.percentualeAcconto || 30,
        tipologiaCustom: "", // Temp field
    });

    // Calcoli automatici
    const margine = formData.prezzoVendita - formData.costoFornitore;
    const percentualeMargine = formData.prezzoVendita > 0
        ? ((margine / formData.prezzoVendita) * 100).toFixed(2)
        : "0";
    const stimaIVA = formData.regimeIVA === "74TER" ? margine * 0.22 : 0;

    const importoAcconto = formData.richiedeAcconto
        ? (formData.prezzoVendita * formData.percentualeAcconto / 100).toFixed(2)
        : "0";
    const importoSaldo = formData.richiedeAcconto
        ? (formData.prezzoVendita - parseFloat(importoAcconto)).toFixed(2)
        : formData.prezzoVendita.toFixed(2);

    // Auto-Save Logic
    const [lastSavedData, setLastSavedData] = useState(formData);
    const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

    // 1. Auto-Create Draft on Client Selection (if new)
    useEffect(() => {
        const createDraft = async () => {
            if (!isEditing && formData.clienteId && !formData.tipologiaCustom) { // tipologiaCustom check is just a proxy to avoid double firing
                try {
                    // Create minimal draft (BOZZA)
                    const response = await fetch("/api/pratiche", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            ...formData,
                            stato: "PREVENTIVO_DA_ELABORARE", // Default status for new draft
                            // Essential fields defaults
                            destinazione: formData.destinazione || "Nuova Destinazione",
                            operatore: formData.operatore || "MANU",
                            // Recalculate basic fields
                            margineCalcolato: margine,
                            percentualeMargine: parseFloat(percentualeMargine),
                            importoAcconto: parseFloat(importoAcconto),
                            importoSaldo: parseFloat(importoSaldo),
                        })
                    });

                    if (response.ok) {
                        const newPratica = await response.json();
                        // Switch URL to Edit Mode without refresh
                        if (typeof window !== "undefined") localStorage.removeItem("unsaved_pratica_new");
                        router.replace(`/pratiche/${newPratica.id}/edit`);
                        // Note: The parent page will re-render or we assume we are now "isEditing" conceptually? 
                        // Actually, Next.js shallow routing might not remount this component with new props immediately.
                        // Ideally we should reload or update local state to "isEditing=true".

                        // BUT: Since we redirect to /edit, the Page component usually re-renders PraticaForm with isEditing=true.
                        // However, to prevent data loss during transition, we rely on the DB having the data.
                    }
                } catch (e) {
                    console.error("Error creating draft", e);
                }
            }
        };

        // Trigger only if we have client and are not editing yet
        if (!isEditing && formData.clienteId) {
            // Debounce slightly or run immediately? 
            // Run immediately to secure the ID.
            createDraft();
        }
    }, [formData.clienteId, isEditing]); // Dependencies

    // 2. Auto-Save on Changes (if editing/draft exists)
    // 2. Auto-Save on Changes (if editing/draft exists)
    useEffect(() => {
        if (!isEditing) {
            // Pre-draft: Save to LocalStorage
            if (typeof window !== "undefined") {
                localStorage.setItem("unsaved_pratica_new", JSON.stringify(formData));
            }
            return;
        }

        // Compare with last saved to avoid redundant saves
        const isChanged = JSON.stringify(formData) !== JSON.stringify(lastSavedData);
        if (!isChanged) return;

        setAutoSaveStatus("unsaved");

        const timeoutId = setTimeout(async () => {
            setAutoSaveStatus("saving");
            try {
                if (!initialData?.id) return;

                const response = await fetch(`/api/pratiche/${initialData.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...formData,
                        // Always recalculate derived values for persistence
                        margineCalcolato: margine,
                        percentualeMargine: parseFloat(percentualeMargine),
                        importoAcconto: parseFloat(importoAcconto),
                        importoSaldo: parseFloat(importoSaldo),
                    }),
                    keepalive: true // Allows request to complete even if tab closes
                });

                if (response.ok) {
                    setLastSavedData(formData);
                    setAutoSaveStatus("saved");
                } else {
                    setAutoSaveStatus("unsaved"); // Retry?
                }
            } catch (err) {
                console.error("Auto-save failed", err);
                setAutoSaveStatus("unsaved");
            }
        }, 1000); // Reduced to 1 second for better safety

        return () => clearTimeout(timeoutId);
    }, [formData, isEditing, lastSavedData, initialData?.id]);

    // Restore from LocalStorage (Pre-draft only)
    useEffect(() => {
        if (!isEditing && typeof window !== "undefined") {
            const saved = localStorage.getItem("unsaved_pratica_new");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Only restore if we don't have conflicting initialData (should be empty for new)
                    setFormData(prev => ({ ...prev, ...parsed }));
                } catch (e) {
                    console.error("Failed to restore draft", e);
                }
            }
        }
    }, [isEditing]);


    // Existing Helpers
    const handleNext = () => {
        if (currentStep < 3) setCurrentStep(currentStep + 1);
    };

    const handlePrevious = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // ... (rest of validation)

        // Final Save (changes status to CONFERMATA if appropriate, or keeps current)
        // Actually, "Salva Pratica" button usually means "Done/Confirm".
        // Let's assume it sets status to "DA_ELABORARE" or "CONFERMATA"?
        // For now, let's keep it creating/updating. The user might want to keep it as Bozza manually? 
        // Logic: if it's "BOZZA", button should arguably say "Conferma Pratica".
        // Use existing logic but ensure we save correctly.

        try {
            const url = isEditing ? `/api/pratiche/${initialData.id}` : "/api/pratiche";
            const method = isEditing ? "PUT" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    // If manually saving, we might want to ensure 'stato' isn't stuck on BOZZA if user intends to finish?
                    // But maybe user just wants to save progress manually.
                    // Let's leave 'stato' as is in formData (user can change it in Step 3).

                    tipologia: formData.tipologia === "ALTRO" ? formData.tipologiaCustom : formData.tipologia,
                    margineCalcolato: margine,
                    percentualeMargine: parseFloat(percentualeMargine),
                    importoAcconto: parseFloat(importoAcconto),
                    importoSaldo: parseFloat(importoSaldo),
                }),
            });

            // ... (rest of success handling)
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Errore durante il salvataggio");
            }

            router.push("/pratiche?success=true");
            router.refresh();
        } catch (error) {
            console.error("Errore:", error);
            alert("Errore durante il salvataggio della pratica. Riprova.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <button
                            onClick={async () => {
                                // Try to save before leaving if unsaved
                                if (autoSaveStatus === "unsaved" && initialData?.id) {
                                    setAutoSaveStatus("saving");
                                    try {
                                        await fetch(`/api/pratiche/${initialData.id}`, {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                                ...formData,
                                                margineCalcolato: margine,
                                                percentualeMargine: parseFloat(percentualeMargine),
                                                importoAcconto: parseFloat(importoAcconto),
                                                importoSaldo: parseFloat(importoSaldo),
                                            }),
                                            keepalive: true
                                        });
                                    } catch (e) { console.error(e); }
                                }
                                router.back();
                            }}
                            className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Torna indietro (Salva ed Esci)
                        </button>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold text-gray-900">
                                {isEditing ? `Modifica Pratica #${initialData?.numero || ''}` : "Nuova Pratica"}
                            </h1>
                            {isEditing && (
                                <span className={`text-sm font-medium transition-colors ${autoSaveStatus === "saved" ? "text-green-600" :
                                    autoSaveStatus === "saving" ? "text-blue-600" :
                                        "text-gray-400"
                                    }`}>
                                    {autoSaveStatus === "saved" && "Salvataggio completato"}
                                    {autoSaveStatus === "saving" && "Salvataggio in corso..."}
                                    {autoSaveStatus === "unsaved" && "Modifiche non salvate"}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Form principale */}
                    <div className="lg:col-span-2">
                        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                            {/* Progress Steps */}
                            <div className="mb-8">
                                <div className="flex items-center justify-between">
                                    {[1, 2, 3].map((step) => (
                                        <div key={step} className="flex flex-1 items-center">
                                            <div
                                                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${currentStep >= step
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-gray-200 text-gray-600"
                                                    }`}
                                            >
                                                {step}
                                            </div>
                                            {step < 3 && (
                                                <div
                                                    className={`h-1 flex-1 ${currentStep > step ? "bg-blue-600" : "bg-gray-200"
                                                        }`}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-2 flex justify-between text-sm">
                                    <span className={currentStep === 1 ? "font-medium text-blue-600" : "text-gray-600"}>
                                        Dati Essenziali
                                    </span>
                                    <span className={currentStep === 2 ? "font-medium text-blue-600" : "text-gray-600"}>
                                        Dettagli Commerciali
                                    </span>
                                    <span className={currentStep === 3 ? "font-medium text-blue-600" : "text-gray-600"}>
                                        Gestione
                                    </span>
                                </div>
                            </div>

                            {/* Step Content */}
                            <div className="space-y-6">
                                {currentStep === 1 && (
                                    <Step1
                                        formData={formData}
                                        setFormData={setFormData}
                                    />
                                )}
                                {currentStep === 2 && (
                                    <Step2
                                        formData={formData}
                                        setFormData={setFormData}
                                    />
                                )}
                                {currentStep === 3 && (
                                    <Step3
                                        formData={formData}
                                        setFormData={setFormData}
                                        praticaId={initialData?.id}
                                    />
                                )}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="mt-8 flex justify-between border-t pt-6">
                                <button
                                    onClick={handlePrevious}
                                    disabled={currentStep === 1}
                                    className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Indietro
                                </button>
                                {currentStep < 3 ? (
                                    <button
                                        onClick={handleNext}
                                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                    >
                                        Avanti
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                                    >
                                        <Save className="h-4 w-4" />
                                        Salva Pratica
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Riepilogo */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                            <div className="mb-4 flex items-center gap-2">
                                <Calculator className="h-5 w-5 text-blue-600" />
                                <h3 className="font-semibold text-gray-900">Riepilogo Prezzi</h3>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Prezzo vendita:</span>
                                    <span className="font-medium">€ {formData.prezzoVendita.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Costo fornitore:</span>
                                    <span className="font-medium">€ {formData.costoFornitore.toFixed(2)}</span>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="flex justify-between">
                                        <span className="font-medium text-gray-900">Margine:</span>
                                        <div className="text-right">
                                            <span className={`font-bold block ${margine >= 0 ? "text-green-600" : "text-red-600"}`}>
                                                € {margine.toFixed(2)} ({percentualeMargine}%)
                                            </span>
                                            {/* Stima IVA */}
                                            {stimaIVA > 0 && formData.regimeIVA === "74TER" && (
                                                <span className="block text-xs font-medium text-red-600 mt-1">
                                                    Stima IVA: € {stimaIVA.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {formData.richiedeAcconto && (
                                    <>
                                        <div className="border-t pt-3">
                                            <div className="mb-2 text-xs font-medium uppercase text-gray-500">
                                                Pagamenti
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Acconto {formData.percentualeAcconto}%:</span>
                                                <span className="font-medium text-blue-600">€ {importoAcconto}</span>
                                            </div>
                                            <div className="flex justify-between mt-2">
                                                <span className="text-gray-600">Saldo:</span>
                                                <span className="font-medium">€ {importoSaldo}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
