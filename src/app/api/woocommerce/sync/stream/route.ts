import { NextRequest, NextResponse } from "next/server";
import { syncProducts, syncOrders } from "@/lib/sync-woo";

// Server-Sent Events (SSE) Stream
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type") || "all";
    const mode = searchParams.get("mode") || "incremental"; // for products
    const limit = parseInt(searchParams.get("limit") || "50");
    const days = searchParams.get("days") ? parseInt(searchParams.get("days")!) : null;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            const sendEvent = (data: any) => {
                const message = `data: ${JSON.stringify(data)}\n\n`;
                controller.enqueue(encoder.encode(message));
            };

            try {
                // Helper callback
                const onProgress = (msg: string) => {
                    sendEvent({ status: 'progress', message: msg });
                };

                let result: any = {};

                if (type === 'products' || type === 'all') {
                    sendEvent({ status: 'info', message: "Inizio sincronizzazione Prodotti..." });
                    // @ts-ignore
                    const res = await syncProducts(mode as any, onProgress);
                    result.products = res.count;
                }

                if (type === 'orders' || type === 'all') {
                    sendEvent({ status: 'info', message: "Inizio sincronizzazione Ordini..." });

                    // Determine Order Mode
                    let orderMode = searchParams.get("order_mode");
                    let value = 50; // default value

                    // Backward compatibility / Inference
                    if (!orderMode) {
                        if (days) {
                            orderMode = 'days';
                            value = days;
                        } else if (limit > 100) {
                            orderMode = 'full';
                        } else {
                            orderMode = 'rapid';
                            value = limit;
                        }
                    } else {
                        // Explicit mode set
                        if (orderMode === 'rapid') value = limit;
                        if (orderMode === 'days') value = days || 30;
                    }

                    // @ts-ignore
                    const res = await syncOrders(orderMode, value, onProgress);
                    result.orders = res.count;
                    result.updatedIds = res.updatedIds;
                }

                sendEvent({ status: 'done', result });
                controller.close();
            } catch (error: any) {
                console.error("Sync Stream Error:", error);
                sendEvent({ status: 'error', message: error.message || "Unknown Error" });
                controller.close();
            }
        }
    });

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
