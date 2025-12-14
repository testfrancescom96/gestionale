import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Calendar, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function ScadenzarioPage() {
    const today = new Date();

    // Recupera pratiche con data partenza futura
    const praticheInScadenza = await prisma.pratica.findMany({
        where: {
            OR: [
                { dataPartenza: { gte: today } },
                { dataRitorno: { gte: today } }
            ],
            NOT: {
                stato: "ANNULLATA"
            }
        },
        include: {
            cliente: true,
        },
        orderBy: {
            dataPartenza: 'asc',
        },
        take: 50,
    });

    return (
        <div className="p-8">
            <h1 className="mb-6 text-3xl font-bold text-gray-900">Scadenzario</h1>

            <div className="grid gap-6">
                <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                    <div className="mb-4 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Prossime Partenze e Rientri</h2>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Data
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Destinazione
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Stato Pagamento
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Azioni
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {praticheInScadenza.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                            Nessuna scadenza imminente trovata
                                        </td>
                                    </tr>
                                ) : (
                                    praticheInScadenza.map((pratica) => {
                                        const isPartenza = pratica.dataPartenza && new Date(pratica.dataPartenza) >= today;
                                        const dataRiferimento = isPartenza ? pratica.dataPartenza : pratica.dataRitorno;

                                        return (
                                            <tr key={pratica.id} className="hover:bg-gray-50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                    {dataRiferimento ? format(new Date(dataRiferimento), "d MMMM yyyy", { locale: it }) : "N/A"}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isPartenza ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                                                        }`}>
                                                        {isPartenza ? "Partenza" : "Rientro"}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                                                    {pratica.cliente ? `${pratica.cliente.nome} ${pratica.cliente.cognome}` : "N/A"}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                    {pratica.destinazione}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    {pratica.importoSaldo && pratica.importoSaldo > 0 ? (
                                                        <span className="flex items-center gap-1 text-red-600 font-medium">
                                                            <AlertCircle className="h-4 w-4" />
                                                            Saldo: € {pratica.importoSaldo.toFixed(2)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-green-600 font-medium">Saldato</span>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                                    <Link
                                                        href={`/pratiche/${pratica.id}`}
                                                        className="text-blue-600 hover:text-blue-900"
                                                    >
                                                        Dettagli
                                                    </Link>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
