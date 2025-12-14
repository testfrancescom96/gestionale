
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

/**
 * Groups products by Year and Month based on their SKU date.
 * Products with invalid/missing SKU dates are grouped under "Undated".
 */
export function groupProductsByDate(products: any[]): { dated: GroupedEvent[], undated: any[] } {
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

    // Sort keys (Year-Month)
    const sortedKeys = Array.from(datedMap.keys()).sort();

    const dated: GroupedEvent[] = sortedKeys.map(key => {
        const [year, month] = key.split('-').map(Number);
        // Sort products by date within the month
        const sortedProducts = datedMap.get(key)?.sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime()) || [];

        return {
            year,
            month,
            monthName: format(new Date(year, month, 1), "MMMM", { locale: it }),
            products: sortedProducts
        };
    });

    return { dated, undated };
}
