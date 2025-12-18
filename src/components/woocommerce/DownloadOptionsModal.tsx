
import { useState, useEffect } from "react";
import { Loader2, X, Download, CheckSquare, Square } from "lucide-react";

interface FieldConfig {
    fieldKey: string;
    label: string;
    mappingType: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    productName: string;
    onConfirm: (selectedColumns: string[]) => void;
}

export function DownloadOptionsModal({ isOpen, onClose, productName, onConfirm }: Props) {
    const [fields, setFields] = useState<FieldConfig[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchFields();
        }
    }, [isOpen]);

    const fetchFields = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/woocommerce/config/fields");
            const data: FieldConfig[] = await res.json();

            // Filter only "interesting" fields (exclude HIDDEN)
            const visibleFields = data.filter(f => f.mappingType !== 'HIDDEN' && f.mappingType !== 'COLUMN');
            // Actually, include COLUMN too, everything except HIDDEN.
            // But wait, the API returns *all* found fields. 
            // We only want to offer customization for fields that are actually CONFIGURED or at least relevant?
            // User said "Customize per list". So maybe list ALL Configured fields (CF, Address, Partenza, CAP, Column).
            // Unconfigured fields (default COLUMN?) might be too many. 
            // Let's filter for fields that are explicitly saved or have a mappingType other than HIDDEN.

            const options = data.filter(f => f.mappingType !== 'HIDDEN');
            setFields(options);

            // Default: Select all of them
            setSelected(new Set(options.map(f => f.fieldKey)));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggle = (key: string) => {
        const next = new Set(selected);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setSelected(next);
    };

    const handleDownload = () => {
        onConfirm(Array.from(selected));
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between border-b p-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Opzioni Esportazione</h2>
                        <p className="text-xs text-gray-500 truncate max-w-[300px]">{productName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-4 bg-yellow-50 text-yellow-800 text-xs border-b border-yellow-100">
                    Seleziona le colonne da includere in questo file Excel.
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {/* Standard Static Options (maybe in future) */}
                            {/* <div className="px-3 py-2 flex items-center gap-3 opacity-50 cursor-not-allowed">
                                <CheckSquare className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium">Nome, Cognome, Telefono, Pax</span>
                            </div> */}

                            {fields.map(field => {
                                const isSelected = selected.has(field.fieldKey);
                                return (
                                    <div
                                        key={field.fieldKey}
                                        onClick={() => toggle(field.fieldKey)}
                                        className={`
                                            flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer transition-colors border
                                            ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-gray-50'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isSelected ? (
                                                <CheckSquare className="h-5 w-5 text-blue-600" />
                                            ) : (
                                                <Square className="h-5 w-5 text-gray-300" />
                                            )}
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">{field.label}</div>
                                                <div className="text-[10px] text-gray-400 uppercase">{field.mappingType}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {fields.length === 0 && (
                                <div className="text-center py-4 text-gray-400 text-sm">
                                    Nessun campo opzionale configurato.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="border-t p-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg text-sm"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm shadow-sm"
                    >
                        <Download className="h-4 w-4" />
                        Scarica Excel
                    </button>
                </div>
            </div>
        </div>
    );
}
