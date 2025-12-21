import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSession } from "@/lib/auth";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gestionale Agenzia Viaggi",
  description: "Sistema di gestione pratiche per agenzia viaggi",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  // Login and share pages have their own layouts
  const isLoginPage = pathname.includes("/login");
  const isSharePage = pathname.startsWith("/share");

  // Show sidebar only for authenticated users on non-special pages
  const showSidebar = session?.user && !isLoginPage && !isSharePage;

  return (
    <html lang="it">
      <body className={inter.className}>
        {showSidebar ? (
          <div className="flex h-screen overflow-hidden bg-gray-50">
            <Sidebar user={session?.user} />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        ) : (
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        )}
      </body>
    </html>
  );
}
