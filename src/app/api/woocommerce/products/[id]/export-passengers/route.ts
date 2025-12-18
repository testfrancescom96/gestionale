import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { it } from "date-fns/locale";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const productId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const forCollaborators = searchParams.get("share") === "true";

    try {
        // Recupera prodotto
        const product = await prisma.wooProduct.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return NextResponse.json({ error: "Prodotto non trovato" }, { status: 404 });
        }

        // Recupera ordini per questo prodotto tramite WooOrderItem
        const orderItems = await prisma.wooOrderItem.findMany({
            where: { wooProductId: productId },
            include: {
                order: true
            }
        });

        // Estrai ID ordini unici
        const orderIds = [...new Set(orderItems.map(item => item.wooOrderId))];

        // Recupera ordini completi
        const orders = await prisma.wooOrder.findMany({
            where: {
                id: { in: orderIds }
            },
            orderBy: { dateCreated: "asc" }
        });

        // Recupera anche prenotazioni manuali
        const manualBookings = await prisma.manualBooking.findMany({
            where: { wooProductId: productId },
            orderBy: { createdAt: "asc" }
        });

        // Estrai tutti i partecipanti
        interface Participant {
            orderId: number;
            cognome: string;
            nome: string;
            telefono: string;
            email: string;
            partenza: string;
            pagato: string;
            tipo: string;
        }

        const participants: Participant[] = [];

        // Aggiungi ordini WooCommerce
        for (const order of orders) {
            participants.push({
                orderId: order.id,
                cognome: order.billingLastName || "-",
                nome: order.billingFirstName || "-",
                telefono: order.billingPhone || "-",
                email: order.billingEmail || "-",
                partenza: "-",
                pagato: order.status === "completed" || order.status === "processing" ? "Sì" : "No",
                tipo: "WooCommerce"
            });
        }

        // Aggiungi prenotazioni manuali
        for (const manual of manualBookings) {
            participants.push({
                orderId: manual.id,
                cognome: manual.cognome || "-",
                nome: manual.nome || "-",
                telefono: manual.telefono || "-",
                email: manual.email || "-",
                partenza: manual.puntoPartenza || "-",
                pagato: manual.pagato ? "Sì" : "No",
                tipo: "Manuale"
            });
        }

        const productName = product.name || "Lista Passeggeri";
        const eventDate = product.eventDate ? format(new Date(product.eventDate), "dd-MM-yyyy", { locale: it }) : "";
        const fileName = `${eventDate ? eventDate + " - " : ""}${productName}`.replace(/[^a-zA-Z0-9\s\-]/g, "").substring(0, 100);

        // Export CSV
        let csvContent: string;

        if (forCollaborators) {
            // Versione per collaboratori - senza telefono/email
            csvContent = "N°;COGNOME;NOME;PARTENZA;NOTE\n";
            participants.forEach((p, i) => {
                csvContent += `${i + 1};${p.cognome};${p.nome};${p.partenza};\n`;
            });
        } else {
            // Versione completa per capogruppo
            csvContent = `Evento: ${productName}\n`;
            csvContent += `Totale Partecipanti: ${participants.length}\n\n`;
            csvContent += "N°;COGNOME;NOME;TELEFONO;PARTENZA;EMAIL;PAGATO;TIPO\n";
            participants.forEach((p, i) => {
                csvContent += `${i + 1};${p.cognome};${p.nome};${p.telefono};${p.partenza};${p.email};${p.pagato};${p.tipo}\n`;
            });
        }

        const headers = new Headers();
        headers.set("Content-Type", "text/csv; charset=utf-8");
        headers.set("Content-Disposition", `attachment; filename="${fileName}.csv"`);

        return new NextResponse(csvContent, { headers });

    } catch (error: any) {
        console.error("Errore export passeggeri:", error);
        return NextResponse.json({ error: error.message || "Errore" }, { status: 500 });
    }
}
