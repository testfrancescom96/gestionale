"use server";

import { prisma } from "@/lib/db";
import { encrypt, verifyPassword, hashPassword } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(prevState: any, formData: FormData) {
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    if (!username || !password) {
        return { error: "Compila tutti i campi" };
    }

    // SELF-HEALING: Se non ci sono operatori, crea admin/admin123
    const count = await prisma.operatore.count();
    if (count === 0) {
        const hash = await hashPassword("admin123");
        await prisma.operatore.create({
            data: { nome: "admin", password: hash, role: "ADMIN", email: "admin@example.com" }
        });
        // Se l'utente ha provato "admin", ora funzionerà al prossimo tentativo o re-fetch?
        // Meglio procedere col tentativo corrente se corrisponde
    }

    const user = await prisma.operatore.findUnique({ where: { nome: username } });

    if (!user) {
        return { error: "Utente non trovato" };
    }

    // Se password nel DB è vuota (vecchi utenti), impedisci login o gestisci migrazione
    if (!user.password && password) {
        // Opzionale: Permetti di impostare password al primo accesso se vuota? 
        // Rischioso. Meglio dire "Contatta amministratore".
        return { error: "Password non impostata. Contatta amministratore." };
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
        return { error: "Password non valida" };
    }

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const session = await encrypt({ user: { id: user.id, nome: user.nome, role: user.role }, expires });

    (await cookies()).set("session", session, { expires, httpOnly: true });
}

export async function logout() {
    (await cookies()).delete("session");
    redirect("/login");
}
