"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";

interface CustomFieldDefinition {
    id: string;
    fieldName: string;
    fieldType: string;
    label: string;
    isRequired: boolean;
    options?: string;
}

interface CustomFieldValue {
    id: string;
    fieldDefId: string;
    value: string;
    fieldDef: CustomFieldDefinition;
}

interface CustomFieldsRendererProps {
    entity: "PRATICA" | "CLIENTE" | "FORNITORE";
    entityId?: string | null;
    onChange: (fieldDefId: string, value: string) => void;
}

export function CustomFieldsRenderer({
    entity,
    entityId,
    onChange,
}: CustomFieldsRendererProps) {
    const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
    const [values, setValues] = useState<Record<string, string>>({});
    const [showAddField, setShowAddField] = useState(false);
    const [newFieldLabel, setNewFieldLabel] = useState("");
    const [newFieldType, setNewFieldType] = useState("TEXT");
    const [isGlobal, setIsGlobal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Load definitions
    useEffect(() => {
        const fetchDefinitions = async () => {
            try {
                const res = await fetch(`/api/custom-fields/definitions?entity=${entity}&global=true`);
                if (res.ok) {
                    const data = await res.json();
                    setDefinitions(data);
                }
            } catch (error) {
                console.error("Error loading custom field definitions:", error);
            }
        };
        fetchDefinitions();
    }, [entity]);

    // Load values if editing
    useEffect(() => {
        if (entityId) {
            const fetchValues = async () => {
                try {
                    const res = await fetch(`/api/custom-fields/values/${entity.toLowerCase()}/${entityId}`);
                    if (res.ok) {
                        const data: CustomFieldValue[] = await res.json();
                        const valuesMap: Record<string, string> = {};
                        data.forEach((v) => {
                            valuesMap[v.fieldDefId] = v.value;
                        });
                        setValues(valuesMap);
                    }
                } catch (error) {
                    console.error("Error loading custom field values:", error);
                }
            };
            fetchValues();
        }
    }, [entity, entityId]);

    const handleValueChange = (fieldDefId: string, value: string) => {
        setValues((prev) => ({ ...prev, [fieldDefId]: value }));
        onChange(fieldDefId, value);
    };

    const handleAddField = async () => {
        if (!newFieldLabel.trim()) return;
        setIsLoading(true);

        try {
            const res = await fetch("/api/custom-fields/definitions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    entity,
                    fieldName: newFieldLabel.toLowerCase().replace(/\s+/g, "_"),
                    fieldType: newFieldType,
                    label: newFieldLabel,
                    isGlobal,
                    createdBy: "System", // TODO: Get from session
                }),
            });

            if (res.ok) {
                const newDef = await res.json();
                setDefinitions((prev) => [...prev, newDef]);
                setNewFieldLabel("");
                setNewFieldType("TEXT");
                setIsGlobal(false);
                setShowAddField(false);
            } else {
                alert("Errore nella creazione del campo");
            }
        } catch (error) {
            console.error("Error creating custom field:", error);
            alert("Errore nella creazione del campo");
        } finally {
            setIsLoading(false);
        }
    };

    const renderFieldInput = (def: CustomFieldDefinition) => {
        const value = values[def.id] || "";

        switch (def.fieldType) {
            case "TEXTAREA":
                return (
                    <textarea
                        value={value}
                        onChange={(e) => handleValueChange(def.id, e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        rows={3}
                    />
                );
            case "NUMBER":
                return (
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => handleValueChange(def.id, e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                );
            case "DATE":
                return (
                    <input
                        type="date"
                        value={value}
                        onChange={(e) => handleValueChange(def.id, e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                );
            case "SELECT":
                const options = def.options ? JSON.parse(def.options) : [];
                return (
                    <select
                        value={value}
                        onChange={(e) => handleValueChange(def.id, e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                        <option value="">Seleziona...</option>
                        {options.map((opt: string) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                );
            default: // TEXT
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => handleValueChange(def.id, e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                );
        }
    };

    if (definitions.length === 0 && !showAddField) {
        return (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                <p className="text-sm text-gray-500 mb-3">Nessun campo personalizzato definito</p>
                <button
                    onClick={() => setShowAddField(true)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4" />
                    Aggiungi Campo
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {definitions.map((def) => (
                <div key={def.id}>
                    <label className="block text-sm font-medium text-gray-700">
                        {def.label}
                        {def.isRequired && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="mt-1">{renderFieldInput(def)}</div>
                </div>
            ))}

            {showAddField ? (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">Nuovo Campo Personalizzato</h4>
                        <button
                            onClick={() => setShowAddField(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome Campo</label>
                        <input
                            type="text"
                            value={newFieldLabel}
                            onChange={(e) => setNewFieldLabel(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            placeholder="es: Budget Approvato"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Tipo</label>
                        <select
                            value={newFieldType}
                            onChange={(e) => setNewFieldType(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                            <option value="TEXT">Testo</option>
                            <option value="TEXTAREA">Area di Testo</option>
                            <option value="NUMBER">Numero</option>
                            <option value="DATE">Data</option>
                            <option value="SELECT">Selezione</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isGlobal"
                            checked={isGlobal}
                            onChange={(e) => setIsGlobal(e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isGlobal" className="text-sm text-gray-700">
                            Usa per tutti i futuri {entity === "PRATICA" ? "pratiche" : entity === "CLIENTE" ? "clienti" : "fornitori"}
                        </label>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddField}
                            disabled={isLoading || !newFieldLabel.trim()}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isLoading ? "Creazione..." : "Crea Campo"}
                        </button>
                        <button
                            onClick={() => setShowAddField(false)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Annulla
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowAddField(true)}
                    className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600"
                >
                    <Plus className="h-4 w-4" />
                    Aggiungi Campo Personalizzato
                </button>
            )}
        </div>
    );
}
