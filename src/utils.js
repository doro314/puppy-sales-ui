export function formatKey(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase());
}

export function formatValue(key, value) {
  if (value === null || value === undefined || value === "") return "——";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (key === "weightAsOf" && typeof value === "object") {
    if (!value.value && !value.asOf) return "——";
    return `${value.value ?? "——"} · ${value.asOf ? new Date(value.asOf + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "——"}`;
  }
  if ((key.toLowerCase().includes("date") || key === "readyToAdoptDate") && typeof value === "string") {
    const d = new Date(value + "T00:00:00");
    return isNaN(d) ? "——" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return String(value);
}
