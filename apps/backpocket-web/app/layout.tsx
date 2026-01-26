import type { Metadata } from "next";
import { headers } from "next/headers";
import { DM_Sans, Fraunces } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/components/providers";
import { WebVitals } from "@/components/web-vitals";
import { SPACE_SLUG_HEADER } from "@/lib/constants/headers";
import { isCustomDomainSlug } from "@/lib/constants/public-space";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "backpocket — Your collection, beautifully shared",
  description:
    "Save content for yourself, organize it into a personal library, and optionally publish a read-only collection at your own URL.",
  keywords: ["bookmarking", "reading list", "content curation", "personal library"],
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "backpocket — Your collection, beautifully shared",
    description:
      "Save content for yourself, organize it into a personal library, and optionally publish a read-only collection at your own URL.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check if this is a custom domain request
  // Custom domains don't need Clerk (read-only public content)
  // and Clerk would fail domain validation anyway
  const headersList = await headers();
  const spaceSlug = headersList.get(SPACE_SLUG_HEADER);
  const isCustomDomain = spaceSlug ? isCustomDomainSlug(spaceSlug) : false;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === "development" && (
          <script crossOrigin="anonymous" src="//unpkg.com/react-scan/dist/auto.global.js" />
        )}
        {/* Disable Dark Reader - we have native dark mode support */}
        <meta name="darkreader-lock" />
      </head>
      <body className={`${dmSans.variable} ${fraunces.variable} font-sans antialiased`}>
        <WebVitals />
        <Analytics />
        <SpeedInsights />
        <Providers skipClerk={isCustomDomain}>{children}</Providers>
      </body>
    </html>
  );
}
