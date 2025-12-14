-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "codiceFiscale" TEXT,
    "dataNascita" DATETIME,
    "luogoNascita" TEXT,
    "email" TEXT,
    "telefono" TEXT NOT NULL,
    "telefono2" TEXT,
    "indirizzo" TEXT,
    "citta" TEXT,
    "cap" TEXT,
    "provincia" TEXT,
    "tipoDocumento" TEXT,
    "numeroDocumento" TEXT,
    "scadenzaDocumento" DATETIME,
    "rilasciatoA" TEXT,
    "tipologia" TEXT NOT NULL DEFAULT 'NUOVO',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Pratica" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" INTEGER,
    "clienteId" TEXT NOT NULL,
    "dataRichiesta" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "operatore" TEXT NOT NULL,
    "tipologia" TEXT NOT NULL,
    "destinazione" TEXT NOT NULL,
    "periodoRichiesto" TEXT,
    "dataPartenza" DATETIME,
    "dataRitorno" DATETIME,
    "numPartecipanti" INTEGER NOT NULL DEFAULT 1,
    "numAdulti" INTEGER NOT NULL DEFAULT 1,
    "numBambini" INTEGER NOT NULL DEFAULT 0,
    "etaBambini" TEXT,
    "tipologiaCamera" TEXT,
    "cittaPartenza" TEXT,
    "budgetCliente" REAL,
    "prezzoVendita" REAL,
    "costoFornitore" REAL,
    "commissione" REAL,
    "margine" REAL,
    "fornitoreId" TEXT,
    "nomeFornitore" TEXT,
    "regimeIVA" TEXT DEFAULT '74TER',
    "aliquotaIVA" REAL DEFAULT 0,
    "note" TEXT,
    "richiesteSpeciali" TEXT,
    "stato" TEXT NOT NULL DEFAULT 'DA_ELABORARE',
    "feedbackCliente" TEXT,
    "contratoGenerato" BOOLEAN NOT NULL DEFAULT false,
    "dataContratto" DATETIME,
    "contratoFirmato" BOOLEAN NOT NULL DEFAULT false,
    "dataFirma" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pratica_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pratica_fornitoreId_fkey" FOREIGN KEY ("fornitoreId") REFERENCES "Fornitore" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Partecipante" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "praticaId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cognome" TEXT NOT NULL,
    "codiceFiscale" TEXT,
    "dataNascita" DATETIME,
    "luogoNascita" TEXT,
    "tipoDocumento" TEXT,
    "numeroDocumento" TEXT,
    "scadenzaDocumento" DATETIME,
    "rilasciatoA" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'ADULTO',
    "eta" INTEGER,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Partecipante_praticaId_fkey" FOREIGN KEY ("praticaId") REFERENCES "Pratica" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fornitore" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ragioneSociale" TEXT NOT NULL,
    "tipoFornitore" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "sitoWeb" TEXT,
    "indirizzo" TEXT,
    "citta" TEXT,
    "cap" TEXT,
    "provincia" TEXT,
    "partitaIVA" TEXT,
    "codiceFiscale" TEXT,
    "note" TEXT,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "praticaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "importo" REAL NOT NULL,
    "dataScadenza" DATETIME NOT NULL,
    "dataPagamento" DATETIME,
    "metodoPagamento" TEXT,
    "stato" TEXT NOT NULL DEFAULT 'DA_PAGARE',
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pagamento_praticaId_fkey" FOREIGN KEY ("praticaId") REFERENCES "Pratica" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_codiceFiscale_key" ON "Cliente"("codiceFiscale");

-- CreateIndex
CREATE INDEX "Cliente_cognome_nome_idx" ON "Cliente"("cognome", "nome");

-- CreateIndex
CREATE INDEX "Cliente_telefono_idx" ON "Cliente"("telefono");

-- CreateIndex
CREATE INDEX "Cliente_email_idx" ON "Cliente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pratica_numero_key" ON "Pratica"("numero");

-- CreateIndex
CREATE INDEX "Pratica_numero_idx" ON "Pratica"("numero");

-- CreateIndex
CREATE INDEX "Pratica_clienteId_idx" ON "Pratica"("clienteId");

-- CreateIndex
CREATE INDEX "Pratica_stato_idx" ON "Pratica"("stato");

-- CreateIndex
CREATE INDEX "Pratica_dataPartenza_idx" ON "Pratica"("dataPartenza");

-- CreateIndex
CREATE INDEX "Partecipante_praticaId_idx" ON "Partecipante"("praticaId");

-- CreateIndex
CREATE UNIQUE INDEX "Fornitore_partitaIVA_key" ON "Fornitore"("partitaIVA");

-- CreateIndex
CREATE INDEX "Fornitore_ragioneSociale_idx" ON "Fornitore"("ragioneSociale");

-- CreateIndex
CREATE INDEX "Pagamento_praticaId_idx" ON "Pagamento"("praticaId");

-- CreateIndex
CREATE INDEX "Pagamento_dataScadenza_idx" ON "Pagamento"("dataScadenza");

-- CreateIndex
CREATE INDEX "Pagamento_stato_idx" ON "Pagamento"("stato");
