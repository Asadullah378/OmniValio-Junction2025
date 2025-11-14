import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Omni-Valio | Intelligent Food Service Platform",
  description: "A world-class, Scandinavian-inspired interface for chefs and food-service professionals",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Header />
        <main className="pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}
