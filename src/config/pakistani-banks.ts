export type PakistaniBank = {
  name: string;
  shortName: string;
  domain: string;
  group: "Major commercial banks" | "Additional transfer partners";
};

export const providerLogoUrl = (domain: string) =>
  `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

export const bankLogoPath = (domain: string) => `/banks/${domain.replaceAll(".", "-")}.png`;

export const pakistaniBanks: readonly PakistaniBank[] = [
  {
    name: "HBL (Habib Bank Limited)",
    shortName: "HBL",
    domain: "hbl.com",
    group: "Major commercial banks",
  },
  {
    name: "UBL (United Bank Limited)",
    shortName: "UBL",
    domain: "ubl.com.pk",
    group: "Major commercial banks",
  },
  {
    name: "Meezan Bank",
    shortName: "MEEZ",
    domain: "meezanbank.com",
    group: "Major commercial banks",
  },
  { name: "MCB Bank", shortName: "MCB", domain: "mcb.com.pk", group: "Major commercial banks" },
  {
    name: "Bank Alfalah",
    shortName: "ALF",
    domain: "bankalfalah.com",
    group: "Major commercial banks",
  },
  {
    name: "Allied Bank (ABL)",
    shortName: "ABL",
    domain: "abl.com",
    group: "Major commercial banks",
  },
  {
    name: "Bank Al Habib",
    shortName: "BAH",
    domain: "bankalhabib.com",
    group: "Major commercial banks",
  },
  {
    name: "Askari Bank",
    shortName: "ASK",
    domain: "askaribank.com",
    group: "Major commercial banks",
  },
  {
    name: "Faysal Bank",
    shortName: "FBL",
    domain: "faysalbank.com",
    group: "Major commercial banks",
  },
  {
    name: "BankIslami Pakistan",
    shortName: "BIP",
    domain: "bankislami.com.pk",
    group: "Major commercial banks",
  },
  { name: "JS Bank", shortName: "JS", domain: "jsbl.com", group: "Major commercial banks" },
  {
    name: "Bank of Punjab (BOP)",
    shortName: "BOP",
    domain: "bop.com.pk",
    group: "Major commercial banks",
  },
  {
    name: "National Bank of Pakistan (NBP)",
    shortName: "NBP",
    domain: "nbp.com.pk",
    group: "Major commercial banks",
  },
  {
    name: "Habib Metropolitan Bank",
    shortName: "HMB",
    domain: "habibmetro.com",
    group: "Major commercial banks",
  },
  {
    name: "Dubai Islamic Bank Pakistan",
    shortName: "DIB",
    domain: "dibpak.com",
    group: "Major commercial banks",
  },
  {
    name: "Sindh Bank",
    shortName: "SBL",
    domain: "sindhbank.com.pk",
    group: "Major commercial banks",
  },
  {
    name: "NayaPay",
    shortName: "NAYA",
    domain: "nayapay.com",
    group: "Additional transfer partners",
  },
  {
    name: "SadaPay",
    shortName: "SADA",
    domain: "sadapay.pk",
    group: "Additional transfer partners",
  },
  {
    name: "Standard Chartered Pakistan",
    shortName: "SC",
    domain: "sc.com",
    group: "Additional transfer partners",
  },
  {
    name: "Al Baraka Bank Pakistan",
    shortName: "ALB",
    domain: "albaraka.com.pk",
    group: "Additional transfer partners",
  },
  {
    name: "Bank of Khyber",
    shortName: "BOK",
    domain: "bok.com.pk",
    group: "Additional transfer partners",
  },
  {
    name: "Mobilink Bank",
    shortName: "MB",
    domain: "mobilinkbank.com",
    group: "Additional transfer partners",
  },
  {
    name: "HBL Microfinance",
    shortName: "HBLM",
    domain: "hblmfb.com",
    group: "Additional transfer partners",
  },
  {
    name: "NRSP Bank",
    shortName: "NRSP",
    domain: "nrspbank.com",
    group: "Additional transfer partners",
  },
  {
    name: "U Microfinance Bank",
    shortName: "U",
    domain: "ubank.com.pk",
    group: "Additional transfer partners",
  },
  {
    name: "FINCA Microfinance Bank",
    shortName: "FINCA",
    domain: "finca.pk",
    group: "Additional transfer partners",
  },
  {
    name: "Khushhali Microfinance Bank",
    shortName: "KMB",
    domain: "khushhalibank.com.pk",
    group: "Additional transfer partners",
  },
  {
    name: "Apna Microfinance Bank",
    shortName: "APNA",
    domain: "apnabank.com.pk",
    group: "Additional transfer partners",
  },
  {
    name: "PayPak",
    shortName: "PAY",
    domain: "paypak.com.pk",
    group: "Additional transfer partners",
  },
  {
    name: "Raast",
    shortName: "RAAST",
    domain: "raast.gov.pk",
    group: "Additional transfer partners",
  },
  { name: "Visa", shortName: "VISA", domain: "visa.com", group: "Additional transfer partners" },
  {
    name: "Mastercard",
    shortName: "MC",
    domain: "mastercard.com",
    group: "Additional transfer partners",
  },
];
