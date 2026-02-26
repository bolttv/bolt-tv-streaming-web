import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Bolt TV — Premium Sports Documentaries",
  description: "Stream exclusive sports documentaries, athlete stories, and behind-the-scenes originals on Bolt TV.",
  openGraph: {
    title: "Bolt TV — Premium Sports Documentaries",
    description: "Stream exclusive sports documentaries, athlete stories, and behind-the-scenes originals on Bolt TV.",
    type: "website",
    siteName: "Bolt TV",
    images: ["/opengraph.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bolt TV — Premium Sports Documentaries",
    description: "Stream exclusive sports documentaries, athlete stories, and behind-the-scenes originals on Bolt TV.",
    images: ["/opengraph.jpg"],
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
      <head suppressHydrationWarning>
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
