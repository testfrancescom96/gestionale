
import { useState, useEffect } from "react";
import { Loader2, X, Save, Check } from "lucide-react";

interface FieldConfig {
    fieldKey: string;
    label: string;
    isPartenza: boolean;
    isVisible: boolean;
    isSaved: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export function ExportSettingsModal({ isOpen, onClose }: Props) {
    const [fields, setFields] = useState<FieldConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null); // key causing save

    useEffect(() => {
        if (isOpen) fetchFields();
    }, [isOpen]);

    const fetchFields = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/woocommerce/config/fields");
            const data = await res.json();
            setFields(data);
        } catch (error) {
            console.error("Error fetching configs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (field: FieldConfig) => {
        setSaving(field.fieldKey);
        try {
            const res = await fetch("/api/woocommerce/config/fields", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(field)
            });
            if (res.ok) {
                // Refresh list to reflect updates (e.g. single Partenza check)
                fetchFields();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between border-b p-5">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Mappatura Campi Excel</h2>
                        <p className="text-sm text-gray-500">Decidi quali dati di WooCommerce includere nella Lista Passeggeri.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : fields.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed">
                            <p className="text-gray-500">Nessun campo aggiuntivo trovato negli ultimi ordini.</p>
                            <p className="text-xs text-gray-400 mt-1">Esegui una sincronizzazione per popolare i dati.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-100 rounded text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <div className="col-span-5">Campi Trovati (WooCommerce)</div>
                                <div className="col-span-5 text-center">Opzioni</div>
                                <div className="col-span-2 text-right">Stato</div>
                            </div>

                            {fields.map((field) => (
                                <div key={field.fieldKey} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors bg-white">
                                    <div className="col-span-5">
                                        <div className="font-semibold text-gray-900">{field.label}</div>
                                        <div className="text-xs text-mono text-gray-400">{field.fieldKey}</div>
                                    </div>

                                    <div className="col-span-5 flex items-center justify-center gap-4">
                                        {/* Is Partenza Toggle */}
                                        <label className={`flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all ${field.isPartenza
                                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={field.isPartenza}
                                                onChange={() => handleSave({ ...field, isPartenza: !field.isPartenza })}
                                            />
                                            {field.isPartenza ? '📍 Punto Partenza' : '📍 Imposta Partenza'}
                                        </label>
                                    </div>

                                    <div className="col-span-2 text-right">
                                        {saving === field.fieldKey ? (
                                            <Loader2 className="h-4 w-4 animate-spin text-gray-400 ml-auto" />
                                        ) : field.isSaved ? (
                                            <span className="text-green-600 text-xs font-bold flex items-center justify-end gap-1">
                                                <Check className="h-3 w-3" /> Salvato
                                            </span>
                                        ) : (
                                            <span className="text-gray-300 text-xs">Nuovo</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t p-5 bg-gray-50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
}
