// Script per vedere i clienti nel database
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const clienti = await prisma.cliente.findMany({
        orderBy: { createdAt: 'desc' }
    });

    console.log('\n=== CLIENTI NEL DATABASE ===\n');
    console.log(`Totale clienti: ${clienti.length}\n`);

    clienti.forEach((cliente, index) => {
        console.log(`${index + 1}. ${cliente.nome} ${cliente.cognome}`);
        console.log(`   CF: ${cliente.codiceFiscale}`);
        console.log(`   Indirizzo: ${cliente.indirizzo}, ${cliente.citta}`);
        console.log(`   Tel: ${cliente.telefono || 'N/A'}`);
        console.log(`   Email: ${cliente.email || 'N/A'}`);
        console.log(`   Creato: ${cliente.createdAt}`);
        console.log('');
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
