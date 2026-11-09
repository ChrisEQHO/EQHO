export type AuthStatus = "signed-in" | "signed-out" | "demo";

export type DiagnosticsInput = {
  appVersion: string;
  buildNumber: string;
  platform: string;
  webBundleVersion: string;
  online: boolean;
  auth: AuthStatus;
  localStorageAvailable: boolean;
};

export type DiagnosticsRow = { id: keyof DiagnosticsInput; label: string; value: string };

type StorageProbe = Pick<Storage, "setItem" | "getItem" | "removeItem">;

const PROBE_KEY = "eqho-diagnostics-probe";

export function checkLocalStorage(storage?: StorageProbe | null): boolean {
  try {
    const target = storage === undefined ? (typeof window !== "undefined" ? window.localStorage : null) : storage;
    if (!target) return false;
    target.setItem(PROBE_KEY, "1");
    const ok = target.getItem(PROBE_KEY) === "1";
    target.removeItem(PROBE_KEY);
    return ok;
  } catch {
    return false;
  }
}

export function describePlatform(input: {
  nativePlatform?: string | null;
  userAgent?: string;
  maxTouchPoints?: number;
}): string {
  const native = input.nativePlatform?.toLowerCase();
  if (native === "ios") return "iOS app";
  if (native === "android") return "Android app";
  const ua = input.userAgent ?? "";
  const isIpad = /iPad/.test(ua) || (/Macintosh/.test(ua) && (input.maxTouchPoints ?? 0) > 1);
  if (isIpad) return "Web (iPad)";
  if (/iPhone|iPod/.test(ua)) return "Web (iPhone)";
  if (/Android/.test(ua)) return "Web (Android)";
  return "Web (desktop)";
}

const AUTH_LABEL: Record<AuthStatus, string> = {
  "signed-in": "Signed in",
  "signed-out": "Signed out",
  demo: "Demo (no account)",
};

function orUnknown(value: string): string {
  const trimmed = value.trim();
  return trimmed ? trimmed : "Unknown";
}

export function buildDiagnosticsRows(input: DiagnosticsInput): DiagnosticsRow[] {
  return [
    { id: "appVersion", label: "App version", value: orUnknown(input.appVersion) },
    { id: "buildNumber", label: "Build number", value: orUnknown(input.buildNumber) },
    { id: "platform", label: "Platform", value: orUnknown(input.platform) },
    { id: "webBundleVersion", label: "Web bundle", value: orUnknown(input.webBundleVersion) },
    { id: "online", label: "Connection", value: input.online ? "Online" : "Offline" },
    { id: "auth", label: "Account", value: AUTH_LABEL[input.auth] },
    {
      id: "localStorageAvailable",
      label: "Local storage",
      value: input.localStorageAvailable ? "Available" : "Unavailable",
    },
  ];
}

export function formatDiagnosticsReport(rows: DiagnosticsRow[], generatedAt: Date = new Date()): string {
  const lines = rows.map((row) => `${row.label}: ${row.value}`);
  return ["EQHO Player diagnostics", `Generated: ${generatedAt.toISOString()}`, ...lines].join("\n");
}
