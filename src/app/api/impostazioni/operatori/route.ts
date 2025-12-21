
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from 'crypto';

// Generate a random 8-character password
function generatePassword(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export async function GET(request: NextRequest) {
    try {
        // @ts-ignore
        const operatori = await prisma.operatore.findMany({
            orderBy: { nome: 'asc' }
        });
        return NextResponse.json(operatori);
    } catch (error) {
        return NextResponse.json({ error: "Errore recupero operatori" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        if (!body.nome) {
            return NextResponse.json({ error: "Nome obbligatorio" }, { status: 400 });
        }

        // Generate a random password for the new operator
        const plainPassword = generatePassword();

        // Hash the password using crypto (simple hash, not bcrypt for simplicity)
        const hashedPassword = crypto.createHash('sha256').update(plainPassword).digest('hex');

        // @ts-ignore
        const operatore = await prisma.operatore.create({
            data: {
                nome: body.nome.toUpperCase(),
                email: body.email,
                password: hashedPassword
            }
        });

        // Return operatore with plaintext password (only this one time!)
        return NextResponse.json({
            ...operatore,
            generatedPassword: plainPassword // Return plaintext to display to user
        });
    } catch (error) {
        return NextResponse.json({ error: "Errore creazione operatore" }, { status: 500 });
    }
}
