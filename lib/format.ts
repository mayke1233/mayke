export function brl(value: number): string {
  const sign = value < 0 ? "-" : "";
  const [whole, fraction] = Math.abs(value).toFixed(2).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sign}R$ ${grouped},${fraction}`;
}

export function pct(value: number, digits = 1): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(digits).replace(".", ",")}%`;
}

export function pp(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(1).replace(".", ",")} pp`;
}

export function num(value: number, digits = 0): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function when(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function daypart(iso: string): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date(iso)),
  );
  if (hour < 6) return "madrugada";
  if (hour < 12) return "manhã";
  if (hour < 18) return "tarde";
  return "noite";
}

export function meetingTitle(now: Date): string {
  const date = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
  })
    .format(now)
    .replace(".", "");
  const time = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(now);
  return `Reunião · ${date} · ${time}`;
}

export function coverLabel(days: number): string {
  if (!Number.isFinite(days)) return "sem giro";
  return `${days.toFixed(1).replace(".", ",")} dias`;
}

export function joinPt(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;
}
