import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PraticaForm } from "@/components/pratiche/PraticaForm";

async function getPratica(id: string) {
    const pratica = await prisma.pratica.findUnique({
        where: { id },
        include: {
            cliente: true,
            fornitore: true,
        },
    });

    if (!pratica) {
        notFound();
    }

    return pratica;
}

export default async function ModificaPraticaPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const pratica = await getPratica(id);

    return <PraticaForm initialData={pratica} isEditing={true} />;
}
