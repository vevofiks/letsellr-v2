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

const SITE_URL = "https://www.letsellr.in";
const APP_URL = "https://app.letsellr.in";

export const metadata: Metadata = {
  title: "Letsellr | Find Properties Direct from Owners",
  description:
    "Browse admin-verified apartments, villas, PG & hostels across India. Connect directly with property owners no middlemen, transparent pricing.",
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
  authors: [{ name: "Letsellr", url: SITE_URL }],
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  // Let Google show full-size images and untruncated snippets — property
  // listings live or die on the thumbnail in search results.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Letsellr | Find Properties Direct from Owners",
    description:
      "Admin-verified properties across India. Direct owner connect, transparent pricing.",
    url: SITE_URL,
    siteName: "Letsellr",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Letsellr — verified properties, direct from owners",
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
    images: ["/og-image.jpg"],
  },
};

// One connected @graph rather than two orphan blocks — the @id references let
// Google resolve "this WebSite is published by this Organization" instead of
// guessing at two unrelated entities.
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Letsellr",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        "@id": `${SITE_URL}/#logo`,
        url: `${SITE_URL}/images/logo.png`,
        width: 608,
        height: 559,
      },
      image: { "@id": `${SITE_URL}/#logo` },
      description:
        "Letsellr is a no-brokerage property listing platform connecting verified owners and agencies directly with buyers, tenants, and seekers across India.",
      areaServed: {
        "@type": "Country",
        name: "India",
      },
      knowsAbout: [
        "residential property",
        "commercial property",
        "property rental",
        "PG and hostel accommodation",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Letsellr",
      url: SITE_URL,
      inLanguage: "en-IN",
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${APP_URL}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "WebPage",
      "@id": `${SITE_URL}/#webpage`,
      url: `${SITE_URL}/`,
      name: "Letsellr | Find Properties Direct from Owners",
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-IN",
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}


