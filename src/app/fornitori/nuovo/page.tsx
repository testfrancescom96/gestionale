"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FornitoreForm } from "@/components/fornitori/FornitoreForm";

export default function NuovoFornitorePage() {
    return (
        <div className="p-8">
            <div className="mb-6 flex items-center gap-4">
                <Link href="/fornitori" className="rounded-full bg-gray-100 p-2 hover:bg-gray-200">
                    <ArrowLeft className="h-6 w-6 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nuovo Fornitore</h1>
                    <p className="text-sm text-gray-500">Aggiungi un nuovo fornitore e i suoi servizi</p>
                </div>
            </div>

            <div className="max-w-4xl">
                <FornitoreForm />
            </div>
        </div>
    );
}
