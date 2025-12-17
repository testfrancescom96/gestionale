import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePassengerListPdf } from "@/lib/pdf-exports";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const pratica = await prisma.pratica.findUnique({
            where: { id },
            include: {
                cliente: true,
                fornitore: true,
                partecipanti: true
            }
        });

        if (!pratica) {
            return NextResponse.json({ error: "Pratica not found" }, { status: 404 });
        }

        const pdfBytes = await generatePassengerListPdf(pratica, pratica.partecipanti);

        return new NextResponse(pdfBytes, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="Lista_Passeggeri_${pratica.numero || id}.pdf"`,
            },
        });

    } catch (error: any) {
        console.error("Error generating PDF:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
