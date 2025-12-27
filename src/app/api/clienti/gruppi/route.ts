
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

        // Fetch all participants linked to relevant practices
        // Filter by tipologia containing generic group terms if needed, 
        // or just fetch all and let UI filter? No, fetch relevant ones.
        const relevantTypes = ["CROCIERA", "BUS", "TOUR", "PELLEGRINAGGIO", "GRUPPO", "EVENTO", "VIAGGIO DI GRUPPO"];

        // We fetch participants and map them manually
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
                        tipologia: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Client-side aggregation (or manual here) to merge "Same Person"
        // Key: Name + Surname + (BirthDate or Email)
        const aggregated: Record<string, AggregatedCustomer> = {};

        for (const p of participants) {
            // Create unique key
            // Using Name+Surname+DOB is safer than just name+surname
            const dob = p.dataNascita ? new Date(p.dataNascita).toISOString().split('T')[0] : 'no_dob';
            const key = `${p.nome.trim().toLowerCase()}_${p.cognome.trim().toLowerCase()}_${dob}`;

            if (!aggregated[key]) {
                aggregated[key] = {
                    id: p.id, // Use latest ID
                    nome: p.nome,
                    cognome: p.cognome,
                    email: p.email || null, // Will try to find from Pratica linked Customer if missing? Currently Schema has email on Participant
                    telefono: p.telefono || null,
                    viaggi: [],
                    totalTrips: 0
                };
            }

            // Add Trip
            const trip = {
                id: p.pratica.id,
                destinazione: p.pratica.destinazione,
                dataPartenza: p.pratica.dataPartenza,
                tipo: p.pratica.tipologia
            };

            // Prevent dupes if same person in same trip multiple times?
            if (!aggregated[key].viaggi.find(v => v.id === trip.id)) {
                aggregated[key].viaggi.push(trip);
                aggregated[key].totalTrips++;
            }
        }

        // Convert to array
        let result = Object.values(aggregated);

        // Filter by search
        if (search) {
            result = result.filter(c =>
                c.nome.toLowerCase().includes(search) ||
                c.cognome.toLowerCase().includes(search)
            );
        }

        // Sort by Total Trips desc
        result.sort((a, b) => b.totalTrips - a.totalTrips);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("Error fetching group customers:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
