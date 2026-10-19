export function redirectHostBlocked(value: string): boolean {
  try {
    const host = new URL(value).hostname.replace(/^\[|\]$/g, "");
    return host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".localhost");
  } catch {
    return false;
  }
}
