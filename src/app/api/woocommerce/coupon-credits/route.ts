import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET: Lista crediti coupon (con filtri opzionali)
export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const couponCode = searchParams.get("couponCode");
    const customerEmail = searchParams.get("customerEmail");

    try {
        const where: { couponCode?: string; customerEmail?: string } = {};
        if (couponCode) where.couponCode = couponCode;
        if (customerEmail) where.customerEmail = customerEmail;

        const credits = await prisma.couponCredit.findMany({
            where,
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' },
                    take: 5 // Solo ultime 5 transazioni
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json({ credits });
    } catch (error) {
        console.error("Error fetching coupon credits:", error);
        return NextResponse.json(
            { error: "Errore nel caricamento crediti" },
            { status: 500 }
        );
    }
}

// POST: Crea nuovo credito coupon
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { couponCode, customerEmail, customerName, originalAmount, notes } = body;

        if (!couponCode || !customerEmail || !originalAmount) {
            return NextResponse.json(
                { error: "couponCode, customerEmail e originalAmount sono obbligatori" },
                { status: 400 }
            );
        }

        // Check if credit already exists
        const existing = await prisma.couponCredit.findUnique({
            where: {
                couponCode_customerEmail: { couponCode, customerEmail }
            }
        });

        if (existing) {
            return NextResponse.json(
                { error: "Credito già esistente per questo coupon e cliente" },
                { status: 409 }
            );
        }

        const credit = await prisma.couponCredit.create({
            data: {
                couponCode,
                customerEmail,
                customerName: customerName || null,
                originalAmount: parseFloat(originalAmount),
                usedAmount: 0,
                remainingCredit: parseFloat(originalAmount),
                notes: notes || null
            }
        });

        return NextResponse.json({ success: true, credit });
    } catch (error) {
        console.error("Error creating coupon credit:", error);
        return NextResponse.json(
            { error: "Errore nella creazione credito" },
            { status: 500 }
        );
    }
}

// PUT: Registra utilizzo credito (transazione)
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { creditId, amountUsed, orderId, orderTotal, productName } = body;

        if (!creditId || !amountUsed) {
            return NextResponse.json(
                { error: "creditId e amountUsed sono obbligatori" },
                { status: 400 }
            );
        }

        const credit = await prisma.couponCredit.findUnique({
            where: { id: creditId }
        });

        if (!credit) {
            return NextResponse.json(
                { error: "Credito non trovato" },
                { status: 404 }
            );
        }

        if (amountUsed > credit.remainingCredit) {
            return NextResponse.json(
                { error: `Credito insufficiente. Disponibile: €${credit.remainingCredit.toFixed(2)}` },
                { status: 400 }
            );
        }

        const balanceBefore = credit.remainingCredit;
        const balanceAfter = balanceBefore - amountUsed;
        const newUsedAmount = credit.usedAmount + amountUsed;

        // Update credit and create transaction in a transaction
        const [updatedCredit] = await prisma.$transaction([
            prisma.couponCredit.update({
                where: { id: creditId },
                data: {
                    usedAmount: newUsedAmount,
                    remainingCredit: balanceAfter,
                    lastUsedAt: new Date(),
                    lastOrderId: orderId || null
                }
            }),
            prisma.couponCreditTransaction.create({
                data: {
                    creditId,
                    amount: amountUsed,
                    orderId: orderId || null,
                    orderTotal: orderTotal || null,
                    productName: productName || null,
                    balanceBefore,
                    balanceAfter
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            credit: updatedCredit,
            newBalance: balanceAfter
        });
    } catch (error) {
        console.error("Error using coupon credit:", error);
        return NextResponse.json(
            { error: "Errore nell'utilizzo del credito" },
            { status: 500 }
        );
    }
}

// DELETE: Elimina credito coupon
export async function DELETE(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "id richiesto" }, { status: 400 });
    }

    try {
        await prisma.couponCredit.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting coupon credit:", error);
        return NextResponse.json(
            { error: "Errore nell'eliminazione" },
            { status: 500 }
        );
    }
}
