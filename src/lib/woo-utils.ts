
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
 * Products with invalid / missing SKU dates are grouped under "Undated".
 * Phase 2: "Pinned" products are extracted to a separate top - level array.
 * Structure: { Pinned, Years -> Month -> Products, Undated }
 */
export function groupProductsByDate(products: any[]): { pinned: any[], years: YearGroup[], undated: any[] } {
    const datedMap = new Map<string, any[]>();
    const undated: any[] = [];
    const pinned: any[] = [];

    products.forEach(p => {
        if (p.isPinned) {
            pinned.push(p);
            // If pinned, do we ALSO show it in the calendar? Usually better to NOT duplicate.
            // Let's decide: Pinned items are REMOVED from the calendar to avoid clutter 
            // OR kept and just highlighted? User asked for "Fix ordering", usually means move to top.
            // I will EXCLUDE them from the normal flow.
            return;
        }

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

    // Sort keys based on numerical value of year and month
    const sortedKeys = Array.from(datedMap.keys()).sort((a, b) => {
        const [yA, mA] = a.split('-').map(Number);
        const [yB, mB] = b.split('-').map(Number);
        if (yA !== yB) return yA - yB;
        return mA - mB;
    });

    sortedKeys.forEach(key => {
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

    return { pinned, years, undated };
}

/**
 * Groups orders by Year and Month based on date_created.
 */
export function groupOrdersByDate(orders: any[]): YearGroup[] {
    const datedMap = new Map<string, any[]>();

    orders.forEach(o => {
        const dateStr = o.dateCreated || o.date_created; // Support both formats
        if (dateStr) {
            const date = new Date(dateStr);
            if (isValid(date)) {
                const key = `${date.getFullYear()}-${date.getMonth()}`;
                if (!datedMap.has(key)) {
                    datedMap.set(key, []);
                }
                datedMap.get(key)?.push(o);
            }
        }
    });

    const yearsMap = new Map<number, GroupedEvent[]>();

    // Sort: Newest first
    const sortedKeys = Array.from(datedMap.keys()).sort((a, b) => {
        const [yA, mA] = a.split('-').map(Number);
        const [yB, mB] = b.split('-').map(Number);
        // Descending order for orders usually
        if (yA !== yB) return yB - yA;
        return mB - mA;
    });

    sortedKeys.forEach(key => {
        const [year, month] = key.split('-').map(Number);
        const sortedOrders = datedMap.get(key)?.sort((a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime()) || [];

        const monthGroup: GroupedEvent = {
            year,
            month,
            monthName: format(new Date(year, month, 1), "MMMM", { locale: it }),
            products: sortedOrders // Reusing 'products' field for convenience, though it contains orders
        };

        if (!yearsMap.has(year)) {
            yearsMap.set(year, []);
        }
        yearsMap.get(year)?.push(monthGroup);
    });

    // Keys sorted Descending (Newest years first)
    const years: YearGroup[] = Array.from(yearsMap.keys())
        .sort((a, b) => b - a)
        .map(year => ({
            year,
            months: yearsMap.get(year) || []
        }));

    return years;
}
