import Link from "next/link";
import { prisma } from "@/lib/db";
import { UnifiedHeader } from "@/components/dashboard/UnifiedHeader";
import { IndividualiSection } from "@/components/dashboard/IndividualiSection";
import { GruppiSection } from "@/components/dashboard/GruppiSection";

async function getDashboardData() {
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const [
    // 1. Stats Individuali
    totalOpen,
    departingSoon,

    // 2. Stats Gruppi (Woo)
    totalEvents,
    totalOrders, // Total orders ever

    // 3. Lists
    recentPratiche,
    upcomingEvents
  ] = await Promise.all([
    // Indiv Stats
    prisma.pratica.count({ where: { stato: { notIn: ['CONFERMATO', 'ANNULLATO'] } } }), // "In Lavorazione" ish (DA_ELABORARE etc)
    prisma.pratica.count({
      where: {
        dataPartenza: {
          gte: today,
          lte: nextWeek
        },
        stato: 'CONFERMATO'
      }
    }),

    // Gruppi Stats
    prisma.wooProduct.count({ where: { status: 'publish' } }),
    prisma.wooOrder.count(),

    // Recent List
    prisma.pratica.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: { cliente: true }
    }),

    // Upcoming Events (WooProduct with eventDate >= today)
    prisma.wooProduct.findMany({
      where: {
        // eventDate: { gte: today }, // Might fail if eventDate null, handle carefully
        // Prisma doesn't support easy "gte" on nullables effectively without check.
        // But usually filtered by status.
        eventDate: { not: null }, // Filter only dates
        status: 'publish'
      },
      orderBy: { eventDate: 'asc' },
      take: 10,
      include: {
        operational: true,
        _count: {
          select: { orderItems: true } // Rough count of items sold
        }
      }
    })
  ]);

  // Client-side filter for dates on upcomingEvents if DB filter is tricky with nulls
  const validUpcoming = upcomingEvents.filter(e => e.eventDate && new Date(e.eventDate) >= new Date(new Date().setHours(0, 0, 0, 0)));

  return {
    individuali: {
      stats: {
        totalOpen,
        departingSoon,
        overduePayments: 0 // Placeholder for now
      },
      recent: recentPratiche
    },
    gruppi: {
      stats: {
        totalEvents,
        totalOrders
      },
      upcoming: validUpcoming
    }
  };
}

export default async function HomePage() {
  const data = await getDashboardData();

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans">
      <UnifiedHeader />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
        {/* Left Column: Individuali */}
        <div className="h-full">
          <IndividualiSection
            stats={data.individuali.stats}
            recentPratiche={data.individuali.recent}
          />
        </div>

        {/* Right Column: Gruppi */}
        <div className="h-full border-l lg:pl-8 border-gray-200 border-dashed lg:border-solid lg:border-l-2 lg:border-gray-200/50">
          <GruppiSection
            stats={data.gruppi.stats}
            upcomingEvents={data.gruppi.upcoming}
          />
        </div>
      </div>
    </div>
  );
}
