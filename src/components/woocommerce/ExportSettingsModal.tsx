
import { useState, useEffect } from "react";
import { Loader2, X, Save, Check, Plus } from "lucide-react";

interface FieldConfig {
    fieldKey: string;
    label: string;
    mappingType: string;
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

    const [newFieldKey, setNewFieldKey] = useState("");
    const [newFieldLabel, setNewFieldLabel] = useState("");

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

    const handleManualAdd = async () => {
        if (!newFieldKey || !newFieldLabel) return;
        await handleSave({
            fieldKey: newFieldKey,
            label: newFieldLabel,
            mappingType: 'COLUMN',
            isSaved: false
        });
        setNewFieldKey("");
        setNewFieldLabel("");
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
                            {/* Manual Add Section */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                                <p className="text-xs font-bold text-blue-800 uppercase mb-2">Aggiungi Campo Manualmente</p>
                                <div className="flex gap-3 items-end">
                                    <div className="flex-1">
                                        <label className="text-xs text-blue-600 mb-1 block">Chiave (es. pa_fermata)</label>
                                        <input
                                            type="text"
                                            value={newFieldKey}
                                            onChange={(e) => setNewFieldKey(e.target.value)}
                                            placeholder="chiave_campo"
                                            className="w-full text-sm border-blue-200 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs text-blue-600 mb-1 block">Etichetta (es. Fermata)</label>
                                        <input
                                            type="text"
                                            value={newFieldLabel}
                                            onChange={(e) => setNewFieldLabel(e.target.value)}
                                            placeholder="Nome visualizzato"
                                            className="w-full text-sm border-blue-200 rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                    <button
                                        onClick={handleManualAdd}
                                        disabled={!newFieldKey || !newFieldLabel}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Aggiungi
                                    </button>
                                </div>
                            </div>

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
                                        <select
                                            value={field.mappingType}
                                            onChange={(e) => handleSave({ ...field, mappingType: e.target.value })}
                                            className={`
                                                w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                                                ${field.mappingType === 'PARTENZA' ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' : ''}
                                                ${field.mappingType === 'HIDDEN' ? 'text-gray-400 bg-gray-50' : ''}
                                                ${field.mappingType === 'CF' ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold' : ''}
                                            `}
                                        >
                                            <option value="COLUMN">📊 Colonna Extra</option>
                                            <option value="PARTENZA">📍 Punto Partenza</option>
                                            <option value="CF">🆔 Codice Fiscale</option>
                                            <option value="ADDRESS">🏠 Indirizzo / Città</option>
                                            <option value="CAP">📮 CAP</option>
                                            <option value="NOTE">📝 Note</option>
                                            <option value="HIDDEN">🚫 Nascondi (Ignora)</option>
                                        </select>
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
