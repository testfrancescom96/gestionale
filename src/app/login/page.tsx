"use client";

import { useActionState, useEffect } from "react";
import { login } from "./actions";
import { useFormStatus } from "react-dom";
import { Lock, User } from "lucide-react";
import { redirect } from "next/navigation";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
            {pending ? "Accesso in corso..." : "Accedi"}
        </button>
    );
}

export default function LoginPage() {
    // @ts-ignore
    const [state, formAction] = useActionState(login, null);

    // Redirezione client-side se login ok? 
    // No, il server action fa redirect o setta cookie e basta?
    // login action non fa redirect nel try block per evitare NEXT_REDIRECT error caught.
    // Modificherò l'action per fare redirect finale o gestire qui.
    // Meglio gestire qui?
    // Se il cookie è settato, il middleware o layout vedranno sessione.
    // Ma `login` action deve fare redirect. Se uso useActionState, il redirect server-side funziona.

    // Nota: l'action che ho scritto NON fa redirect finale. La modifico subito dopo.
    // O uso redirect nel componente? 
    // Meglio redirect server-side.

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Gestionale Viaggi</h1>
                    <p className="text-gray-500 mt-2">Accedi per continuare</p>
                </div>

                <form action={formAction} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome Utente
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                name="username"
                                type="text"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="es. nome.cognome"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                name="password"
                                type="password"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {state?.error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                            {state.error}
                        </div>
                    )}

                    <SubmitButton />
                </form>
            </div>
        </div>
    );
}
