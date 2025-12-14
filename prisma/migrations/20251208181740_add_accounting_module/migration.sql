-- CreateTable
CREATE TABLE "FatturaVendita" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "anno" INTEGER NOT NULL,
    "progressivo" INTEGER NOT NULL,
    "praticaId" TEXT,
    "clienteId" TEXT NOT NULL,
    "dataEmissione" DATETIME NOT NULL,
    "dataScadenza" DATETIME,
    "imponibile" REAL NOT NULL,
    "aliquotaIVA" REAL NOT NULL,
    "importoIVA" REAL NOT NULL,
    "totale" REAL NOT NULL,
    "regimeFiscale" TEXT NOT NULL,
    "tipoDocumento" TEXT NOT NULL DEFAULT 'FATTURA',
    "oggetto" TEXT NOT NULL,
    "note" TEXT,
    "stato" TEXT NOT NULL DEFAULT 'EMESSA',
    "importoPagato" REAL NOT NULL DEFAULT 0,
    "fatturaElettronicaInviata" BOOLEAN NOT NULL DEFAULT false,
    "dataInvioSDI" DATETIME,
    "numeroProtocolloSDI" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FatturaVendita_praticaId_fkey" FOREIGN KEY ("praticaId") REFERENCES "Pratica" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FatturaVendita_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FatturaAcquisto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numeroFornitore" TEXT NOT NULL,
    "dataFattura" DATETIME NOT NULL,
    "dataRegistrazione" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "praticaId" TEXT,
    "fornitoreId" TEXT,
    "nomeFornitore" TEXT,
    "imponibile" REAL NOT NULL,
    "aliquotaIVA" REAL NOT NULL,
    "importoIVA" REAL NOT NULL,
    "totale" REAL NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "oggetto" TEXT NOT NULL,
    "note" TEXT,
    "dataScadenza" DATETIME,
    "stato" TEXT NOT NULL DEFAULT 'DA_PAGARE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FatturaAcquisto_praticaId_fkey" FOREIGN KEY ("praticaId") REFERENCES "Pratica" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FatturaAcquisto_fornitoreId_fkey" FOREIGN KEY ("fornitoreId") REFERENCES "Fornitore" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MovimentoBancario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" DATETIME NOT NULL,
    "descrizione" TEXT NOT NULL,
    "entrata" REAL,
    "uscita" REAL,
    "tipo" TEXT NOT NULL,
    "metodoPagamento" TEXT NOT NULL,
    "fatturaVenditaId" TEXT,
    "fatturaAcquistoId" TEXT,
    "praticaId" TEXT,
    "numeroDocumento" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MovimentoBancario_fatturaVenditaId_fkey" FOREIGN KEY ("fatturaVenditaId") REFERENCES "FatturaVendita" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MovimentoBancario_fatturaAcquistoId_fkey" FOREIGN KEY ("fatturaAcquistoId") REFERENCES "FatturaAcquisto" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MovimentoBancario_praticaId_fkey" FOREIGN KEY ("praticaId") REFERENCES "Pratica" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpesaGenerale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" DATETIME NOT NULL,
    "fornitore" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "oggetto" TEXT NOT NULL,
    "importo" REAL NOT NULL,
    "iva" REAL,
    "totale" REAL NOT NULL,
    "numeroDocumento" TEXT,
    "pagata" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" DATETIME,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "nomeFile" TEXT NOT NULL,
    "percorsoFile" TEXT NOT NULL,
    "praticaId" TEXT,
    "clienteId" TEXT,
    "fatturaVenditaId" TEXT,
    "fatturaAcquistoId" TEXT,
    "dimensioneBytes" INTEGER,
    "mimeType" TEXT,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Documento_praticaId_fkey" FOREIGN KEY ("praticaId") REFERENCES "Pratica" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Documento_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Documento_fatturaVenditaId_fkey" FOREIGN KEY ("fatturaVenditaId") REFERENCES "FatturaVendita" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Documento_fatturaAcquistoId_fkey" FOREIGN KEY ("fatturaAcquistoId") REFERENCES "FatturaAcquisto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Pratica" (
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
    "margineCalcolato" REAL,
    "percentualeMargine" REAL,
    "richiedeAcconto" BOOLEAN NOT NULL DEFAULT false,
    "percentualeAcconto" REAL DEFAULT 30,
    "importoAcconto" REAL,
    "importoSaldo" REAL,
    "dataAcconto" DATETIME,
    "dataSaldo" DATETIME,
    "statoAcconto" TEXT,
    "statoSaldo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pratica_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pratica_fornitoreId_fkey" FOREIGN KEY ("fornitoreId") REFERENCES "Fornitore" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Pratica" ("aliquotaIVA", "budgetCliente", "cittaPartenza", "clienteId", "commissione", "contratoFirmato", "contratoGenerato", "costoFornitore", "createdAt", "dataContratto", "dataFirma", "dataPartenza", "dataRichiesta", "dataRitorno", "destinazione", "etaBambini", "feedbackCliente", "fornitoreId", "id", "margine", "nomeFornitore", "note", "numAdulti", "numBambini", "numPartecipanti", "numero", "operatore", "periodoRichiesto", "prezzoVendita", "regimeIVA", "richiesteSpeciali", "stato", "tipologia", "tipologiaCamera", "updatedAt") SELECT "aliquotaIVA", "budgetCliente", "cittaPartenza", "clienteId", "commissione", "contratoFirmato", "contratoGenerato", "costoFornitore", "createdAt", "dataContratto", "dataFirma", "dataPartenza", "dataRichiesta", "dataRitorno", "destinazione", "etaBambini", "feedbackCliente", "fornitoreId", "id", "margine", "nomeFornitore", "note", "numAdulti", "numBambini", "numPartecipanti", "numero", "operatore", "periodoRichiesto", "prezzoVendita", "regimeIVA", "richiesteSpeciali", "stato", "tipologia", "tipologiaCamera", "updatedAt" FROM "Pratica";
