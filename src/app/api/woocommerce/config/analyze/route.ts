
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        console.log("Starting full analysis of WooCommerce Orders for CSV Report...");

        // Fetch all orders with minimal fields
        const orders = await prisma.wooOrder.findMany({
            select: {
                id: true,
                metaData: true,
                lineItems: {
                    select: {
                        metaData: true
                    }
                }
            }
        }) as any;

        const fieldMap = new Map<string, { count: number, examples: string[], source: string }>();

        // Helper
        const addField = (key: string, value: any, source: 'order' | 'item') => {
            if (!key || key === '') return;
            // Internal underscore keys often boring but user wants all? 
            // We include everything for the report.

            if (!fieldMap.has(key)) {
                fieldMap.set(key, { count: 0, examples: [], source });
            }

            const entry = fieldMap.get(key)!;
            entry.count++;

            if (entry.examples.length < 3 && value !== null && value !== undefined && value !== '') {
                const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
                // Avoid huge strings
                const truncated = valStr.length > 100 ? valStr.substring(0, 100) + "..." : valStr;
                if (!entry.examples.includes(truncated)) {
                    entry.examples.push(truncated);
                }
            }
        };

        for (const order of orders) {
            // Order Meta
            if (order.metaData) {
                try {
                    const meta = JSON.parse(order.metaData);
                    if (Array.isArray(meta)) {
                        meta.forEach((m: any) => addField(m.key, m.value, 'order'));
                    } else if (typeof meta === 'object') {
                        Object.entries(meta).forEach(([k, v]) => addField(k, v, 'order'));
                    }
                } catch (e) { }
            }

            // Item Meta
            for (const item of order.lineItems) {
                if (item.metaData) {
                    try {
                        const meta = JSON.parse(item.metaData);
                        if (Array.isArray(meta)) {
                            meta.forEach((m: any) => addField(m.key, m.value, 'item'));
                        } else if (typeof meta === 'object') {
                            Object.entries(meta).forEach(([k, v]) => addField(k, v, 'item'));
                        }
                    } catch (e) { }
                }
            }
        }

        // Sort by count desc
        const sortedFields = Array.from(fieldMap.entries())
            .map(([key, data]) => ({ key, ...data }))
            .sort((a, b) => b.count - a.count);

        // Generate CSV
        const header = "Chiave (Key),Conteggio,Fonte,Esempi Valori\n";
        const rows = sortedFields.map(f => {
            const safeExamples = f.examples.map(e => e.replace(/"/g, '""')).join('; ');
            return `"${f.key}",${f.count},${f.source},"${safeExamples}"`;
        }).join("\n");

        const csvContent = header + rows;

        // Return CSV file
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="report-campi-woocommerce-${new Date().toISOString().slice(0, 10)}.csv"`
            }
        });

    } catch (error: any) {
        console.error("Error analyzing fields:", error);
        return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
    }
}
