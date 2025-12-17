import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import {
    ArrowLeft,
    User,
    MapPin,
    Calendar,
    Users,
    Euro,
    FileText,
    Building,
    Edit,
    Download,
    Mail,
    Phone,
} from "lucide-react";
import { DeletePraticaButton } from "@/components/pratiche/DeletePraticaButton";
import { ParticipantsList } from "@/components/pratiche/ParticipantsList";
import { DocumentsList } from "@/components/pratiche/DocumentsList";
import { StampaContrattoButton } from "@/components/pratiche/StampaContrattoButton";
import { StampaEstrattoContoButton } from "@/components/pratiche/StampaEstrattoContoButton";
import { DownloadListaButton } from "@/components/pratiche/DownloadListaButton";

async function getPratica(id: string) {
    const pratica = await prisma.pratica.findUnique({
        where: { id },
        include: {
            cliente: true,
            fornitore: true,
            costi: {
                include: {
                    fornitore: true
                }
            },
            partecipanti: true,
        },
    });

    if (!pratica) {
        notFound();
    }

    return pratica;
}

export default async function DettaglioPraticaPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    // Utilizziamo 'let' per poter sovrascrivere con i dati storici
    let pratica: any = await getPratica(id);

    // Gestione Snapshot (Visualizzazione Dati Storici su pratiche archiviate)
    if (pratica.datiArchiviati) {
        try {
            const snapshot = JSON.parse(pratica.datiArchiviati);
            if (snapshot.cliente) {
                // Sovrascrive i dati del cliente con quelli storici
                pratica.cliente = { ...pratica.cliente, ...snapshot.cliente };
            }
            if (snapshot.fornitore) {
                pratica.fornitore = { ...pratica.fornitore, ...snapshot.fornitore };
                pratica.nomeFornitore = snapshot.fornitore.ragioneSociale || pratica.nomeFornitore;
            }
        } catch (e) {
            console.error("Errore parsing snapshot pratica", e);
        }
    }

    // Helper Safe Date
    const safeDate = (d: any) => {
        if (!d) return "N/A";
        try {
            const date = new Date(d);
            // Check if date is valid
            if (isNaN(date.getTime())) return "N/A";
            return date.toLocaleDateString("it-IT");
        } catch (e) {
            return "N/A";
        }
    };

    const getStatoBadge = (stato: string) => {
        const badges: Record<string, { color: string; text: string }> = {
            DA_ELABORARE: { color: "bg-gray-100 text-gray-800", text: "Da Elaborare" },
            BOZZA: { color: "bg-amber-100 text-amber-800", text: "Bozza" }, // Added BOZZA
            IN_LAVORAZIONE: { color: "bg-blue-100 text-blue-800", text: "In Lavorazione" },
            PREVENTIVO_INVIATO: { color: "bg-yellow-100 text-yellow-800", text: "Preventivo Inviato" },
            CONFERMATA: { color: "bg-green-100 text-green-800", text: "Confermata" },
            CONFERMATO: { color: "bg-green-100 text-green-800", text: "Confermato" }, // Alias
            ANNULLATA: { color: "bg-red-100 text-red-800", text: "Annullata" },
            ANNULLATO: { color: "bg-red-100 text-red-800", text: "Annullato" }, // Alias
            COMPLETATA: { color: "bg-purple-100 text-purple-800", text: "Completata" },
            COMPLETATO: { color: "bg-purple-100 text-purple-800", text: "Completato" }, // Alias
        };
        return badges[stato] || { color: "bg-gray-100 text-gray-800", text: stato }; // Fallback to raw status
    };

    const badge = getStatoBadge(pratica.stato);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/pratiche"
                        className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Torna alle pratiche
                    </Link>

                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Pratica #{pratica.numero || "N/A"}
                            </h1>
                            <p className="mt-2 text-gray-600">
                                Creata il {safeDate(pratica.dataRichiesta)} da {pratica.operatore}
                            </p>
                        </div>

                        {/* ... (in the component return) */}
                        <div className="flex gap-3">
                            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${badge.color}`}>
                                {badge.text}
                            </span>
                            <DownloadListaButton id={pratica.id} />
                            <StampaContrattoButton id={pratica.id} />
                            <StampaEstrattoContoButton id={pratica.id} />
                            <Link
                                href={`/pratiche/${pratica.id}/edit`}
                                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                                <Edit className="h-4 w-4" />
                                Modifica
                            </Link>
                            <DeletePraticaButton id={pratica.id} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Colonna principale */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Dati Cliente */}
                        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                            <div className="mb-4 flex items-center gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                <h2 className="text-lg font-semibold text-gray-900">Cliente</h2>
                            </div>

                            {pratica.cliente ? (
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Nome</p>
                                        <p className="font-medium text-gray-900">
                                            {pratica.cliente.nome} {pratica.cliente.cognome}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Email</p>
                                            <p className="flex items-center gap-2 text-gray-900">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                                {pratica.cliente.email || "N/A"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Telefono</p>
                                            <p className="flex items-center gap-2 text-gray-900">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                                {pratica.cliente.telefono || "N/A"}
                                            </p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Indirizzo</p>
                                        <p className="text-gray-900">
                                            {pratica.cliente.indirizzo}
                                            <br />
                                            {pratica.cliente.cap} {pratica.cliente.citta} ({pratica.cliente.provincia})
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Codice Fiscale</p>
                                        <p className="font-mono text-gray-900">{pratica.cliente.codiceFiscale}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500">Nessun cliente associato</p>
                            )}
                        </div>

                        {/* LISTA PARTECIPANTI */}
                        <ParticipantsList
                            praticaId={pratica.id}
                            numPartecipantiAttesi={(pratica.numAdulti || 0) + (pratica.numBambini || 0)}
                        />

                        {/* DOCUMENTI */}
                        <DocumentsList praticaId={pratica.id} />

                        {/* Dettagli Viaggio */}
                        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                            <div className="mb-4 flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-green-600" />
                                <h2 className="text-lg font-semibold text-gray-900">Dettagli Viaggio</h2>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Destinazione</p>
                                        <p className="font-medium text-gray-900">{pratica.destinazione}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Tipologia</p>
                                        <p className="text-gray-900">{pratica.tipologia}</p>
                                    </div>
                                </div>

                                {pratica.periodoRichiesto && (
                                    <div>
                                        <p className="text-sm text-gray-500">Periodo Richiesto</p>
                                        <p className="text-gray-900">{pratica.periodoRichiesto}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Data Partenza</p>
                                        <p className="flex items-center gap-2 text-gray-900">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            {safeDate(pratica.dataPartenza)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Data Ritorno</p>
                                        <p className="flex items-center gap-2 text-gray-900">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            {safeDate(pratica.dataRitorno)}
                                        </p>
                                    </div>

                                    {pratica.cittaPartenza && (
                                        <div>
                                            <p className="text-sm text-gray-500">Città di Partenza</p>
                                            <p className="text-gray-900">{pratica.cittaPartenza}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Adulti</p>
                                            <p className="flex items-center gap-2 text-gray-900">
                                                <Users className="h-4 w-4 text-gray-400" />
                                                {pratica.numAdulti}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Bambini</p>
                                            <p className="text-gray-900">{pratica.numBambini}</p>
                                        </div>
                                        {pratica.etaBambini && (
                                            <div>
                                                <p className="text-sm text-gray-500">Età Bambini</p>
                                                <p className="text-gray-900">{pratica.etaBambini}</p>
                                            </div>
                                        )}
                                    </div>

                                    {pratica.tipologiaCamera && (
                                        <div>
                                            <p className="text-sm text-gray-500">Tipologia Camera</p>
                                            <p className="text-gray-900">{pratica.tipologiaCamera}</p>
                                        </div>
                                    )}

                                    {pratica.note && (
                                        <div>
                                            <p className="text-sm text-gray-500">Note</p>
                                            <p className="text-gray-900">{pratica.note}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Fornitori e Costi (Multi-Fornitore) */}
                            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                                <div className="mb-4 flex items-center gap-2">
                                    <Building className="h-5 w-5 text-purple-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">Fornitori e Costi</h2>
                                </div>

                                {/* @ts-ignore */}
                                {pratica.costi && pratica.costi.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fornitore</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dettaglio</th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Importo</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {/* @ts-ignore */}
                                                {pratica.costi.map((costo: any) => (
                                                    <tr key={costo.id}>
                                                        <td className="px-4 py-2 text-sm text-gray-900">
                                                            {costo.fornitore?.ragioneSociale || costo.nomeFornitore || "N/A"}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-500">
                                                            {costo.tipologia} {costo.descrizione ? `- ${costo.descrizione}` : ""}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-right text-gray-900">
                                                            € {Number(costo.importo || 0).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-gray-50">
                                                <tr>
                                                    <td colSpan={2} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">Totale</td>
                                                    <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                                                        € {pratica.costoFornitore?.toFixed(2) || "0.00"}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                ) : (
                                    // Fallback per compatibilità o nessun costo
                                    <div className="space-y-3">
                                        {(pratica.fornitore || pratica.nomeFornitore) ? (
                                            <div>
                                                <p className="text-sm text-gray-500">Fornitore Principale</p>
                                                <p className="font-medium text-gray-900">
                                                    {pratica.fornitore?.ragioneSociale || pratica.nomeFornitore || "N/A"}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic">Nessun fornitore associato</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar finanziaria */}
                        <div className="space-y-6">
                            {/* Riepilogo Economico */}
                            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                                <div className="mb-4 flex items-center gap-2">
                                    <Euro className="h-5 w-5 text-green-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">Riepilogo Economico</h2>
                                </div>

                                <div className="space-y-4">
                                    {pratica.prezzoVendita !== null && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Prezzo Vendita</span>
                                            <span className="font-semibold text-gray-900">
                                                € {pratica.prezzoVendita.toFixed(2)}
                                            </span>
                                        </div>
                                    )}

                                    {pratica.costoFornitore !== null && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Costo Fornitore</span>
                                            <span className="text-gray-900">
                                                € {pratica.costoFornitore.toFixed(2)}
                                            </span>
                                        </div>
                                    )}

                                    {pratica.margineCalcolato !== null && (
                                        <div className="flex justify-between border-t pt-4">
                                            <span className="text-sm font-medium text-gray-900">Margine</span>
                                            <div className="text-right">
                                                <span className="font-bold text-green-600 block">
                                                    € {pratica.margineCalcolato.toFixed(2)}
                                                    {pratica.percentualeMargine && (
                                                        <span className="ml-2 text-sm font-normal">
                                                            ({pratica.percentualeMargine.toFixed(2)}%)
                                                        </span>
                                                    )}
                                                </span>
                                                {/* Stima IVA su Margine (74ter) */}
                                                {pratica.regimeIVA === "74TER" && (
                                                    <span className="block text-xs font-medium text-red-600 mt-1">
                                                        Stima IVA: € {(pratica.margineCalcolato * 0.22).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {pratica.richiedeAcconto && (
                                        <>
                                            <div className="border-t pt-4">
                                                <p className="mb-2 text-sm font-medium text-gray-700">
                                                    Gestione Acconti
                                                </p>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Acconto ({pratica.percentualeAcconto}%)</span>
                                                        <span className="font-semibold text-blue-600">
                                                            € {pratica.importoAcconto?.toFixed(2) || "0.00"}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Saldo</span>
                                                        <span className="font-semibold text-gray-900">
                                                            € {pratica.importoSaldo?.toFixed(2) || "0.00"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Regime IVA */}
                            {pratica.regimeIVA && (
                                <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                                    <div className="mb-4 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-orange-600" />
                                        <h2 className="text-lg font-semibold text-gray-900">Regime Fiscale</h2>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Regime IVA</p>
                                            <p className="font-medium text-gray-900">{pratica.regimeIVA}</p>
                                        </div>
                                        {pratica.aliquotaIVA !== null && (
                                            <div>
                                                <p className="text-sm text-gray-500">Aliquota IVA</p>
                                                <p className="text-gray-900">{pratica.aliquotaIVA}%</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Azioni Future */}
                            <div className="rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 p-6 shadow-sm ring-1 ring-blue-900/10">
                                <h3 className="mb-4 text-sm font-semibold text-gray-900">
                                    Prossime Funzionalità
                                </h3>
                                <div className="space-y-2 text-sm text-gray-600">
                                    <p className="flex items-center gap-2">
                                        <Download className="h-4 w-4" />
                                        Genera Contratto PDF
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Genera Fattura
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Estratto Conto
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        Firma OTP via Email/SMS
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            );
}
