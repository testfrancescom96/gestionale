
import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";

// Base Path for Invoices (Root of user's structure)
const BASE_INVOICE_PATH = path.join(process.cwd(), "FATTURE");

interface InvoiceData {
    number: string;
    date: Date;
    total: number;
    customer: {
        name: string;
        fiscalCode?: string;
        vat?: string;
        address?: string;
        city?: string;
        zip?: string;
        province?: string;
    };
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        vatRate: number;
    }[];
}

// Helper to determine type from path
function determineTypeFromPath(filePath: string): "SENT" | "RECEIVED" {
    const upper = filePath.toUpperCase();
    if (upper.includes("FATTURE RICEVUTE")) return "RECEIVED";
    return "SENT"; // Default to SENT (Fatture Emesse)
}

async function findXmlFiles(dir: string): Promise<string[]> {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    let files: string[] = [];

    for (const dirent of dirents) {
        const res = path.resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            files = files.concat(await findXmlFiles(res));
        } else {
            if ((res.toLowerCase().endsWith('.xml') || res.toLowerCase().endsWith('.xml.p7m')) && !dirent.name.startsWith('.')) {
                files.push(res);
            }
        }
    }
    return files;
}

function parseInvoiceXML(xmlContent: string, type: "SENT" | "RECEIVED"): InvoiceData | null {
    const parser = new XMLParser({
        ignoreAttributes: false,
        removeNSPrefix: true, // Remove namespace prefixes like p: or ns1:
    });

    const jsonObj = parser.parse(xmlContent);
    const root = jsonObj.FatturaElettronica;

    if (!root) return null; // Not valid Invoice

    const header = root.FatturaElettronicaHeader;
    const body = Array.isArray(root.FatturaElettronicaBody) ? root.FatturaElettronicaBody[0] : root.FatturaElettronicaBody;

    // 1. Data Documento
    const datiGenerali = body.DatiGenerali;
    const docData = datiGenerali.DatiGeneraliDocumento;

    const number = docData.Numero;
    const dateStr = docData.Data;
    const total = parseFloat(docData.ImportoTotaleDocumento || "0");

    // 2. Identify Counterparty (Partner)
    // If SENT (We are Sender) -> Partner is Cessionario (Customer)
    // If RECEIVED (We are Receiver) -> Partner is Cedente (Supplier)

    let partnerNode;
    if (type === 'SENT') {
        partnerNode = header.CessionarioCommittente;
    } else {
        partnerNode = header.CedentePrestatore;
    }

    if (!partnerNode) return null;

    const anagrafica = partnerNode.DatiAnagrafici.Anagrafica;
    const sede = partnerNode.Sede;

    const name = anagrafica.Denominazione || `${anagrafica.Nome || ''} ${anagrafica.Cognome || ''}`.trim();
    const fiscalCode = partnerNode.DatiAnagrafici.CodiceFiscale;
    let vat = null;
    if (partnerNode.DatiAnagrafici.IdFiscaleIVA) {
        vat = partnerNode.DatiAnagrafici.IdFiscaleIVA.IdCodice;
    }

    const address = sede?.Indirizzo || "";
    const city = sede?.Comune || "";
    const zip = sede?.CAP || "";
    const province = sede?.Provincia || "";

    // 3. Righe
    const items: any[] = [];
    const datiBeni = body.DatiBeniServizi;

    if (datiBeni) {
        let linee = datiBeni.DettaglioLinee;
        if (!Array.isArray(linee)) {
            linee = [linee];
        }

        for (const line of linee) {
            items.push({
                description: line.Descrizione || "Articolo",
                quantity: parseFloat(line.Quantita || "1"),
                unitPrice: parseFloat(line.PrezzoUnitario || "0"),
                totalPrice: parseFloat(line.PrezzoTotale || "0"),
                vatRate: parseFloat(line.AliquotaIVA || "0")
            });
        }
    }

    return {
        number,
        date: new Date(dateStr),
        total,
        customer: {
            name,
            fiscalCode,
            vat,
            address: `${address} - ${zip} ${city} (${province})`,
            city,
            zip,
            province
        },
        items
    };
}

export async function POST(request: NextRequest) {
    try {
        const { action } = await request.json(); // action: 'scan' | 'import'

        if (action === 'scan') {
            const files = await findXmlFiles(BASE_INVOICE_PATH);
            return NextResponse.json({
                success: true,
                count: files.length,
                files: files.map(f => path.relative(process.cwd(), f)),
                path: "FATTURE (Recursive)"
            });
        }

        if (action === 'import') {
            const files = await findXmlFiles(BASE_INVOICE_PATH);
            const errors: string[] = [];
            let importedCount = 0;

            for (const file of files) {
                // Skip p7m for now -> Need reliable p7m extraction lib or rely on user providing xml
                if (file.endsWith('.p7m')) continue;

                try {
                    const content = await fs.readFile(file, 'utf-8');
                    const fileName = path.basename(file);

                    // Determine Type
                    const type = determineTypeFromPath(file);

                    // Parse
                    const data = parseInvoiceXML(content, type);
                    if (!data) continue;

                    // Idempotency check 
                    // @ts-ignore: Prisma types lag
                    const exists = await prisma.invoice.findFirst({
                        where: {
                            number: data.number,
                            date: data.date,
                            type: type
                        }
                    });

                    if (exists) continue; // Skip duplicates

                    // Try to link customer (only if SENT)
                    let customerId = null;
                    if (type === 'SENT' && data.customer.fiscalCode) {
                        const existingCustomer = await prisma.cliente.findFirst({
                            where: { codiceFiscale: data.customer.fiscalCode }
                        });
                        if (existingCustomer) customerId = existingCustomer.id;
                    }

                    // Create Invoice
                    // @ts-ignore: Prisma types lag
                    await prisma.invoice.create({
                        data: {
                            number: data.number,
                            date: data.date,
                            type: type,
                            status: "UNPAID",
                            totalAmount: data.total,

                            // Partner Info
                            customerName: data.customer.name,
                            customerFiscalCode: data.customer.fiscalCode,
                            customerVat: data.customer.vat,
                            customerAddress: data.customer.address,

                            customerId: customerId,
                            xmlFileName: fileName,
                            items: {
                                create: data.items.map((item: any) => ({
                                    description: item.description,
                                    quantity: item.quantity,
                                    unitPrice: item.unitPrice,
                                    totalPrice: item.totalPrice,
                                    vatRate: item.vatRate
                                }))
                            }
                        }
                    });

                    importedCount++;

                } catch (e: unknown) {
                    const message = e instanceof Error ? e.message : String(e);
                    console.error(`Error importing ${file}:`, message);
                    errors.push(`${path.basename(file)}: ${message}`);
                }
            }

            return NextResponse.json({
                success: true,
                imported: importedCount,
                errors: errors
            });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal Server Error";
        console.error("Invoice Import Error:", message);
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
