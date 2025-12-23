
import { useState, useEffect, useMemo } from "react";
import { Loader2, X, Download, CheckSquare, Square, RefreshCw, LayoutGrid, LayoutList, Share2, Link, Copy, Check, Settings, FileText } from "lucide-react";
import PricingManagerModal from "./PricingManagerModal";

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
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    // Display mode: 'headers' = header row per room (B), 'compact' = first row only (A)
    const [roomDisplayMode, setRoomDisplayMode] = useState<'headers' | 'compact'>('headers');
    // Share state
    const [showSharePanel, setShowSharePanel] = useState(false);
    const [shareUrl, setShareUrl] = useState<string | null>(null);
    const [sharing, setSharing] = useState(false);
    const [copied, setCopied] = useState(false);
    // Pricing modal state
    const [showPricingModal, setShowPricingModal] = useState(false);

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

    const handleDownloadPDF = async () => {
        setDownloadingPDF(true);
        try {
            // Use POST method and send data from frontend
            const url = `/api/woocommerce/products/${productId}/export-pdf`;

            // FIXED: Get all passengers from the data - API returns 'rows' not 'passengers'
            const passengers = data?.rows || [];

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passengers,
                    productName: data?.productName,
                    eventDate: data?.eventDate,
                    columns: Array.from(selectedFields)
                })
            });

            if (response.ok) {
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `Lista_Passeggeri_${data?.productName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Event'}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(downloadUrl);
                a.remove();
            } else {
                const errorData = await response.json().catch(() => ({}));
                alert(`Errore: ${errorData.error || 'Generazione PDF fallita'}`);
            }
        } catch (error) {
            console.error("PDF Download error:", error);
            alert("Errore durante il download del PDF");
        } finally {
            setDownloadingPDF(false);
        }
    };

    // Handle share link generation
    const handleShare = async () => {
        setSharing(true);
        try {
            const columnsToShare = Array.from(selectedFields);
            const res = await fetch('/api/woocommerce/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId,
                    selectedColumns: columnsToShare,
                    showSaldo: false,
                    expiresInDays: 30
                })
            });

            if (res.ok) {
                const { shareUrl: url } = await res.json();
                setShareUrl(url);
                setShowSharePanel(true);
            } else {
                alert('Errore nella generazione del link');
            }
        } catch (error) {
            console.error('Share error:', error);
            alert('Errore nella generazione del link');
        } finally {
            setSharing(false);
        }
    };

    // Copy URL to clipboard
    const copyToClipboard = async () => {
        if (shareUrl) {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = shareUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
    };

    // Sort columns based on availableFields displayOrder
    const sortedColumns = useMemo(() => {
        if (!data?.columns) return [];

        // Create order map from availableFields
        const orderMap = new Map<string, number>();
        availableFields.forEach((f, idx) => {
            orderMap.set(f.fieldKey, f.displayOrder ?? 100);
        });

        // Fixed order for base columns: num always first, then cognome, then nome
        const fixedOrder: Record<string, number> = {
            'num': -10,      // Always first
            'cognome': -2,   // Second
            'nome': -1,      // Third
        };

        // Sort columns by fixed order, then displayOrder, then alphabetically
        return [...data.columns].sort((a: any, b: any) => {
            const fixedA = fixedOrder[a.key];
            const fixedB = fixedOrder[b.key];

            // If both have fixed order, use that
            if (fixedA !== undefined && fixedB !== undefined) {
                return fixedA - fixedB;
            }
            // If only one has fixed order, it comes first
            if (fixedA !== undefined) return -1;
            if (fixedB !== undefined) return 1;

            // Otherwise use displayOrder then alphabetical
            const orderA = orderMap.get(a.key) ?? 100;
            const orderB = orderMap.get(b.key) ?? 100;
            return (orderA - orderB) || a.header.localeCompare(b.header);
        });
    }, [data, availableFields]);

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
                            onClick={() => setShowPricingModal(true)}
                            className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 font-medium transition-colors"
                        >
                            <Settings className="h-4 w-4" />
                            Tariffe
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={sharing || loading}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50"
                        >
                            {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
                            Condividi
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={downloading || loading}
                            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
                        >
                            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            Scarica Excel
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            disabled={downloadingPDF || loading}
                            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
                        >
                            {downloadingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                            Scarica PDF
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

                    {/* Display Mode Toggle - only show if there are room groups */}
                    {data?.rows?.some((r: any) => r.roomIndex !== undefined) && (
                        <div className="flex items-center gap-1 ml-4 border-l pl-4">
                            <span className="text-xs text-gray-400 mr-1">Vista:</span>
                            <button
                                onClick={() => setRoomDisplayMode('headers')}
                                className={`p-1.5 rounded transition-colors ${roomDisplayMode === 'headers' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
                                title="Vista con intestazioni camere"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setRoomDisplayMode('compact')}
                                className={`p-1.5 rounded transition-colors ${roomDisplayMode === 'compact' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
                                title="Vista compatta"
                            >
                                <LayoutList className="h-4 w-4" />
                            </button>
                        </div>
                    )}

                    <div className="ml-auto text-xs text-gray-400 italic">
                        * Aggiungi campi in Impostazioni ⚙️
                    </div>
                </div>

                {/* Share Panel */}
                {showSharePanel && shareUrl && (
                    <div className="px-6 py-4 border-b bg-indigo-50">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2 bg-white border border-indigo-200 rounded-lg p-2">
                                <Link className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={shareUrl}
                                    readOnly
                                    className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                                />
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${copied
                                    ? 'bg-green-600 text-white'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                            >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copied ? 'Copiato!' : 'Copia'}
                            </button>
                            <a
                                href={shareUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-800 text-sm underline"
                            >
                                Apri
                            </a>
                            <button
                                onClick={() => setShowSharePanel(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-xs text-indigo-600 mt-2">
                            ✨ Questo link mostra una versione pubblica della lista con i campi selezionati. Valido per 30 giorni.
                        </p>
                    </div>
                )}

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
                                        {sortedColumns.map((col: any) => (
                                            <th key={col.key} className="px-4 py-3 border-b">{col.header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(() => {
                                        let currentGroupIndex = 0;
                                        let lastOrderId: number | null = null;
                                        let lastSource: string | null = null;
                                        let lastRoomIndex: number | null = null;

                                        return data.rows.map((row: any, idx: number) => {
                                            const isManual = row.source === 'manual';
                                            const isOrder = row.source === 'order';
                                            const hasRoomIndex = row.roomIndex !== undefined;

                                            // Determine if new group
                                            // For room products: new room = new group
                                            // For regular products: new order = new group
                                            let isNewGroup = true;
                                            if (idx > 0) {
                                                if (hasRoomIndex && lastOrderId === row.orderId && lastRoomIndex === row.roomIndex) {
                                                    // Same room in same order
                                                    isNewGroup = false;
                                                } else if (!hasRoomIndex && isOrder && lastSource === 'order' && row.orderId === lastOrderId) {
                                                    // Same order (regular product)
                                                    isNewGroup = false;
                                                }
                                            }

                                            if (isNewGroup) {
                                                currentGroupIndex++;
                                                lastOrderId = row.orderId;
                                                lastSource = row.source;
                                                lastRoomIndex = row.roomIndex ?? null;
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
                                            const borderClass = isNewGroup && idx > 0 && roomDisplayMode !== 'headers' ? 'border-t-4 border-gray-400' : '';
                                            const textClass = isNotConfirmed ? 'text-red-600 line-through' : '';

                                            // Build rows array (may include header row)
                                            const rows = [];

                                            // Add header row for room groups in 'headers' mode
                                            if (roomDisplayMode === 'headers' && hasRoomIndex && isNewGroup) {
                                                // Extract room type from note (e.g., "Ordine #41474 - Camera 1")
                                                const roomTypeMatch = row.note?.match(/Camera (\d+)/);
                                                const roomNumber = roomTypeMatch ? roomTypeMatch[1] : (row.roomIndex + 1);

                                                // Try to get room type from product name or dynamic fields
                                                let roomType = row.dynamic?.['Tipologia camera'] || '';
                                                if (!roomType) {
                                                    // Guess from context - check if product name has camera type
                                                    const types = ['Singola', 'Doppia', 'Tripla', 'Quadrupla', 'Quintupla'];
                                                    for (const t of types) {
                                                        if (row.note?.toLowerCase().includes(t.toLowerCase())) {
                                                            roomType = t;
                                                            break;
                                                        }
                                                    }
                                                }

                                                rows.push(
                                                    <tr key={`header-${idx}`} className="bg-gray-200 border-t-2 border-gray-400">
                                                        <td colSpan={sortedColumns.length} className="px-4 py-2">
                                                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                                                <span className="text-lg">🏨</span>
                                                                <span>Camera {roomNumber}</span>
                                                                {roomType && <span className="text-indigo-600">- {roomType}</span>}
                                                                <span className="text-gray-400 font-normal ml-2">(Ordine #{row.orderId})</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            // Add data row
                                            rows.push(
                                                <tr key={idx} className={`hover:bg-blue-50/30 transition-colors ${bgClass} ${borderClass} ${textClass}`}>
                                                    {sortedColumns.map((col: any) => {
                                                        let val = row[col.key];
                                                        // Handle dynamic props
                                                        if (col.isDynamic) {
                                                            val = row.dynamic?.[col.key];
                                                        }

                                                        // In headers mode, skip showing room type in data cells (it's in header)
                                                        if (roomDisplayMode === 'headers' && hasRoomIndex &&
                                                            (col.key === 'Tipologia camera' || col.header === 'Tipologia camera')) {
                                                            val = '';
                                                        }

                                                        return (
                                                            <td key={col.key} className="px-4 py-3 text-gray-700">
                                                                {val || '-'}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );

                                            return rows;
                                        }).flat();
                                    })()}
                                    {data.rows.length === 0 && (
                                        <tr>
                                            <td colSpan={sortedColumns.length} className="px-4 py-8 text-center text-gray-500 italic">
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

            {/* Pricing Manager Modal */}
            <PricingManagerModal
                productId={productId}
                productName={data?.productName || ""}
                isOpen={showPricingModal}
                onClose={() => setShowPricingModal(false)}
            />
        </div>
    );
}
