/**
 * Script per creare utente admin con password personalizzata
 * Esegui con: node scripts/create-admin.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createAdmin() {
    console.log("=== CREAZIONE UTENTE ADMIN ===\n");

    // Configurazione
    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = "goontheroad2025";  // La password che vuoi usare
    const ADMIN_EMAIL = "admin@goontheroad.it";

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    // Controlla se esiste già
    const existing = await prisma.operatore.findUnique({
        where: { nome: ADMIN_USERNAME }
    });

    if (existing) {
        // Aggiorna solo role e password
        await prisma.operatore.update({
            where: { nome: ADMIN_USERNAME },
            data: {
                role: "ADMIN",
                password: hashedPassword
            }
        });
        console.log(`✅ Utente '${ADMIN_USERNAME}' aggiornato!`);
        console.log(`   Role: ADMIN`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
    } else {
        // Crea nuovo
        await prisma.operatore.create({
            data: {
                nome: ADMIN_USERNAME,
                email: ADMIN_EMAIL,
                password: hashedPassword,
                role: "ADMIN"
            }
        });
        console.log(`✅ Utente '${ADMIN_USERNAME}' creato!`);
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log(`   Role: ADMIN`);
    }

    // Lista tutti gli operatori
    const all = await prisma.operatore.findMany({
        select: { id: true, nome: true, role: true, email: true }
    });
    console.log("\nTutti gli operatori:");
    all.forEach(op => {
        console.log(`  - ${op.nome} (role: ${op.role})`);
    });

    await prisma.$disconnect();
    console.log("\n✅ Fatto! Ora puoi accedere con admin / goontheroad2025");
}

createAdmin().catch(console.error);
