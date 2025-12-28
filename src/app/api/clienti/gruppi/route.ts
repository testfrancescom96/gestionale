
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

interface AggregatedCustomer {
    id: string;
    nome: string;
    cognome: string;
    email: string | null;
    telefono: string | null;
    viaggi: { id: string; destinazione: string; dataPartenza: Date; tipo: string }[];
    totalTrips: number;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search")?.toLowerCase();

        const relevantTypes = ["CROCIERA", "BUS", "TOUR", "PELLEGRINAGGIO", "GRUPPO", "EVENTO", "VIAGGIO DI GRUPPO"];

        const participants = await prisma.partecipante.findMany({
            where: {
                pratica: {
                    tipologia: {
                        in: relevantTypes
                    }
                }
            },
            include: {
                pratica: {
                    select: {
                        id: true,
                        numero: true,
                        destinazione: true,
                        dataPartenza: true,
                        tipologia: true,
                        cliente: {
                            select: {
                                email: true,
                                telefono: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        const aggregated: Record<string, AggregatedCustomer> = {};

        for (const p of participants) {
            const dob = p.dataNascita ? new Date(p.dataNascita).toISOString().split('T')[0] : 'no_dob';
            const key = `${p.nome.trim().toLowerCase()}_${p.cognome.trim().toLowerCase()}_${dob}`;

            if (!aggregated[key]) {
                aggregated[key] = {
                    id: p.id,
                    nome: p.nome,
                    cognome: p.cognome,
                    // Fallback to Main Customer Contact as participants don't store contact info directly
                    email: p.pratica.cliente?.email || null,
                    telefono: p.pratica.cliente?.telefono || null,
                    viaggi: [],
                    totalTrips: 0
                };
            }

            const trip = {
                id: p.pratica.id,
                destinazione: p.pratica.destinazione,
                dataPartenza: p.pratica.dataPartenza || new Date(), // Fallback if date missing
                tipo: p.pratica.tipologia
            };

            if (!aggregated[key].viaggi.find(v => v.id === trip.id)) {
                aggregated[key].viaggi.push(trip);
                aggregated[key].totalTrips++;
            }
        }

        let result = Object.values(aggregated);

        if (search) {
            result = result.filter(c =>
                c.nome.toLowerCase().includes(search) ||
                c.cognome.toLowerCase().includes(search)
            );
        }

        result.sort((a, b) => b.totalTrips - a.totalTrips);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Error fetching group customers:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
