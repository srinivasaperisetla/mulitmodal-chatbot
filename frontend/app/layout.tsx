import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { SidebarProvider } from "@/components/ui/sidebar";


const poppins = Poppins({
  weight: ["200", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hiagents",
  description: "A platform for creating AI agents",
};

export default function RootLayout({
  children,
  session,
}: Readonly<{
  children: React.ReactNode;
  session: any;
}>) {
  return (
    <SessionProvider session={session}>
    <html lang="en">
      <body
        className={`${poppins.className} antialiased`}
      >
        <SidebarProvider>
        {children}
        <Toaster position="top-right" />
        </SidebarProvider>
      </body>
    </html>
    </SessionProvider>
  );
}
