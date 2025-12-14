"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export function SearchInput({ placeholder }: { placeholder: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [value, setValue] = useState(searchParams.get("q") || "");

    // Simple debounce logic since I can't check hooks easily right now
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set("q", value);
            } else {
                params.delete("q");
            }
            router.push(`?${params.toString()}`);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [value, router, searchParams]);

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
        </div>
    );
}
