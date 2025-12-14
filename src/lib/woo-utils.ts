
import { format, isValid, parse } from "date-fns";
import { it } from "date-fns/locale";

/**
 * Parses a date from a SKU string.
 * Expected format: ends with DDMMYY (e.g., ...211225 for 21 Dec 2025)
 */
export function parseSkuDate(sku: string | undefined): Date | null {
    if (!sku || sku.length < 6) return null;

    // Extract last 6 characters
    const datePart = sku.slice(-6);

    // Check if they are all numbers
    if (!/^\d{6}$/.test(datePart)) return null;

    try {
        // Parse DDMMYY
        // 211225 -> 21/12/2025
        const day = datePart.substring(0, 2);
        const month = datePart.substring(2, 4);
        const year = "20" + datePart.substring(4, 6);

        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

        if (isValid(date)) {
            return date;
        }
    } catch (e) {
        console.error("Error parsing SKU date:", sku, e);
    }

    return null;
}


export interface GroupedEvent {
    year: number;
    month: number; // 0-11
    monthName: string;
    products: any[];
}

export interface YearGroup {
    year: number;
    months: GroupedEvent[];
}

/**
 * Groups products by Year and Month based on their SKU date.
 * Products with invalid/missing SKU dates are grouped under "Undated".
 * Structure: Year -> Month -> Products
 */
export function groupProductsByDate(products: any[]): { years: YearGroup[], undated: any[] } {
    const datedMap = new Map<string, any[]>();
    const undated: any[] = [];

    products.forEach(p => {
        const date = parseSkuDate(p.sku);
        if (date) {
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            if (!datedMap.has(key)) {
                datedMap.set(key, []);
            }
            datedMap.get(key)?.push({ ...p, eventDate: date });
        } else {
            undated.push(p);
        }
    });

    // Create Hierarchical List
    const yearsMap = new Map<number, GroupedEvent[]>();

    Array.from(datedMap.keys()).sort().forEach(key => {
        const [year, month] = key.split('-').map(Number);
        const sortedProducts = datedMap.get(key)?.sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime()) || [];

        const monthGroup: GroupedEvent = {
            year,
            month,
            monthName: format(new Date(year, month, 1), "MMMM", { locale: it }),
            products: sortedProducts
        };

        if (!yearsMap.has(year)) {
            yearsMap.set(year, []);
        }
        yearsMap.get(year)?.push(monthGroup);
    });

    // Convert Map to Array sorted by Year
    const years: YearGroup[] = Array.from(yearsMap.keys())
        .sort((a, b) => a - b)
        .map(year => ({
            year,
            months: yearsMap.get(year) || []
        }));

    return { years, undated };
}
