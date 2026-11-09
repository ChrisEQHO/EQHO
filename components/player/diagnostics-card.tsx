"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Stethoscope } from "lucide-react";
import {
  buildDiagnosticsRows,
  checkLocalStorage,
  describePlatform,
  formatDiagnosticsReport,
  type AuthStatus,
} from "@/lib/diagnostics";

type NativeInfo = { version: string; build: string; platform: string | null };

function useNativeInfo(): NativeInfo {
  const [info, setInfo] = useState<NativeInfo>({
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? "",
    build: process.env.NEXT_PUBLIC_BUILD_NUMBER ?? "",
    platform: null,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const platform = Capacitor.getPlatform();
        const { App } = await import("@capacitor/app");
        const appInfo = await App.getInfo();
        if (!cancelled) setInfo({ version: appInfo.version, build: appInfo.build, platform });
      } catch {
        // Web build or plugin unavailable: keep the build-time values.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}

export function DiagnosticsCard({
  online,
  auth,
  compact = false,
}: {
  online: boolean;
  auth: AuthStatus;
  compact?: boolean;
}) {
  const native = useNativeInfo();
  const [copied, setCopied] = useState(false);
  const [storageOk] = useState(() => checkLocalStorage());

  const rows = useMemo(
    () =>
      buildDiagnosticsRows({
        appVersion: native.version,
        buildNumber: native.build || (native.platform ? "" : "Web"),
        platform: describePlatform({
          nativePlatform: native.platform,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          maxTouchPoints: typeof navigator !== "undefined" ? navigator.maxTouchPoints : 0,
        }),
        webBundleVersion: process.env.NEXT_PUBLIC_WEB_BUNDLE_VERSION ?? "",
        online,
        auth,
        localStorageAvailable: storageOk,
      }),
    [native, online, auth, storageOk],
  );

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(formatDiagnosticsReport(rows));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.02] ${compact ? "p-3" : "p-5"}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Stethoscope size={compact ? 16 : 18} className="text-[#ff8a00]" aria-hidden="true" />
          <h3 className={`${compact ? "text-sm" : "text-lg"} font-bold text-white`}>Diagnostics</h3>
        </div>
        <button
          type="button"
          onClick={copyReport}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 transition hover:bg-white/10 active:bg-white/15"
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-white/50">
        Share these details with support if something is not working. No passwords or keys are included.
      </p>
      <dl className="flex flex-col divide-y divide-white/10 rounded-xl border border-white/10">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-4 px-3 py-2">
            <dt className="text-xs text-white/60">{row.label}</dt>
            <dd
              className={`text-xs font-semibold tabular-nums text-right ${
                (row.id === "online" && !online) || (row.id === "localStorageAvailable" && !storageOk)
                  ? "text-[#ffb35c]"
                  : "text-white"
              }`}
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
      <span className="sr-only" role="status">
        {copied ? "Diagnostics copied to clipboard" : ""}
      </span>
    </div>
  );
}
