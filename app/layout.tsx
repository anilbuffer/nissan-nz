import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/providers/ClientProviders";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dealer Order Platform | Nissan Used Vehicle Programme",
  description: "Direct Japan-supplied used vehicle ordering portal for approved Nissan NZ dealers.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dealer Order Platform",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#070D18",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${roboto.variable} ${roboto.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0A1322] antialiased touch-scroll overflow-x-hidden selection:bg-[#E11D48] selection:text-white font-sans">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
