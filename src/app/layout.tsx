import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import ClientProviders from "./ClientProviders";
import Sidebar from "./Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sparkles",
  description: "Notebooks with :sparkles:",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
          <div className="drawer drawer-open">
            <input type="checkbox" className="drawer-toggle" />
            <div className="drawer-content">{children}</div>
            <div className="drawer-side">
              <Sidebar />
            </div>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
