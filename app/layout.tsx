import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { LanguageProvider } from "@/components/providers/language-provider";
import { CookieConsent } from "@/components/cookie-consent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://peaksnature.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PeaksNature - Homestay Booking Platform",
    template: "%s | PeaksNature",
  },
  description: "Discover unique homestay experiences in Thailand. Book authentic local accommodations, enjoy traditional hospitality, and explore nature at its finest.",
  keywords: [
    "homestay",
    "Thailand",
    "booking",
    "accommodation",
    "nature",
    "travel",
    "vacation",
    "holiday",
    "authentic stay",
    "local experience",
    "ที่พัก",
    "โฮมสเตย์",
    "ท่องเที่ยว",
  ],
  authors: [{ name: "PeaksNature" }],
  creator: "PeaksNature",
  publisher: "PeaksNature",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "th_TH",
    alternateLocale: "en_US",
    url: siteUrl,
    siteName: "PeaksNature",
    title: "PeaksNature - Homestay Booking Platform",
    description: "Discover unique homestay experiences in Thailand. Book authentic local accommodations and explore nature at its finest.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "PeaksNature - Homestay Booking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PeaksNature - Homestay Booking Platform",
    description: "Discover unique homestay experiences in Thailand. Book authentic local accommodations and explore nature at its finest.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when you have them
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  category: "travel",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1e293b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <LanguageProvider>
          {children}
          <CookieConsent />
        </LanguageProvider>
      </body>
    </html>
  );
}
