import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";

const BACKUP_DIR = path.join(process.cwd(), "prisma", "backups");
const DB_PATH = path.join(process.cwd(), "prisma", "gestionale.db");

// Ensure backup directory exists
function ensureBackupDir() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
}

// GET: Stato backup e impostazioni
export async function GET() {
    try {
        let settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });

        // Se non esiste, crea con valori di default
        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: { id: 1 }
            });
        }

        // Lista backup esistenti
        ensureBackupDir();
        const backupFiles = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith('.db'))
            .sort()
            .reverse()
            .slice(0, 10); // Mostra ultimi 10

        return NextResponse.json({
            settings,
            backups: backupFiles,
            backupDir: BACKUP_DIR
        });
    } catch (error: any) {
        console.error("Error getting backup settings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Esegui backup manuale
export async function POST() {
    try {
        ensureBackupDir();

        // Nome file con timestamp
        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const backupFileName = `gestionale_${timestamp}.db`;
        const backupPath = path.join(BACKUP_DIR, backupFileName);

        // Verifica che il file sorgente esista e abbia dati
        if (!fs.existsSync(DB_PATH)) {
            throw new Error("Database file not found");
        }

        const stats = fs.statSync(DB_PATH);
        if (stats.size === 0) {
            throw new Error("Database file is empty, not backing up");
        }

        // Copia il file
        fs.copyFileSync(DB_PATH, backupPath);

        // Aggiorna stato nel database
        await prisma.systemSettings.upsert({
            where: { id: 1 },
            update: {
                lastBackupAt: now,
                lastBackupStatus: "success",
                lastBackupError: null
            },
            create: {
                id: 1,
                lastBackupAt: now,
                lastBackupStatus: "success"
            }
        });

        // Pulizia vecchi backup
        const settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });
        const retentionCount = settings?.backupRetentionCount || 48;

        const allBackups = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.startsWith('gestionale_') && f.endsWith('.db'))
            .sort()
            .reverse();

        // Elimina backup oltre il limite
        if (allBackups.length > retentionCount) {
            const toDelete = allBackups.slice(retentionCount);
            for (const file of toDelete) {
                fs.unlinkSync(path.join(BACKUP_DIR, file));
            }
        }

        return NextResponse.json({
            success: true,
            fileName: backupFileName,
            size: stats.size,
            deletedOldBackups: Math.max(0, allBackups.length - retentionCount)
        });

    } catch (error: any) {
        console.error("Backup error:", error);

        // Registra errore
        await prisma.systemSettings.upsert({
            where: { id: 1 },
            update: {
                lastBackupAt: new Date(),
                lastBackupStatus: "failed",
                lastBackupError: error.message
            },
            create: {
                id: 1,
                lastBackupAt: new Date(),
                lastBackupStatus: "failed",
                lastBackupError: error.message
            }
        });

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: Aggiorna impostazioni backup
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { backupEnabled, backupIntervalMinutes, backupRetentionCount, backupToGoogleDrive } = body;

        const settings = await prisma.systemSettings.upsert({
            where: { id: 1 },
            update: {
                ...(backupEnabled !== undefined && { backupEnabled }),
                ...(backupIntervalMinutes !== undefined && { backupIntervalMinutes }),
                ...(backupRetentionCount !== undefined && { backupRetentionCount }),
                ...(backupToGoogleDrive !== undefined && { backupToGoogleDrive })
            },
            create: {
                id: 1,
                backupEnabled: backupEnabled ?? true,
                backupIntervalMinutes: backupIntervalMinutes ?? 30,
                backupRetentionCount: backupRetentionCount ?? 48,
                backupToGoogleDrive: backupToGoogleDrive ?? false
            }
        });

        return NextResponse.json({ success: true, settings });
    } catch (error: any) {
        console.error("Error updating backup settings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
