import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// API to analyze which products use which fields
// Returns: { fieldKey: { productIds: number[], productNames: string[], count: number, lastUsed?: Date } }
export async function GET(request: NextRequest) {
    try {
        // Fetch all products with their order items
        const products = await prisma.wooProduct.findMany({
            select: {
                id: true,
                name: true,
                eventDate: true,
                orderItems: {
                    select: {
                        metaData: true
                    }
                }
            }
        });

        // Map: fieldKey -> { productIds, productNames, count, lastUsed }
        const fieldUsage = new Map<string, {
            productIds: Set<number>;
            productNames: Set<string>;
            count: number;
            lastUsed: Date | null;
        }>();

        const addFieldUsage = (key: string, productId: number, productName: string, eventDate: Date | null) => {
            if (!key || key === '') return;

            // Skip internal keys that start with _ but not _field_
            if (key.startsWith('_') && !key.startsWith('_field_') && !key.startsWith('_billing_')) return;

            if (!fieldUsage.has(key)) {
                fieldUsage.set(key, {
                    productIds: new Set(),
                    productNames: new Set(),
                    count: 0,
                    lastUsed: null
                });
            }

            const entry = fieldUsage.get(key)!;
            entry.productIds.add(productId);
            entry.productNames.add(productName);
            entry.count++;

            // Track most recent event date
            if (eventDate && (!entry.lastUsed || eventDate > entry.lastUsed)) {
                entry.lastUsed = eventDate;
            }
        };

        for (const product of products) {
            for (const item of product.orderItems) {
                if (item.metaData) {
                    try {
                        const meta = JSON.parse(item.metaData);
                        if (Array.isArray(meta)) {
                            meta.forEach((m: any) => {
                                addFieldUsage(m.key || m.display_key, product.id, product.name, product.eventDate);
                            });
                        }
                    } catch { }
                }
            }
        }

        // Convert to serializable format
        const result: Record<string, {
            productIds: number[];
            productNames: string[];
            count: number;
            lastUsed: string | null;
            isOld: boolean; // More than 6 months since last use
        }> = {};

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        for (const [key, data] of fieldUsage.entries()) {
            result[key] = {
                productIds: Array.from(data.productIds),
                productNames: Array.from(data.productNames).slice(0, 5), // Limit to 5 names
                count: data.count,
                lastUsed: data.lastUsed?.toISOString() || null,
                isOld: data.lastUsed ? data.lastUsed < sixMonthsAgo : true
            };
        }

        // Also get configured fields to identify unused ones
        const configuredFields = await prisma.wooExportConfig.findMany({
            select: { fieldKey: true, label: true, hidden: true }
        });

        // Add warning for hidden fields being reused
        const warnings: { fieldKey: string; message: string }[] = [];
        for (const config of configuredFields) {
            if (config.hidden && result[config.fieldKey]) {
                // Hidden field is being used in products
                const usage = result[config.fieldKey];
                if (!usage.isOld) {
                    warnings.push({
                        fieldKey: config.fieldKey,
                        message: `Campo nascosto "${config.label || config.fieldKey}" è usato in ${usage.productIds.length} prodotti recenti!`
                    });
                }
            }
        }

        return NextResponse.json({
            fieldUsage: result,
            configuredFields: configuredFields.length,
            totalFieldsFound: Object.keys(result).length,
            warnings
        });

    } catch (error: any) {
        console.error("Error analyzing field usage:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
