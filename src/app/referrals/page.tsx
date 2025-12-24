"use client";

import { Share2, AlertCircle, CheckCircle2, Server, Globe, Lock } from "lucide-react";

export default function ReferralsPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Share2 className="h-8 w-8 text-blue-600" />
                        Referral & Affiliazioni
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Pianificazione integrazione sistema affiliati
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Status Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-orange-200 bg-orange-50">
                        <h2 className="text-lg font-semibold text-orange-800 flex items-center gap-2 mb-4">
                            <AlertCircle className="h-5 w-5" />
                            Stato Attuale: In Attesa di Integrazione
                        </h2>
                        <p className="text-orange-700 mb-4">
                            Il sistema attuale utilizza <strong>YITH Affiliates</strong> su WordPress, che non offre API native per l'integrazione completa con questo gestionale.
                        </p>
                        <p className="text-orange-700">
                            Per procedere con l'automazione completa e la visualizzazione dei dati qui, è necessario migrare al plugin professionale consigliato.
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Piano di Integrazione (Roadmap)</h2>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">1</div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Installazione Plugin Supportato</h3>
                                    <p className="text-gray-600 mt-1">
                                        Acquistare e installare su WordPress:
                                    </p>
                                    <ul className="list-disc list-inside mt-2 text-gray-600 space-y-1 ml-2">
                                        <li><strong>AffiliateWP</strong> (Plugin Base)</li>
                                        <li><strong>REST API Extended Add-on</strong> (Necessario per l'integrazione)</li>
                                    </ul>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">2</div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Configurazione API</h3>
                                    <p className="text-gray-600 mt-1">
                                        Generare le chiavi API in AffiliateWP e configurarle nel gestionale. Questo permetterà la comunicazione bidirezionale sicura.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-shrink-0 mt-1">
                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">3</div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">Sviluppo Moduli Gestionale</h3>
                                    <p className="text-gray-600 mt-1">
                                        Una volta attive le API, verranno sviluppate queste funzionalità:
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            Dashboard Statistiche
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            Gestione Affiliati (Approva/Rifiuta)
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            Monitoraggio Commissioni
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            Payouts Automatizzati
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Technical Details Sidebar */}
                <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                        <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
                            <Server className="h-4 w-4" />
                            Dettagli Tecnici
                        </h3>
                        <div className="space-y-4 text-sm text-slate-600">
                            <div>
                                <strong className="block text-slate-900 mb-1">Perché non YITH?</strong>
                                <p>YITH Affiliates manca di endpoint API pubblici per la gestione programmatica (CRUD) necessaria per un gestionale esterno.</p>
                            </div>
                            <div>
                                <strong className="block text-slate-900 mb-1">Perché AffiliateWP?</strong>
                                <p>È lo standard industriale e offre un add-on dedicato ("REST API Extended") specificamente progettato per integrazioni come questa.</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                        <h3 className="font-semibold text-blue-800 flex items-center gap-2 mb-4">
                            <Globe className="h-4 w-4" />
                            Potenziale Futuro
                        </h3>
                        <p className="text-sm text-blue-700 mb-4">
                            Con la nuova integrazione potremo tracciare automaticamente:
                        </p>
                        <ul className="space-y-2 text-sm text-blue-800">
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                                Origine del traffico (Referral URL)
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                                Utilizzo Coupon Partner
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                                Tassi di conversione per Affiliato
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
