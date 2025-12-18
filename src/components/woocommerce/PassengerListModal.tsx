
import { useState, useEffect } from "react";
import { Loader2, X, Download, CheckSquare, Square, RefreshCw } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    productId: number;
}

export function PassengerListModal({ isOpen, onClose, productId }: Props) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [availableFields, setAvailableFields] = useState<any[]>([]);
    const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
    const [previewKey, setPreviewKey] = useState(0); // Force re-fetch
    const [downloading, setDownloading] = useState(false);

    // Initial Fetch (Config + Minimal Data)
    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen, productId]);

    // Fetch when selection changes (to get values for new cols)
    useEffect(() => {
        if (!isOpen) return;
        // Debounce? Maybe not needed if local filter.
        // Wait, the API returns data dynamic based on columns.
        // So yes, we need to refetch if we want to see the new columns POPULATED.
        // BUT, ideally we fetch ALL Configured columns once, and then just hide/show in UI?
        // No, standard flow: user selects col -> we might need to fetch if not already there.
        // Let's do: Fetch Config First > Let user select > Fetch Preview Data.

        // Actually simplest flow:
        // 1. Fetch available fields config.
        // 2. Default Select All (or saved).
        // 3. Fetch Preview Table with those columns.
    }, [isOpen]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Config Fields
            const configRes = await fetch("/api/woocommerce/config/fields");
            const fieldsConfig = await configRes.json();

            // Filter fields
            const relevantFields = fieldsConfig.filter((f: any) => f.mappingType !== 'HIDDEN');
            setAvailableFields(relevantFields);

            // Default: Select all relevant fields
            const initialSelection = new Set(relevantFields.map((f: any) => f.fieldKey));
            setSelectedFields(initialSelection);

            // 2. Fetch Preview with all fields
            await fetchPreview(initialSelection);

        } catch (error) {
            console.error("Error init:", error);
        }
    };

    const fetchPreview = async (currentSelection: Set<string>) => {
        setLoading(true);
        try {
            const columnsParam = Array.from(currentSelection).join(',');
            const res = await fetch(`/api/woocommerce/products/${productId}/passenger-list?format=json&columns=${columnsParam}`);
            const jsonData = await res.json();
            setData(jsonData);
        } catch (error) {
            console.error("Error fetching preview:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleField = (key: string) => {
        const next = new Set(selectedFields);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        setSelectedFields(next);

        // Refresh Preview
        fetchPreview(next);
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const columnsParam = Array.from(selectedFields).join(',');
            const url = `/api/woocommerce/products/${productId}/passenger-list?columns=${columnsParam}`; // No format=json -> Excel

            const response = await fetch(url);
            if (response.ok) {
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `Lista_Passeggeri_${data?.productName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Event'}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(downloadUrl);
                a.remove();
            }
        } catch (error) {
            console.error("Download error:", error);
            alert("Errore durante il download");
        } finally {
            setDownloading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between border-b px-6 py-4 bg-gray-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Lista Passeggeri</h2>
                        {data && (
                            <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                <span className="font-medium text-gray-700">{data.productName}</span>
                                <span>•</span>
                                <span>{data.eventDate}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownload}
                            disabled={downloading || loading}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
                        >
                            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            Scarica Excel
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <X className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Toolbar (Toggles) */}
                <div className="px-6 py-3 border-b bg-white flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase mr-2">Campi:</span>
                    {availableFields.map(field => {
                        const isSelected = selectedFields.has(field.fieldKey);
                        return (
                            <button
                                key={field.fieldKey}
                                onClick={() => toggleField(field.fieldKey)}
                                className={`
                                    flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors border
                                    ${isSelected
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                                    }
                                `}
                            >
                                {isSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                                {field.label}
                            </button>
                        );
                    })}
                    <div className="ml-auto text-xs text-gray-400 italic">
                        * Aggiungi campi in Impostazioni ⚙️
                    </div>
                </div>

                {/* Body (Table Preview) */}
                <div className="flex-1 overflow-auto bg-gray-50 p-6">
                    {loading && !data ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                    ) : data ? (
                        <div className="bg-white rounded-lg shadow border overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold">
                                    <tr>
                                        {data.columns.map((col: any) => (
                                            <th key={col.key} className="px-4 py-3 border-b">{col.header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.rows.map((row: any, idx: number) => {
                                        const isManual = row.source === 'manual';
                                        return (
                                            <tr key={idx} className={`hover:bg-gray-50 ${isManual ? 'bg-purple-50/50' : ''}`}>
                                                {data.columns.map((col: any) => {
                                                    let val = row[col.key];
                                                    // Handle dynamic props
                                                    if (col.isDynamic) {
                                                        val = row.dynamic?.[col.key];
                                                    }
                                                    return (
                                                        <td key={col.key} className="px-4 py-3 text-gray-700">
                                                            {val || '-'}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                    {data.rows.length === 0 && (
                                        <tr>
                                            <td colSpan={data.columns.length} className="px-4 py-8 text-center text-gray-500 italic">
                                                Nessun passeggero trovato.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
