export function formatPaisa(value: bigint | number) {
  const paisa = typeof value === "bigint" ? Number(value) : value;
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 2,
  }).format(paisa / 100);
}

export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "Not recorded";
  return new Intl.DateTimeFormat("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}
