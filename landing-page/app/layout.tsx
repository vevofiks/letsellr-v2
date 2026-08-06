import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display, Open_Sans } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const openSans = Open_Sans({
  variable: "--font-google-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Letsellr | Find Properties Direct from Owners",
  description:
    "Browse admin-verified apartments, villas, PG & hostels across India. Connect directly with property owners — no middlemen, transparent pricing.",
  keywords: [
    "property in India",
    "verified properties",
    "direct from owner",
    "buy property",
    "rent apartment",
    "luxury villas",
    "PG hostels India",
    "Kozhikode real estate",
    "Kerala properties",
    "letsellr",
  ],
  authors: [{ name: "Letsellr", url: "https://letsellr.in" }],
  metadataBase: new URL("https://letsellr.in"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Letsellr | Find Properties Direct from Owners",
    description:
      "Admin-verified properties across India. Direct owner connect, transparent pricing.",
    url: "https://letsellr.in",
    siteName: "Letsellr",
    images: [
      {
        url: "/images/hero-villa.png",
        width: 1200,
        height: 630,
        alt: "Letsellr — Premium Property Platform",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Letsellr | Find Properties Direct from Owners",
    description:
      "Admin-verified properties across India. Direct owner connect, transparent pricing.",
    images: ["/images/hero-villa.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakartaSans.variable} ${playfairDisplay.variable} ${openSans.variable} h-full antialiased light`}
    >
      <body className="min-h-full flex flex-col bg-[#FAFAF8] text-[#0F0F11] font-sans selection:bg-black selection:text-white">
        {children}
      </body>
    </html>
  );
}


