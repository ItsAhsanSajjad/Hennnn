export const brand = {
  name: "GrowMeta Egg",
  shortName: "GrowMeta",
  adminName: "GrowMeta Egg Admin",
  legalName: "GrowMeta Egg customer platform",
  tagline: "Your Poultry. Your Eggs. Your Record.",
  description:
    "A clear account platform for poultry plans, egg records, payment review, and egg-sale requests.",
  domain: "https://grow-meta-egg.digital",
  disclaimer:
    "Plan records, egg-sale eligibility, rates and payment processing follow the current published terms. GrowMeta Egg does not guarantee a financial outcome.",
  support: {
    phone: "Available through the official contact channel",
    whatsapp: "Available through the official contact channel",
    email: "support@grow-meta-egg.digital",
  },
  location: "Pakistan",
  social: {
    facebook: "",
    instagram: "",
    linkedin: "",
    x: "",
  },
  legal: {
    termsVersion: "2026-07-12",
    privacyVersion: "2026-07-12",
  },
  logos: {
    mark: "/brand/growmeta-egg-icon.png",
    wordmark: "/brand/growmeta-egg-lockup.png",
    reverseWordmark: "/brand/growmeta-egg-lockup.png",
    favicon: "/brand/growmeta-egg-icon-192.png",
  },
  theme: {
    colors: {
      forest: "#103C31",
      leaf: "#176A50",
      ivory: "#F1F5F1",
      amber: "#B98528",
      charcoal: "#15221D",
      cream: "#FCFDFB",
    },
    radius: {
      sm: "6px",
      md: "8px",
      lg: "8px",
    },
  },
} as const;

export type Brand = typeof brand;
