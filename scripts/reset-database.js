// Script per svuotare il database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Svuotamento database in corso...\n');

    // Cancella tutte le pratiche
    const deletedPratiche = await prisma.pratica.deleteMany({});
    console.log(`✓ Cancellate ${deletedPratiche.count} pratiche`);

    // Cancella tutti i clienti
    const deletedClienti = await prisma.cliente.deleteMany({});
    console.log(`✓ Cancellati ${deletedClienti.count} clienti`);

    // Cancella tutti i fornitori
    const deletedFornitori = await prisma.fornitore.deleteMany({});
    console.log(`✓ Cancellati ${deletedFornitori.count} fornitori`);

    console.log('\n✅ Database svuotato con successo!\n');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
