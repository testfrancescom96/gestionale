import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestionale Agenzia Viaggi",
  description: "Sistema di gestione pratiche per agenzia viaggi",
};

import { getSession } from "@/lib/auth";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession(); // Server-side fetch

  return (
    <html lang="it">
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden bg-gray-50">
          <Sidebar user={session?.user} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
