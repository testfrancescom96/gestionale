"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Building2 } from "lucide-react";

export function AnagraficheTabs() {
    const pathname = usePathname();

    const tabs = [
        { name: "Clienti", href: "/clienti", icon: Users },
        { name: "Fornitori", href: "/fornitori", icon: Building2 },
    ];

    return (
        <div className="mb-8">
            <h1 className="mb-6 text-3xl font-bold text-gray-900">Anagrafiche</h1>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href;
                        return (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={`
                  flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${isActive
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                    }
                `}
                            >
                                <tab.icon className="h-5 w-5" />
                                {tab.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
