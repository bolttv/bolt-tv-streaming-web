import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "StreamMax - Premium Entertainment",
  description: "Watch the latest series, movies, and exclusive originals on StreamMax.",
  openGraph: {
    title: "StreamMax - Premium Entertainment",
    description: "Watch the latest series, movies, and exclusive originals on StreamMax.",
    type: "website",
    images: ["https://replit.com/public/images/opengraph.png"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@replit",
    title: "StreamMax",
    description: "Watch the latest series, movies, and exclusive originals on StreamMax.",
    images: ["https://replit.com/public/images/opengraph.png"],
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
