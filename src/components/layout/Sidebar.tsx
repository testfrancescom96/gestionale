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
    Megaphone
} from "lucide-react";

const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Pratiche", href: "/pratiche", icon: FileText },
    { name: "Anagrafiche", href: "/clienti", icon: Users },
    { name: "Scadenzario", href: "/scadenzario", icon: Calendar },
    { name: "Report", href: "/report", icon: DollarSign },
    { name: "WooCommerce", href: "/woocommerce", icon: ShoppingBag },
    { name: "Marketing", href: "/marketing", icon: Megaphone },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex w-64 flex-col bg-gradient-to-b from-blue-900 to-blue-800 text-white">
            {/* Logo */}
            {/* Logo */}
            <div className="flex h-16 items-center justify-center border-b border-blue-700 bg-white p-2">
                <img src="/logo.png" alt="GOonTheROAD" className="max-h-full max-w-full object-contain" />
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`
                flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                ${isActive
                                    ? "bg-blue-700 text-white shadow-lg"
                                    : "text-blue-100 hover:bg-blue-700/50 hover:text-white"
                                }
              `}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Settings */}
            <div className="border-t border-blue-700 p-3">
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
