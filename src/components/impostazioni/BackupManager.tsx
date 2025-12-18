"use client";

import { useState, useEffect } from "react";
import { Database, RefreshCw, Check, X, Clock, HardDrive, Cloud } from "lucide-react";

interface BackupSettings {
    backupEnabled: boolean;
    backupIntervalMinutes: number;
    backupRetentionCount: number;
    backupToGoogleDrive: boolean;
    lastBackupAt: string | null;
    lastBackupStatus: string | null;
    lastBackupError: string | null;
}

export function BackupManager() {
    const [settings, setSettings] = useState<BackupSettings | null>(null);
    const [backups, setBackups] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [backingUp, setBackingUp] = useState(false);
    const [message, setMessage] = useState("");

    const intervalOptions = [
        { value: 15, label: "Ogni 15 minuti" },
        { value: 30, label: "Ogni 30 minuti" },
        { value: 60, label: "Ogni ora" },
        { value: 120, label: "Ogni 2 ore" },
        { value: 360, label: "Ogni 6 ore" },
        { value: 1440, label: "Ogni giorno" }
    ];

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await fetch("/api/backup");
            const data = await res.json();
            if (data.settings) setSettings(data.settings);
            if (data.backups) setBackups(data.backups);
        } catch (error) {
            console.error("Error loading backup settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = async (key: keyof BackupSettings, value: any) => {
        if (!settings) return;

        setSaving(true);
        try {
            const res = await fetch("/api/backup", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ [key]: value })
            });
            const data = await res.json();
            if (data.settings) {
                setSettings(data.settings);
                setMessage("Impostazione salvata!");
                setTimeout(() => setMessage(""), 2000);
            }
        } catch (error) {
            console.error("Error updating setting:", error);
            setMessage("Errore nel salvare!");
        } finally {
            setSaving(false);
        }
    };

    const executeBackup = async () => {
        setBackingUp(true);
        setMessage("");
        try {
            const res = await fetch("/api/backup", { method: "POST" });
            const data = await res.json();
            if (data.success) {
                setMessage(`✅ Backup completato: ${data.fileName}`);
                loadSettings(); // Ricarica per aggiornare lista
            } else {
                setMessage(`❌ Errore: ${data.error}`);
            }
        } catch (error: any) {
            setMessage(`❌ Errore: ${error.message}`);
        } finally {
            setBackingUp(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return "Mai";
        return new Date(dateStr).toLocaleString("it-IT");
    };

    if (loading) {
        return (
            <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                <div className="animate-pulse">Caricamento impostazioni backup...</div>
            </div>
        );
    }

    return (
        <div className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-blue-600" />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Backup Database</h3>
                        <p className="text-sm text-gray-500">Backup automatico del database per proteggere i tuoi dati</p>
                    </div>
                </div>
                <button
                    onClick={executeBackup}
                    disabled={backingUp}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    {backingUp ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                        <HardDrive className="h-4 w-4" />
                    )}
                    {backingUp ? "Backup in corso..." : "Esegui Backup Ora"}
                </button>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes("✅") ? "bg-green-50 text-green-700" : message.includes("❌") ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                    {message}
                </div>
            )}

            {/* Stato ultimo backup */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <div>
                            <p className="text-sm font-medium text-gray-700">Ultimo Backup</p>
                            <p className="text-xs text-gray-500">{formatDate(settings?.lastBackupAt || null)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {settings?.lastBackupStatus === "success" ? (
                            <span className="flex items-center gap-1 text-green-600 text-sm">
                                <Check className="h-4 w-4" /> Completato
                            </span>
                        ) : settings?.lastBackupStatus === "failed" ? (
                            <span className="flex items-center gap-1 text-red-600 text-sm" title={settings.lastBackupError || ""}>
                                <X className="h-4 w-4" /> Fallito
                            </span>
                        ) : (
                            <span className="text-gray-400 text-sm">Nessun backup</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Impostazioni */}
            <div className="space-y-4">
                {/* Toggle Abilita */}
                <div className="flex items-center justify-between py-3 border-b">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Backup Automatico</p>
                        <p className="text-xs text-gray-500">Esegui backup a intervalli regolari</p>
                    </div>
                    <button
                        onClick={() => updateSetting("backupEnabled", !settings?.backupEnabled)}
                        disabled={saving}
                        className={`relative w-12 h-6 rounded-full transition-colors ${settings?.backupEnabled ? "bg-blue-600" : "bg-gray-300"}`}
                    >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings?.backupEnabled ? "translate-x-7" : "translate-x-1"}`} />
                    </button>
                </div>

                {/* Intervallo */}
                <div className="flex items-center justify-between py-3 border-b">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Intervallo Backup</p>
                        <p className="text-xs text-gray-500">Quanto spesso eseguire il backup</p>
                    </div>
                    <select
                        value={settings?.backupIntervalMinutes || 30}
                        onChange={(e) => updateSetting("backupIntervalMinutes", parseInt(e.target.value))}
                        disabled={saving}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                    >
                        {intervalOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* Retention */}
                <div className="flex items-center justify-between py-3 border-b">
                    <div>
                        <p className="text-sm font-medium text-gray-700">Backup da Mantenere</p>
                        <p className="text-xs text-gray-500">Numero massimo di backup salvati</p>
                    </div>
                    <select
                        value={settings?.backupRetentionCount || 48}
                        onChange={(e) => updateSetting("backupRetentionCount", parseInt(e.target.value))}
                        disabled={saving}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                    >
                        <option value={24}>24 (12 ore con 30min)</option>
                        <option value={48}>48 (24 ore con 30min)</option>
                        <option value={96}>96 (48 ore con 30min)</option>
                        <option value={168}>168 (1 settimana con 1h)</option>
                    </select>
                </div>

                {/* Google Drive (futuro) */}
                <div className="flex items-center justify-between py-3 opacity-50">
                    <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4 text-gray-400" />
                        <div>
                            <p className="text-sm font-medium text-gray-700">Backup su Google Drive</p>
                            <p className="text-xs text-gray-500">Prossimamente disponibile</p>
                        </div>
                    </div>
                    <button disabled className="relative w-12 h-6 rounded-full bg-gray-300 cursor-not-allowed">
                        <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full" />
                    </button>
                </div>
            </div>

            {/* Lista ultimi backup */}
            {backups.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Ultimi Backup</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {backups.map((file, idx) => (
                            <div key={idx} className="text-xs text-gray-500 font-mono">
                                {file}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
