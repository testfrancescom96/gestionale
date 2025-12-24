"use client";

import { useState } from "react";
import { X, Tag, Loader2 } from "lucide-react";

interface Coupon {
    id: number;
    code: string;
    amount: string;
    discount_type: 'percent' | 'fixed_cart' | 'fixed_product';
    description: string;
    date_expires: string | null;
    usage_count: number;
    usage_limit: number | null;
    usage_limit_per_user: number | null;
    individual_use: boolean;
    minimum_amount: string;
    free_shipping: boolean;
}

interface CouponModalProps {
    coupon: Coupon | null;
    onClose: (refresh?: boolean) => void;
}

export function CouponModal({ coupon, onClose }: CouponModalProps) {
    const isEditing = !!coupon;

    const [code, setCode] = useState(coupon?.code || '');
    const [discountType, setDiscountType] = useState<'percent' | 'fixed_cart' | 'fixed_product'>(coupon?.discount_type || 'percent');
    const [amount, setAmount] = useState(coupon?.amount || '');
    const [description, setDescription] = useState(coupon?.description || '');
    const [dateExpires, setDateExpires] = useState(
        coupon?.date_expires ? coupon.date_expires.split('T')[0] : ''
    );
    const [usageLimit, setUsageLimit] = useState(coupon?.usage_limit?.toString() || '');
    const [usageLimitPerUser, setUsageLimitPerUser] = useState(coupon?.usage_limit_per_user?.toString() || '');
    const [minimumAmount, setMinimumAmount] = useState(coupon?.minimum_amount || '');
    const [individualUse, setIndividualUse] = useState(coupon?.individual_use || false);
    const [freeShipping, setFreeShipping] = useState(coupon?.free_shipping || false);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code.trim()) {
            setError('Il codice coupon è obbligatorio');
            return;
        }

        setSaving(true);
        setError(null);

        const data = {
            code: code.toUpperCase(),
            discount_type: discountType,
            amount: amount || '0',
            description,
            date_expires: dateExpires ? new Date(dateExpires).toISOString() : null,
            usage_limit: usageLimit ? parseInt(usageLimit) : null,
            usage_limit_per_user: usageLimitPerUser ? parseInt(usageLimitPerUser) : null,
            minimum_amount: minimumAmount || '',
            individual_use: individualUse,
            free_shipping: freeShipping
        };

        try {
            const url = isEditing
                ? `/api/woocommerce/coupons/${coupon.id}`
                : '/api/woocommerce/coupons';

            const res = await fetch(url, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (result.error) {
                throw new Error(result.error);
            }

            onClose(true);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Errore nel salvataggio');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Tag className="h-5 w-5 text-purple-600" />
                        {isEditing ? 'Modifica Coupon' : 'Nuovo Coupon'}
                    </h2>
                    <button
                        onClick={() => onClose()}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Codice */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Codice Coupon *
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="ES: ESTATE2024"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono uppercase"
                            required
                        />
                    </div>

                    {/* Tipo Sconto */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tipo Sconto
                        </label>
                        <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value as typeof discountType)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                            <option value="percent">Percentuale (%)</option>
                            <option value="fixed_cart">Fisso Carrello (€)</option>
                            <option value="fixed_product">Fisso Prodotto (€)</option>
                        </select>
                    </div>

                    {/* Importo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Importo Sconto {discountType === 'percent' ? '(%)' : '(€)'}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={discountType === 'percent' ? '10' : '5.00'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>

                    {/* Descrizione */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descrizione
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Sconto promozionale estate 2024"
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>

                    {/* Data Scadenza */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data Scadenza
                        </label>
                        <input
                            type="date"
                            value={dateExpires}
                            onChange={(e) => setDateExpires(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Lascia vuoto per nessuna scadenza</p>
                    </div>

                    {/* Limiti Utilizzo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Limite Utilizzi Totale
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={usageLimit}
                                onChange={(e) => setUsageLimit(e.target.value)}
                                placeholder="Illimitato"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Limite per Utente
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={usageLimitPerUser}
                                onChange={(e) => setUsageLimitPerUser(e.target.value)}
                                placeholder="Illimitato"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                        </div>
                    </div>

                    {/* Minimo Ordine */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ordine Minimo (€)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={minimumAmount}
                            onChange={(e) => setMinimumAmount(e.target.value)}
                            placeholder="Nessun minimo"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                    </div>

                    {/* Checkbox Options */}
                    <div className="space-y-3 pt-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={individualUse}
                                onChange={(e) => setIndividualUse(e.target.checked)}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">
                                Uso individuale (non combinabile con altri coupon)
                            </span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={freeShipping}
                                onChange={(e) => setFreeShipping(e.target.checked)}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">
                                Spedizione gratuita
                            </span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => onClose()}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                            {saving ? 'Salvataggio...' : (isEditing ? 'Salva Modifiche' : 'Crea Coupon')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