DROP TABLE "Pratica";
ALTER TABLE "new_Pratica" RENAME TO "Pratica";
CREATE UNIQUE INDEX "Pratica_numero_key" ON "Pratica"("numero");
CREATE INDEX "Pratica_numero_idx" ON "Pratica"("numero");
CREATE INDEX "Pratica_clienteId_idx" ON "Pratica"("clienteId");
CREATE INDEX "Pratica_stato_idx" ON "Pratica"("stato");
CREATE INDEX "Pratica_dataPartenza_idx" ON "Pratica"("dataPartenza");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "FatturaVendita_numero_key" ON "FatturaVendita"("numero");

-- CreateIndex
CREATE INDEX "FatturaVendita_anno_progressivo_idx" ON "FatturaVendita"("anno", "progressivo");

-- CreateIndex
CREATE INDEX "FatturaVendita_clienteId_idx" ON "FatturaVendita"("clienteId");

-- CreateIndex
CREATE INDEX "FatturaVendita_dataEmissione_idx" ON "FatturaVendita"("dataEmissione");

-- CreateIndex
CREATE INDEX "FatturaAcquisto_fornitoreId_idx" ON "FatturaAcquisto"("fornitoreId");

-- CreateIndex
CREATE INDEX "FatturaAcquisto_dataFattura_idx" ON "FatturaAcquisto"("dataFattura");

-- CreateIndex
CREATE INDEX "FatturaAcquisto_categoria_idx" ON "FatturaAcquisto"("categoria");

-- CreateIndex
CREATE INDEX "MovimentoBancario_data_idx" ON "MovimentoBancario"("data");

-- CreateIndex
CREATE INDEX "MovimentoBancario_tipo_idx" ON "MovimentoBancario"("tipo");

-- CreateIndex
CREATE INDEX "SpesaGenerale_data_idx" ON "SpesaGenerale"("data");

-- CreateIndex
CREATE INDEX "SpesaGenerale_categoria_idx" ON "SpesaGenerale"("categoria");

-- CreateIndex
CREATE INDEX "Documento_praticaId_idx" ON "Documento"("praticaId");

-- CreateIndex
CREATE INDEX "Documento_tipo_idx" ON "Documento"("tipo");
