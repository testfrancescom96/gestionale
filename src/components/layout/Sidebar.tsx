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
    Wallet
} from "lucide-react";

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
            { name: "Eventi / Gruppi", href: "/woocommerce", icon: ShoppingBag },
        ]
    },
    {
        title: "ANAGRAFICHE",
        items: [
            { name: "Clienti", href: "/clienti", icon: Users },
            { name: "Fornitori", href: "/fornitori", icon: Building2 },
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


export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex w-64 flex-col bg-gradient-to-b from-blue-900 to-blue-800 text-white h-screen overflow-y-auto">
            {/* Logo */}
            <div className="flex h-16 items-center justify-center border-b border-blue-700 bg-white p-2 shrink-0 sticky top-0 z-10">
                <img src="/logo.png" alt="GOonTheROAD" className="max-h-full max-w-full object-contain" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-6 px-3 py-6">
                {navSections.map((section, idx) => (
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
                ))}
            </nav>

            {/* Settings */}
            <div className="border-t border-blue-700 p-3 shrink-0 sticky bottom-0 bg-blue-800/90 backdrop-blur-sm">
                <Link
                    href="/impostazioni"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-100 transition-all hover:bg-blue-700/50 hover:text-white"
                >
                    <Settings className="h-5 w-5" />
                    Impostazioni
                </Link>
            </div>
        </div>
    );
}
