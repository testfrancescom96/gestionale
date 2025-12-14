import Link from "next/link";
import { prisma } from "@/lib/db";
import { FileText, Users, Building2, TrendingUp } from "lucide-react";

async function getDashboardStats() {
  const [
    totalPratiche,
    praticheConfermate,
    totalClienti,
    totalFornitori,
  ] = await Promise.all([
    prisma.pratica.count(),
    prisma.pratica.count({ where: { stato: "CONFERMATO" } }),
    prisma.cliente.count(),
    prisma.fornitore.count(),
  ]);

  return {
    totalPratiche,
    praticheConfermate,
    totalClienti,
    totalFornitori,
  };
}

export default async function HomePage() {
  const stats = await getDashboardStats();

  const cards = [
    {
      title: "Pratiche Totali",
      value: stats.totalPratiche,
      icon: FileText,
      color: "bg-blue-500",
      href: "/pratiche",
    },
    {
      title: "Confermate",
      value: stats.praticheConfermate,
      icon: TrendingUp,
      color: "bg-green-500",
      href: "/pratiche?filter=confermato",
    },
    {
      title: "Clienti",
      value: stats.totalClienti,
      icon: Users,
      color: "bg-purple-500",
      href: "/clienti",
    },
    {
      title: "Fornitori",
      value: stats.totalFornitori,
      icon: Building2,
      color: "bg-orange-500",
      href: "/fornitori",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Benvenuto nel gestionale per agenzia viaggi
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 transition-all hover:shadow-lg hover:ring-gray-900/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {card.title}
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">
                  {card.value}
                </p>
              </div>
              <div className={`rounded-lg ${card.color} p-3`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-gray-500 transition-colors group-hover:text-blue-600">
              Visualizza dettagli →
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Azioni Rapide
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/pratiche/nuova"
            className="flex items-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
          >
            <FileText className="h-5 w-5" />
            <span className="font-medium">Nuova Pratica</span>
          </Link>
          <Link
            href="/clienti/nuovo"
            className="flex items-center gap-3 rounded-lg bg-purple-600 px-4 py-3 text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg"
          >
            <Users className="h-5 w-5" />
            <span className="font-medium">Nuovo Cliente</span>
          </Link>
          <Link
            href="/scadenzario"
            className="flex items-center gap-3 rounded-lg bg-orange-600 px-4 py-3 text-white shadow-md transition-all hover:bg-orange-700 hover:shadow-lg"
          >
            <Building2 className="h-5 w-5" />
            <span className="font-medium">Scadenze</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
