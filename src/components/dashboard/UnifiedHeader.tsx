import Link from "next/link";
import { FileText, Users, Building2, Plus } from "lucide-react";

export function UnifiedHeader() {
    const today = new Date().toLocaleDateString("it-IT", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Control Room</h1>
                <p className="text-gray-500 capitalize">{today}</p>
            </div>

            <div className="flex items-center gap-3">
                <Link
                    href="/pratiche/nuova"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                    <Plus className="h-4 w-4" />
                    Nuova Pratica
                </Link>
                <div className="h-8 w-px bg-gray-200 mx-1"></div>
                <Link
                    href="/clienti/nuovo"
                    className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors tooltip-trigger"
                    title="Nuovo Cliente"
                >
                    <Users className="h-5 w-5" />
                </Link>
                <Link
                    href="/scadenzario"
                    className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Scadenzario"
                >
                    <Building2 className="h-5 w-5" />
                </Link>
            </div>
        </div>
    );
}
