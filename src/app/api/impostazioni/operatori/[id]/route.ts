
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function DELETE(request: NextRequest) {
    try {
        const id = request.nextUrl.pathname.split('/').pop();
        if (!id) return NextResponse.json({ error: "ID missing" }, { status: 400 });
        // @ts-ignore
        await prisma.operatore.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Errore eliminazione operatore" }, { status: 500 });
    }
}
