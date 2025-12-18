import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building, Phone, Mail, MapPin, FileText, Calendar, Euro, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

async function getFornitore(id: string) {
    const fornitore = await prisma.fornitore.findUnique({
        where: { id },
        include: {
            servizi: true,
            costi: {
                include: {
                    pratica: {
                        include: { cliente: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            },
            pratiche: {
                include: { cliente: true },
                orderBy: { dataPartenza: 'desc' },
                take: 50
            },
            _count: {
                select: { pratiche: true, costi: true }
            }
        }
    });

    if (!fornitore) notFound();
    return fornitore;
}

export default async function DettaglioFornitorePage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params;
    const fornitore = await getFornitore(id);

    // Calcola totale fatturato da questo fornitore
    const totaleAcquisti = fornitore.costi.reduce((sum, c) => sum + (c.importo || 0), 0);

    // Unisci pratiche da costi e pratiche dirette (evita duplicati)
    const praticheIds = new Set<string>();
    const allViaggi: any[] = [];

    fornitore.costi.forEach(costo => {
        if (costo.pratica && !praticheIds.has(costo.pratica.id)) {
            praticheIds.add(costo.pratica.id);
            allViaggi.push({
                ...costo.pratica,
                costoFornitore: costo.importo,
                tipologiaCosto: costo.tipologia
            });
        }
    });

    fornitore.pratiche.forEach(pratica => {
        if (!praticheIds.has(pratica.id)) {
            praticheIds.add(pratica.id);
            allViaggi.push(pratica);
        }
    });

    // Ordina per data partenza desc
    allViaggi.sort((a, b) => {
        const dateA = a.dataPartenza ? new Date(a.dataPartenza).getTime() : 0;
        const dateB = b.dataPartenza ? new Date(b.dataPartenza).getTime() : 0;
        return dateB - dateA;
    });

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/fornitori" className="rounded-full bg-gray-100 p-2 hover:bg-gray-200">
                        <ArrowLeft className="h-6 w-6 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {fornitore.nomeComune || fornitore.ragioneSociale}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {fornitore.tipoFornitore} • P.IVA: {fornitore.partitaIVA || "N/D"}
                        </p>
                    </div>
                </div>
                <Link
                    href={`/fornitori/${id}/edit`}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                    <Edit2 className="h-4 w-4" />
                    Modifica
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Sidebar Info */}
                <div className="space-y-6">
                    {/* Dati Anagrafici */}
                    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                        <h3 className="mb-4 font-semibold text-gray-900 flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            Dati Anagrafici
                        </h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="text-gray-500">Ragione Sociale</span>
                                <p className="font-medium">{fornitore.ragioneSociale}</p>
                            </div>
                            {fornitore.nomeComune && (
                                <div>
                                    <span className="text-gray-500">Nome Commerciale</span>
                                    <p className="font-medium">{fornitore.nomeComune}</p>
                                </div>
                            )}
                            <div>
                                <span className="text-gray-500">Tipo</span>
                                <p className="font-medium">{fornitore.tipoFornitore}</p>
                            </div>
                        </div>
                    </div>

                    {/* Contatti */}
                    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                        <h3 className="mb-4 font-semibold text-gray-900">Contatti</h3>
                        <div className="space-y-3 text-sm">
                            {fornitore.telefono && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-400" />
                                    <a href={`tel:${fornitore.telefono}`} className="text-blue-600 hover:underline">
                                        {fornitore.telefono}
                                    </a>
                                </div>
                            )}
                            {fornitore.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-gray-400" />
                                    <a href={`mailto:${fornitore.email}`} className="text-blue-600 hover:underline">
                                        {fornitore.email}
                                    </a>
                                </div>
                            )}
                            {(fornitore.indirizzo || fornitore.citta) && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                    <span>
                                        {fornitore.indirizzo && <span>{fornitore.indirizzo}<br /></span>}
                                        {fornitore.cap} {fornitore.citta} ({fornitore.provincia})
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Statistiche */}
                    <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                        <h3 className="mb-4 font-semibold text-gray-900">Statistiche</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">{allViaggi.length}</p>
                                <p className="text-xs text-gray-600">Viaggi</p>
                            </div>
                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                <p className="text-lg font-bold text-green-600">€ {totaleAcquisti.toFixed(0)}</p>
                                <p className="text-xs text-gray-600">Totale Acquisti</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content - Viaggi Collegati */}
                <div className="lg:col-span-2">
                    <div className="rounded-lg bg-white shadow-sm ring-1 ring-gray-900/5">
                        <div className="border-b border-gray-200 p-4">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                Viaggi e Pratiche Collegate ({allViaggi.length})
                            </h3>
                        </div>

                        {allViaggi.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <FileText className="mx-auto h-12 w-12 text-gray-300" />
                                <p className="mt-2">Nessun viaggio collegato a questo fornitore</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {allViaggi.map((viaggio) => (
                                    <Link
                                        key={viaggio.id}
                                        href={`/pratiche/${viaggio.id}`}
                                        className="block p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {viaggio.destinazione}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {viaggio.cliente?.nome} {viaggio.cliente?.cognome}
                                                    {viaggio.tipologiaCosto && (
                                                        <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded">
                                                            {viaggio.tipologiaCosto}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {viaggio.dataPartenza && (
                                                    <p className="text-sm text-gray-600">
                                                        {format(new Date(viaggio.dataPartenza), "dd MMM yyyy", { locale: it })}
                                                    </p>
                                                )}
                                                {viaggio.costoFornitore && (
                                                    <p className="text-sm font-medium text-green-600">
                                                        € {viaggio.costoFornitore.toFixed(2)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
