
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
            // 1. Fetch global config for visibility settings
            const configRes = await fetch("/api/woocommerce/config/fields");
            const globalConfig = await configRes.json();

            // Create a map of hidden keys
            const hiddenKeys = new Set(
                globalConfig
                    .filter((f: any) => f.mappingType === 'HIDDEN')
                    .map((f: any) => f.fieldKey)
            );

            // Create a map of key -> label from global config
            const keyLabelMap = new Map<string, string>();
            const displayOrderMap = new Map<string, number>();
            globalConfig.forEach((f: any) => {
                keyLabelMap.set(f.fieldKey, f.label);
                displayOrderMap.set(f.fieldKey, f.displayOrder ?? 100);
            });

            // 2. Fetch fields actually present in THIS product's orders
            const productFieldsRes = await fetch(`/api/woocommerce/products/${productId}/fields`);
            const productFields = await productFieldsRes.json();

            // 3. Filter: only show fields that exist in this product AND are not hidden
            // Sort by displayOrder from global config
            const relevantFields = productFields
                .filter((f: any) => !hiddenKeys.has(f.fieldKey))
                .map((f: any) => ({
                    ...f,
                    // Use global label if exists, otherwise use discovered label
                    label: keyLabelMap.get(f.fieldKey) || f.label || f.fieldKey,
                    displayOrder: displayOrderMap.get(f.fieldKey) ?? 100
                }))
                .sort((a: any, b: any) => (a.displayOrder - b.displayOrder) || a.label.localeCompare(b.label));

            setAvailableFields(relevantFields);

            // Default: Select fields marked as isDefaultSelected in global config
            const defaultSelectedKeys = new Set<string>(
                globalConfig
                    .filter((f: any) => f.isDefaultSelected === true)
                    .map((f: any) => f.fieldKey)
            );

            // Apply: Only select fields that exist in this product AND are marked as default
            const initialSelection = new Set<string>(
                relevantFields
                    .filter((f: any) => defaultSelectedKeys.has(f.fieldKey))
                    .map((f: any) => String(f.fieldKey))
            );

            // If no default fields configured, fall back to first 5 fields
            if (initialSelection.size === 0 && relevantFields.length > 0) {
                relevantFields.slice(0, 5).forEach((f: any) => initialSelection.add(String(f.fieldKey)));
            }

            setSelectedFields(initialSelection);

            // 4. Fetch Preview with selected fields only
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
                                    {(() => {
                                        let currentGroupIndex = 0;
                                        let lastOrderId: number | null = null;
                                        let lastSource: string | null = null;

                                        return data.rows.map((row: any, idx: number) => {
                                            const isManual = row.source === 'manual';
                                            const isOrder = row.source === 'order';

                                            // Determine if new group
                                            let isNewGroup = true;
                                            if (idx > 0) {
                                                if (isOrder && lastSource === 'order' && row.orderId === lastOrderId) {
                                                    isNewGroup = false;
                                                }
                                                // Groups split by logic are already sorted together.
                                                // BUT if sorted by Pickup, a single order might be split.
                                                // In that case, we treat them as separate visual blocks? 
                                                // Logic: If orderId changes, new group. If orderId same but row is next, same group.
                                            }

                                            if (isNewGroup) {
                                                currentGroupIndex++;
                                                lastOrderId = row.orderId;
                                                lastSource = row.source;
                                            }

                                            // Styling - More EVIDENT group coloring
                                            // Manual: Purple tint
                                            // Orders: Alternating Blue/Yellow blocks by GROUP for high visibility
                                            // Non-confirmed: Red tint with line-through
                                            const isNotConfirmed = row.isConfirmed === false;
                                            let bgClass = isManual
                                                ? 'bg-purple-100'
                                                : (currentGroupIndex % 2 === 0 ? 'bg-blue-50' : 'bg-amber-50');

                                            if (isNotConfirmed) {
                                                bgClass = 'bg-red-100 opacity-60';
                                            }

                                            // Border: Thicker top border for new groups - more visible
                                            const borderClass = isNewGroup && idx > 0 ? 'border-t-4 border-gray-400' : '';
                                            const textClass = isNotConfirmed ? 'text-red-600 line-through' : '';

                                            return (
                                                <tr key={idx} className={`hover:bg-blue-50/30 transition-colors ${bgClass} ${borderClass} ${textClass}`}>
                                                    {data.columns.map((col: any) => {
                                                        let val = row[col.key];
                                                        // Handle dynamic props
                                                        if (col.isDynamic) {
                                                            val = row.dynamic?.[col.key];
                                                        }

                                                        // Visual cue for grouping: Hide repeated Order ID or Name? 
                                                        // Maybe just use the color block. 
                                                        // Let's keep it simple: Color block + Border.

                                                        return (
                                                            <td key={col.key} className="px-4 py-3 text-gray-700">
                                                                {/* Optional: Add connection line for same group in first col? */}
                                                                {val || '-'}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        });
                                    })()}
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
