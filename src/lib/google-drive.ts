import { google } from 'googleapis';
import path from 'path';
import { Readable } from 'stream';

export class GoogleDriveService {
    private drive;
    private rootFolderId: string;

    constructor() {
        const auth = new google.auth.GoogleAuth({
            keyFile: path.join(process.cwd(), 'google-credentials.json'),
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        this.drive = google.drive({ version: 'v3', auth });
        this.rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '';
    }

    private async findOrCreateFolder(name: string, parentId: string): Promise<string> {
        const res = await this.drive.files.list({
            q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)',
        });

        if (res.data.files && res.data.files.length > 0) {
            return res.data.files[0].id!;
        }

        const fileMetadata = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
        };

        const folder = await this.drive.files.create({
            requestBody: fileMetadata,
            fields: 'id',
        });

        return folder.data.id!;
    }

    async ensureFolderStructure(eventName: string, eventDate: Date | null): Promise<string> {
        const year = eventDate ? eventDate.getFullYear().toString() : new Date().getFullYear().toString();
        const yearFolderId = await this.findOrCreateFolder(year, this.rootFolderId);
        const sanitizedEventName = eventName.replace(/[/\\?%*:|"<>]/g, '-');
        const eventFolderId = await this.findOrCreateFolder(sanitizedEventName, yearFolderId);
        return eventFolderId;
    }

    async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string, parentFolderId: string): Promise<string> {
        const existingFiles = await this.drive.files.list({
            q: `name='${fileName}' and '${parentFolderId}' in parents and trashed=false`,
            fields: 'files(id, name)',
        });

        const media = {
            mimeType: mimeType,
            body: Readable.from(fileBuffer),
        };

        if (existingFiles.data.files && existingFiles.data.files.length > 0) {
            const fileId = existingFiles.data.files[0].id!;
            await this.drive.files.update({
                fileId: fileId,
                media: media,
            });
            return fileId;
        } else {
            const fileMetadata = {
                name: fileName,
                parents: [parentFolderId],
            };

            const file = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, webViewLink',
            });

            return file.data.id!;
        }
    }

    async getFileLink(fileId: string): Promise<string> {
        const file = await this.drive.files.get({
            fileId: fileId,
            fields: 'webViewLink',
        });
        return file.data.webViewLink || '';
    }
}
