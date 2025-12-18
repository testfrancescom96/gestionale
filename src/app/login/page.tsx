"use client";

import { useActionState } from "react";
import { login } from "./actions";
import { useFormStatus } from "react-dom";
import { Lock, User, Bus } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {pending ? (
                <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Accesso in corso...
                </>
            ) : (
                "Accedi al Gestionale"
            )}
        </button>
    );
}

export default function LoginPage() {
    // @ts-ignore
    const [state, formAction] = useActionState(login, null);

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
            {/* Background with Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: "url('/login-bg.png')" }}
            >
                <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[2px]" />
            </div>

            {/* Glass Card */}
            <div className="relative z-10 w-full max-w-md p-6 mx-4">
                <div className="bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl rounded-3xl p-8 space-y-8">

                    {/* Header / Logo */}
                    <div className="text-center space-y-2">
                        <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-4 transform rotate-3">
                            <Bus className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Benvenuto</h1>
                        <p className="text-gray-500 font-medium">Gestionale Viaggi & Bus</p>
                    </div>

                    {/* Form */}
                    <form action={formAction} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Utente</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                </div>
                                <input
                                    name="username"
                                    type="text"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 transition-all"
                                    placeholder="Inserisci username"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                </div>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white/50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 transition-all"
                                    placeholder="Inserisci password"
                                />
                            </div>
                        </div>

                        {state?.error && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                                <div className="shrink-0 text-red-500">
                                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-red-800">{state.error}</p>
                            </div>
                        )}

                        <div className="pt-2">
                            <SubmitButton />
                        </div>
                    </form>

                    <div className="text-center text-xs text-gray-400">
                        &copy; {new Date().getFullYear()} GOonTheROAD. Area Riservata.
                    </div>
                </div>
            </div>
        </div>
    );
}
