import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/providers/ClientProviders";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nissan New Zealand | Dealer Order Platform",
  description: "Direct Japan-supplied used vehicle ordering portal for approved Nissan NZ dealers. Powered by AutoHub.",
  icons: {
    icon: "/nissan-logo.png",
    apple: "/nissan-logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nissan NZ Dealer Platform",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0A0A0A] antialiased touch-scroll overflow-x-hidden selection:bg-[#C3002F] selection:text-white font-sans">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
