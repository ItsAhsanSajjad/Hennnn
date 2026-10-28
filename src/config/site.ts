import { brand } from "@/config/brand";

export const siteConfig = {
  appName: brand.name,
  title: `${brand.name} - ${brand.tagline}`,
  description: brand.description,
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ?? brand.domain,
  productMode: process.env.PRODUCT_MODE ?? "DEMO",
} as const;
