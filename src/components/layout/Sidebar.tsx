"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    FileText,
    Users,
    Building2,
    Calendar,
    DollarSign,
    Settings,
    ShoppingBag,
    Megaphone,
    Wallet,
    Bus
} from "lucide-react";
import { logout } from "@/app/login/actions";

const navSections = [
    {
        title: "", // Main
        items: [
            { name: "Dashboard", href: "/", icon: Home },
        ]
    },
    {
        title: "PRATICHE INDIVIDUALI",
        items: [
            { name: "Pratiche", href: "/pratiche", icon: FileText },
        ]
    },
    {
        title: "VIAGGI DI GRUPPO",
        items: [
            { name: "Prodotti / Ordini", href: "/woocommerce", icon: ShoppingBag },
            { name: "Capigruppo / Guide", href: "/capigruppo", icon: Users },
        ]
    },
    {
        title: "ANAGRAFICHE",
        items: [
            { name: "Clienti", href: "/clienti", icon: Users },
            { name: "Fornitori", href: "/fornitori", icon: Building2 },
            { name: "Vettori / Bus", href: "/vettori", icon: Bus },
        ]
    },
    {
        title: "CONTROLLO",
        items: [
            { name: "Scadenzario", href: "/scadenzario", icon: Calendar },
            { name: "Contabilità", href: "/contabilita", icon: Wallet },
            { name: "Report", href: "/report", icon: DollarSign },
            { name: "Marketing", href: "/marketing", icon: Megaphone },
        ]
    }
];



interface SidebarProps {
    user?: {
        nome: string;
        role: string;
    } | null;
}

export function Sidebar({ user }: SidebarProps) {
    const pathname = usePathname();

    const handleLogout = async () => {
        // Call server action logout
        // Since logout is a server action, we can't call it directly from onClick if it redirects?
        // Actually we can using a form or transition.
        // Or simpler: fetch api route or just window.location.href to logout endpoint? 
        // Best approach in Next.js App Router for logout button in client component:
        // Use a form with action={logout} or calling it.
        // Importing server action into client component works.
    };

    return (
        <div className="flex w-64 flex-col bg-gradient-to-b from-blue-900 to-blue-800 text-white h-screen overflow-y-auto">
            {/* Logo */}
            <div className="flex h-16 items-center justify-center border-b border-blue-700 bg-white p-2 shrink-0 sticky top-0 z-10">
                <img src="/logo.png" alt="GOonTheROAD" className="max-h-full max-w-full object-contain" />
            </div>

            {/* User Info */}
            {user && (
                <div className="px-5 py-4 border-b border-blue-700/50">
                    <p className="text-xs text-blue-300 uppercase tracking-wider font-semibold">Operatore</p>
                    <p className="font-medium text-white truncate">{user.nome}</p>
                    <span className="text-xs bg-blue-700/50 px-2 py-0.5 rounded text-blue-200">{user.role}</span>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 space-y-6 px-3 py-6">
                {navSections.map((section, idx) => {
                    // Filter logic if needed
                    return (
                        <div key={idx} className="space-y-1">
                            {section.title && (
                                <h3 className="px-3 text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">
                                    {section.title}
                                </h3>
                            )}

                            {section.items.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`
                                            flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all
                                            ${isActive
                                                ? "bg-blue-700 text-white shadow-lg"
                                                : "text-blue-100 hover:bg-blue-700/50 hover:text-white"
                                            }
                                        `}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="border-t border-blue-700 p-3 shrink-0 sticky bottom-0 bg-blue-800/90 backdrop-blur-sm space-y-1">
                {/* Settings only for ADMIN */}
                {user?.role?.toUpperCase() === "ADMIN" && (
                    <Link
                        href="/impostazioni"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-100 transition-all hover:bg-blue-700/50 hover:text-white"
                    >
                        <Settings className="h-5 w-5" />
                        Impostazioni
                    </Link>
                )}

                {/* Logout Button */}
                <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-200 transition-all hover:bg-red-900/30 hover:text-red-100"
                >
                    <Megaphone className="h-5 w-5 rotate-180" /> {/* Log out icon usually LogOut */}
                    Esci
                </button>
            </div>
        </div>
    );
}
