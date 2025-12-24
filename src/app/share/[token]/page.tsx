import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: PageProps) {
    const { token } = await params;

    // Find share by token
    const share = await prisma.sharedPassengerList.findUnique({
        where: { token },
        include: {
            product: {
                include: {
                    orderItems: {
                        include: { order: true }
                    },
                    manualBookings: true,
                    pricingRules: true
                }
            }
        }
    });

    if (!share) {
        notFound();
    }

    // Check expiration
    if (share.expiresAt && new Date() > share.expiresAt) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Link Scaduto</h1>
                    <p className="text-gray-600">Questo link di condivisione è scaduto. Contatta l'organizzatore per un nuovo link.</p>
                </div>
            </div>
        );
    }

    const product = share.product;
    const selectedColumns = JSON.parse(share.selectedColumns) as string[];

    // Build passenger rows (same logic as passenger-list API but simplified)
    const confirmedStatuses = ['processing', 'completed', 'on-hold'];
    const excludedStatuses = ['cancelled', 'refunded', 'failed', 'trash'];

    const rows: any[] = [];

    // Helpers
    const getMetaValue = (metaDataStr: string | null, key: string | undefined): string | null => {
        if (!metaDataStr || !key) return null;
        try {
            const meta = JSON.parse(metaDataStr);
            if (Array.isArray(meta)) {
                let match = meta.find((m: any) => (m.key === key) || (m.display_key === key));
                return match ? match.value || match.display_value : null;
            }
        } catch (e) { }
        return null;
    };

    const extractVariationKey = (metaDataStr: string | null): string | null => {
        if (!metaDataStr) return null;
        try {
            const meta = JSON.parse(metaDataStr);
            if (Array.isArray(meta)) {
                const serviceType = meta.find((m: any) => m.key === '_service_Tipologia biglietto');
                if (serviceType) return (serviceType.value || "").split('•')[0].trim();

                const wcpaType = meta.find((m: any) => m.key === 'Tipologia biglietto');
                if (wcpaType) {
                    let val = wcpaType.value || "";
                    val = val.replace(/\s*\([\d,.]+\s*€\)/g, '').trim();
                    return val.split('|')[0].trim();
                }

                const paKey = meta.find((m: any) => m.key.startsWith('pa_'));
                if (paKey) return paKey.value;
            }
        } catch (e) { }
        return null;
    };

    const calculateBalance = (variationKey: string | null, paidAmount: number) => {
        if (!variationKey) return { balance: 0, type: 'Standard' };
        // Flexible match
        const rule = product.pricingRules.find(r => r.identifier === variationKey || r.identifier.toLowerCase() === variationKey.toLowerCase());
        if (!rule) return { balance: 0, type: variationKey };
        const due = rule.fullPrice - paidAmount;
        const balance = Math.round(due * 100) / 100;
        return {
            balance: balance > 0.05 ? balance : 0,
            type: rule.nome || rule.type || rule.identifier
        };
    };

    // From orders
    for (const item of product.orderItems) {
        const order = item.order;
        if (!order || excludedStatuses.includes(order.status)) continue;

        const isConfirmed = confirmedStatuses.includes(order.status);

        // Calculate gross amount
        const importo = (() => {
            const netTotal = item.total || 0;
            const tax = (item.totalTax && item.totalTax > 0) ? item.totalTax : netTotal * 0.10;
            return Math.round((netTotal + tax) * 100) / 100;
        })();

        // Pricing Logic
        // For accurate per-pax balance, we need unit paid amount.
        // Usually item.quantity is the number of pax.
        const unitPaid = importo / (item.quantity || 1);
        const variationKey = extractVariationKey(item.metaData);
        const pricingInfo = calculateBalance(variationKey, unitPaid);

        rows.push({
            cognome: order.billingLastName || '',
            nome: order.billingFirstName || '',
            telefono: order.billingPhone || '',
            email: order.billingEmail || '',
            pax: item.quantity,
            importo: importo,
            acconto: 0,
            saldo: pricingInfo.balance * (item.quantity || 1), // Total balance
            ticketType: pricingInfo.type,
            isConfirmed,
            source: 'order'
        });
    }

    // From manual bookings
    for (const booking of product.manualBookings) {
        const importo = booking.importo || 0;
        const acconto = booking.acconto || 0;
        const saldo = importo - acconto;

        rows.push({
            cognome: booking.cognome,
            nome: booking.nome,
            telefono: booking.telefono || '',
            email: booking.email || '',
            puntoPartenza: booking.puntoPartenza || '',
            pax: booking.numPartecipanti,
            importo,
            acconto,
            saldo,
            isConfirmed: true,
            source: 'manual',
            ticketType: 'Manuale'
        });
    }

    // Sort by cognome
    rows.sort((a, b) => (a.cognome || '').localeCompare(b.cognome || ''));

    // Column definitions
    const columnDefs: Record<string, { header: string; renderFn?: (row: any) => string }> = {
        cognome: { header: 'Cognome' },
        nome: { header: 'Nome' },
        telefono: { header: 'Telefono' },
        email: { header: 'Email' },
        puntoPartenza: { header: 'Partenza' },
        pax: { header: 'Pax' },
        importo: { header: 'Importo', renderFn: (r) => `€${r.importo || 0}` },
        acconto: { header: 'Acconto', renderFn: (r) => `€${r.acconto || 0}` },
        saldo: { header: 'Saldo', renderFn: (r) => `€${r.saldo || 0}` },
        ticketType: { header: 'Tipo' },
    };

    // Filter columns based on selection and options
    let visibleColumns = selectedColumns.filter(c => columnDefs[c]);
    if (share.showSaldo && !visibleColumns.includes('saldo')) {
        visibleColumns.push('saldo');
    }
    // Auto-add type if saldo is shown or if useful? Let's just allow it via config, but maybe default it ON if not excluded?
    // Users select columns in admin. For now, if "ticketType" is in selectedColumns (from admin URL param logic which saves to DB), it shows.
    // But we might want to force show if needed.
    // Let's assume the user selects it. But wait, existing shares won't have 'ticketType' in JSON.
    // We should probably add it to the default set if they have "saldo" enabled?
    // Or just leave it as opt-in via the "columns" UI (which we need to check if supports dynamic keys).
    // The previous implementation used dynamic keys. Here we have a fixed set `columnDefs`.
    // I added `ticketType` to `columnDefs` so it's supported if selected.
    if (share.showAcconto && !visibleColumns.includes('acconto')) {
        visibleColumns.push('acconto');
    }

    const totalPax = rows.reduce((sum, r) => sum + (r.pax || 1), 0);
    const totalSaldo = rows.reduce((sum, r) => sum + (r.saldo || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-2xl font-bold">{product.name}</h1>
                    <p className="text-blue-100 mt-1">
                        {product.eventDate ? format(new Date(product.eventDate), 'EEEE dd MMMM yyyy', { locale: it }) : 'Data da definire'}
                    </p>
                    {share.nome && (
                        <p className="text-sm text-blue-200 mt-2">📋 {share.nome}</p>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                <div className="flex gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow px-4 py-3 flex-1 text-center">
                        <div className="text-2xl font-bold text-blue-600">{totalPax}</div>
                        <div className="text-xs text-gray-500">Partecipanti</div>
                    </div>
                    {share.showSaldo && (
                        <div className="bg-white rounded-lg shadow px-4 py-3 flex-1 text-center">
                            <div className={`text-2xl font-bold ${totalSaldo > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                €{totalSaldo}
                            </div>
                            <div className="text-xs text-gray-500">Saldo Totale</div>
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">#</th>
                                    {visibleColumns.map(col => (
                                        <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                                            {columnDefs[col]?.header || col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {rows.map((row, idx) => (
                                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                                        {visibleColumns.map(col => {
                                            const def = columnDefs[col];
                                            const value = def?.renderFn ? def.renderFn(row) : row[col] || '';
                                            return (
                                                <td key={col} className="px-4 py-3 text-gray-800">
                                                    {value}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-6">
                    Generato da Go on the Road • Aggiornato in tempo reale
                </p>
            </div>
        </div>
    );
}
