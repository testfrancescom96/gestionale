
import { useState, useEffect, useMemo } from "react";
import { Loader2, X, Save, Check, Plus, Search, Filter, RefreshCw, Eye, EyeOff, CheckSquare, Square } from "lucide-react";

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
    const [saving, setSaving] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState<'ALL' | 'VISIBLE' | 'HIDDEN'>('ALL');

    const [newFieldKey, setNewFieldKey] = useState("");
    const [newFieldLabel, setNewFieldLabel] = useState("");

    useEffect(() => {
        if (isOpen) fetchFields();
    }, [isOpen]);

    const fetchFields = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/woocommerce/config/fields`);
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
                // Optimistic Update
                setFields(prev => prev.map(f => f.fieldKey === field.fieldKey ? { ...field, isSaved: true } : f));
                // fetchFields(); // Refresh to be safe? Maybe not needed for every save
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(null);
        }
    };

    // Derived State
    const filteredFields = useMemo(() => {
        return fields.filter(f => {
            const matchesSearch = f.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                f.fieldKey.toLowerCase().includes(searchTerm.toLowerCase());

            const isHidden = f.mappingType === 'HIDDEN';
            const matchesTab =
                activeTab === 'ALL' ? true :
                    activeTab === 'VISIBLE' ? !isHidden :
                        activeTab === 'HIDDEN' ? isHidden : true;

            return matchesSearch && matchesTab;
        });
    }, [fields, searchTerm, activeTab]);

    const visibleCount = fields.filter(f => f.mappingType !== 'HIDDEN').length;
    const hiddenCount = fields.filter(f => f.mappingType === 'HIDDEN').length;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between border-b p-5 bg-gray-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Filter className="h-5 w-5 text-blue-600" />
                            Gestione Campi e Colonne
                        </h2>
                        <p className="text-sm text-gray-500">Configura quali dati includere nel foglio Excel e nell'anteprima.</p>
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            I campi si aggiornano automaticamente durante la sincronizzazione prodotti/ordini
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href="/api/woocommerce/config/analyze"
                            target="_blank"
                            download
                            className="text-xs flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-200 rounded hover:bg-green-100 text-green-700 transition-colors"
                            title="Scarica un CSV con l'elenco di TUTTI i campi trovati nel database"
                        >
                            <span className="font-bold">CSV</span> Report Campi
                        </a>
                        <div className="h-6 w-px bg-gray-300 mx-1"></div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b flex flex-col md:flex-row gap-4 justify-between bg-white items-center">
                    {/* Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-lg">
                        <button
                            onClick={() => setActiveTab('ALL')}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'ALL' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Tutti ({fields.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('VISIBLE')}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'VISIBLE' ? 'bg-white shadow text-green-700' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Visibili ({visibleCount})
                        </button>
                        <button
                            onClick={() => setActiveTab('HIDDEN')}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'HIDDEN' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Nascosti ({hiddenCount})
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cerca campo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                    {loading && fields.length === 0 ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                        </div>
                    ) : fields.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-lg border border-dashed">
                            <p className="text-gray-500">Nessun campo trovato.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Manual Add - Compact */}
                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 flex gap-2 items-center">
                                <Plus className="h-4 w-4 text-blue-600" />
                                <input
                                    type="text"
                                    value={newFieldKey}
                                    onChange={(e) => setNewFieldKey(e.target.value)}
                                    placeholder="Chiave (es. pa_fermata)"
                                    className="flex-1 text-xs border-blue-200 rounded px-2 py-1.5"
                                />
                                <input
                                    type="text"
                                    value={newFieldLabel}
                                    onChange={(e) => setNewFieldLabel(e.target.value)}
                                    placeholder="Etichetta"
                                    className="flex-1 text-xs border-blue-200 rounded px-2 py-1.5"
                                />
                                <button
                                    onClick={handleManualAdd}
                                    disabled={!newFieldKey || !newFieldLabel}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Aggiungi
                                </button>
                            </div>

                            {/* List */}
                            <div className="bg-white border rounded-lg shadow-sm divide-y">
                                <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-100 text-xs font-bold text-gray-500 uppercase">
                                    <div className="col-span-4">Nome Colonna / Chiave Woo</div>
                                    <div className="col-span-4">Alias (Unisci con altra chiave)</div>
                                    <div className="col-span-1 text-center">Visibile</div>
                                    <div className="col-span-1 text-center" title="Pre-selezionato di default nella lista passeggeri">Pre-sel</div>
                                    <div className="col-span-2 text-right">Stato</div>
                                </div>

                                {filteredFields.map((field) => (
                                    <div key={field.fieldKey} className="grid grid-cols-12 gap-4 items-center px-4 py-3 hover:bg-gray-50 transition-colors">

                                        {/* Name & Key */}
                                        <div className="col-span-4 overflow-hidden">
                                            <input
                                                type="text"
                                                value={field.label}
                                                onChange={(e) => {
                                                    const newFields = fields.map(f => f.fieldKey === field.fieldKey ? { ...f, label: e.target.value } : f);
                                                    setFields(newFields);
                                                }}
                                                onBlur={() => handleSave(field)}
                                                className="block w-full text-sm font-bold text-gray-900 border border-gray-200 rounded px-2 py-1 bg-white hover:border-blue-300 focus:ring-1 focus:ring-blue-500 mb-1"
                                                placeholder="Nome colonna export"
                                            />
                                            <div className="text-[10px] text-gray-400 font-mono truncate px-1 flex items-center gap-1">
                                                <span className="font-semibold text-gray-300">KEY:</span> {field.fieldKey}
                                            </div>
                                        </div>

                                        {/* Alias Field - for merging duplicate keys */}
                                        <div className="col-span-4">
                                            <input
                                                type="text"
                                                value={(field as any).aliasOf || ""}
                                                onChange={(e) => {
                                                    const newFields = fields.map(f => f.fieldKey === field.fieldKey ? { ...f, aliasOf: e.target.value } : f);
                                                    setFields(newFields as any);
                                                }}
                                                onBlur={() => handleSave({ ...field, aliasOf: (field as any).aliasOf } as any)}
                                                className="block w-full text-xs text-gray-600 border border-gray-200 rounded px-2 py-1.5 bg-gray-50 hover:border-blue-300 focus:ring-1 focus:ring-blue-500"
                                                placeholder="Es: pa_fermata (se duplicato)"
                                                title="Se questo campo è uguale a un altro, scrivi qui la chiave principale"
                                            />
                                        </div>

                                        {/* Visibility Toggle */}
                                        <div className="col-span-1 flex justify-center">
                                            <button
                                                onClick={() => handleSave({
                                                    ...field,
                                                    mappingType: field.mappingType === 'HIDDEN' ? 'COLUMN' : 'HIDDEN'
                                                })}
                                                className={`p-1.5 rounded-md transition-colors ${field.mappingType === 'HIDDEN' ? 'text-gray-300 hover:bg-gray-100' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}
                                                title={field.mappingType === 'HIDDEN' ? 'Campo nascosto' : 'Campo visibile'}
                                            >
                                                {field.mappingType === 'HIDDEN' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>

                                        {/* Default Selected Toggle */}
                                        <div className="col-span-1 flex justify-center">
                                            <button
                                                onClick={() => handleSave({
                                                    ...field,
                                                    isDefaultSelected: !(field as any).isDefaultSelected
                                                } as any)}
                                                className={`p-1.5 rounded-md transition-colors ${(field as any).isDefaultSelected ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-300 hover:bg-gray-100'}`}
                                                title={(field as any).isDefaultSelected ? 'Pre-selezionato di default' : 'Non pre-selezionato'}
                                            >
                                                {(field as any).isDefaultSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                                            </button>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-1 text-right">
                                            {saving === field.fieldKey ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-gray-400 ml-auto" />
                                            ) : field.isSaved ? (
                                                <span className="text-green-600 text-[10px] font-bold">✓</span>
                                            ) : (
                                                <span className="text-gray-300 text-[10px]">•</span>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {filteredFields.length === 0 && (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        Nessun campo corrisponde ai criteri di ricerca.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t p-4 bg-white rounded-b-xl flex justify-between items-center text-xs text-gray-400">
                    <div>
                        Totale campi: {fields.length}
                    </div>
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
