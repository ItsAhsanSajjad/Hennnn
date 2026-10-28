import type { Metadata, Viewport } from "next";

import { brand } from "@/config/brand";
import { siteConfig } from "@/config/site";
import "@/styles/globals.css";

export const viewport: Viewport = {
  themeColor: "#061A2B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.metadataBase),
  title: {
    default: siteConfig.title,
    template: `%s | ${brand.name}`,
  },
  description: siteConfig.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: brand.name,
  },
  twitter: { card: "summary", title: siteConfig.title, description: siteConfig.description },
  icons: {
    icon: [
      { url: "/brand/growmeta-egg-icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/brand/growmeta-egg-icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/brand/growmeta-egg-icon.png",
    shortcut: "/brand/growmeta-egg-icon-192.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
