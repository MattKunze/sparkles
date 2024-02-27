import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Drawer } from "@/components/molecules/Drawer";

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
          <Drawer sideContent={<Sidebar />}>{children}</Drawer>
        </ClientProviders>
      </body>
    </html>
  );
}
