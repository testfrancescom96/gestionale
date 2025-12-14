"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, Trash2, Download } from "lucide-react";

interface Documento {
    name: string;
    size: number;
    createdAt: string;
    url: string;
}

export function DocumentsList({ praticaId }: { praticaId: string }) {
    const [documents, setDocuments] = useState<Documento[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const loadDocuments = async () => {
        try {
            const res = await fetch(`/api/pratiche/${praticaId}/documenti`);
            if (res.ok) {
                const data = await res.json();
                setDocuments(data);
            }
        } catch (error) {
            console.error("Errore caricamento documenti", error);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, [praticaId]);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        setIsUploading(true);
        try {
            const res = await fetch(`/api/pratiche/${praticaId}/documenti`, {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                loadDocuments();
            } else {
                alert("Errore caricamento file");
            }
        } catch (error) {
            console.error(error);
            alert("Errore upload");
        } finally {
            setIsUploading(false);
            e.target.value = ""; // Reset input
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="mt-8 rounded-lg bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Documenti e Allegati</h3>
                <div className="relative">
                    <input
                        type="file"
                        onChange={handleUpload}
                        className="absolute inset-0 cursor-pointer opacity-0"
                        disabled={isUploading}
                    />
                    <button
                        className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                        disabled={isUploading}
                    >
                        <Upload className="h-4 w-4" />
                        {isUploading ? "Caricamento..." : "Carica File"}
                    </button>
                </div>
            </div>

            {documents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
                    <FileText className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                    <p>Nessun documento caricato.</p>
                    <p className="text-xs">Carica documenti d'identità, fatture fornitori, ecc.</p>
                </div>
            ) : (
                <ul className="divide-y divide-gray-100">
                    {documents.map((doc) => (
                        <li key={doc.name} className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <div className="rounded bg-blue-50 p-2 text-blue-600">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {formatSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                    className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                    title="Scarica"
                                >
                                    <Download className="h-4 w-4" />
                                </a>
                                {/* Delete feature to be implemented securely later if needed */}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
