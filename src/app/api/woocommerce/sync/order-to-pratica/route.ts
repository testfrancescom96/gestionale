import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const WOO_URL = "https://www.goontheroad.it";
const WOO_CK = "ck_8564a77bc2541057ecccba217959e4ce6cbc1b76";
const WOO_CS = "cs_ad880ebbdb8a5cffeadf669f9e45023b5ce0d579";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
        }

        // 1. Fetch Order Data directly from WooCommerce to ensure freshness/security
        const response = await fetch(`${WOO_URL}/wp-json/wc/v3/orders/${orderId}?consumer_key=${WOO_CK}&consumer_secret=${WOO_CS}`);

        if (!response.ok) {
            throw new Error("Failed to fetch order from WooCommerce");
        }

        const order = await response.json();

        // 2. Find or Create Cliente
        // We'll search by email first
        const billing = order.billing;
        const email = billing.email;
        const phone = billing.phone;
        const firstName = billing.first_name || "";
        const lastName = billing.last_name || "";

        // Sanitize strings
        const address = `${billing.address_1} ${billing.address_2 || ""}`.trim();

        let cliente = await prisma.cliente.findFirst({
            where: {
                OR: [
                    { email: email },
                    // If phone matches and has enough digits to be unique, we could check that too, 
                    // but email is safer for e-commerce.
                ]
            }
        });

        let isNewClient = false;
        if (!cliente) {
            isNewClient = true;
            cliente = await prisma.cliente.create({
                data: {
                    nome: firstName,
                    cognome: lastName,
                    email: email,
                    telefono: phone,
                    indirizzo: address,
                    citta: billing.city,
                    cap: billing.postcode,
                    provincia: billing.state, // WooCommerce uses 2-letter codes usually
                    note: `Creato automaticamente da Ordine WooCommerce #${orderId}`
                }
            });
        }

        // 3. Create Pratica
        // Determine destination/package from line items
        const lineItems = order.line_items || [];
        const packageNames = lineItems.map((item: any) => item.name).join(", ");
        const destination = packageNames || "Destinazione da definire";

        const now = new Date();
        const year = now.getFullYear();

        // Generate a temporary number or use ID logic
        // Finding max number to increment
        const lastPratica = await prisma.pratica.findFirst({
            orderBy: { numero: 'desc' },
        });
        const nextNumber = (lastPratica?.numero || 0) + 1;

        const pratica = await prisma.pratica.create({
            data: {
                numero: nextNumber,
                dataRichiesta: new Date(order.date_created),
                destinazione: destination.substring(0, 100), // Limit length
                stato: "PREVENTIVO_DA_ELABORARE", // Default status
                clienteId: cliente.id,
                prezzoVendita: parseFloat(order.total),
                tipologia: "Viaggio", // Default
                operatore: "WooCommerce Sync",
                note: `Importato da Ordine WC #${orderId}.\nTotale: ${order.total} ${order.currency}\nItems: ${packageNames}`,
            }
        });

        // 4. (Optional) Update Order Note in WooCommerce
        // Could post back a note saying "Imported into Gestionale as Pratica #..."

        return NextResponse.json({
            success: true,
            praticaId: pratica.id,
            clienteId: cliente.id,
            isNewClient,
            message: `Pratica #${pratica.numero} creata con successo`
        });

    } catch (error) {
        console.error("Error converting order:", error);
        return NextResponse.json(
            { error: "Failed to convert order" },
            { status: 500 }
        );
    }
}
