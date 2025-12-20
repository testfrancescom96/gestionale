/**
 * Script per impostare role=ADMIN per l'utente admin
 * Esegui con: node scripts/set-admin-role.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function setAdminRole() {
    console.log("=== IMPOSTAZIONE RUOLO ADMIN ===\n");

    // Lista tutti gli operatori
    const operatori = await prisma.operatore.findMany({
        select: { id: true, nome: true, role: true, email: true }
    });

    console.log("Operatori trovati:");
    operatori.forEach(op => {
        console.log(`  - ${op.nome} (role: ${op.role || 'null'})`);
    });

    // Trova e aggiorna l'utente "admin"
    const admin = await prisma.operatore.findUnique({
        where: { nome: "admin" }
    });

    if (admin) {
        if (admin.role !== "ADMIN") {
            await prisma.operatore.update({
                where: { nome: "admin" },
                data: { role: "ADMIN" }
            });
            console.log("\n✅ Utente 'admin' aggiornato con role=ADMIN");
        } else {
            console.log("\n✅ Utente 'admin' già con role=ADMIN");
        }
    } else {
        console.log("\n⚠️ Utente 'admin' non trovato!");
    }

    // Se vuoi impostare anche un altro utente come admin
    // const result = await prisma.operatore.updateMany({
    //     where: { nome: { contains: "goon" } },
    //     data: { role: "ADMIN" }
    // });
    // console.log(`Aggiornati ${result.count} utenti`);

    await prisma.$disconnect();
}

setAdminRole().catch(console.error);
