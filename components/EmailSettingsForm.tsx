"use client";

import { useMemo, useState } from "react";

type ProviderKey = "gmail_api" | "office365" | "custom";

const PRESETS: Record<ProviderKey, { label: string; host: string; port: string; secure: boolean }> = {
  gmail_api: { label: "Gmail API", host: "smtp.gmail.com", port: "587", secure: false },
  office365: { label: "Microsoft 365 SMTP", host: "smtp.office365.com", port: "587", secure: false },
  custom: { label: "Custom SMTP", host: "", port: "587", secure: false },
};

export function EmailSettingsForm({
  smtpProvider,
  smtpHost,
  smtpPort,
  smtpSecure,
  smtpUser,
  smtpFrom,
  reportSubjectPrefix,
  smtpPasswordConfigured,
  gmailApiConfigured,
}: {
  smtpProvider: string;
  smtpHost: string;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUser: string;
  smtpFrom: string;
  reportSubjectPrefix: string;
  smtpPasswordConfigured: boolean;
  gmailApiConfigured: boolean;
}) {
  const normalizedProvider: ProviderKey =
    smtpProvider === "office365" || smtpProvider === "custom"
      ? smtpProvider
      : "gmail_api";

  const [provider, setProvider] = useState<ProviderKey>(normalizedProvider);
  const [host, setHost] = useState(smtpHost || PRESETS.gmail_api.host);
  const [port, setPort] = useState(String(smtpPort || 587));
  const [secure, setSecure] = useState(Boolean(smtpSecure));
  const [user, setUser] = useState(smtpUser || "");
  const [from, setFrom] = useState(smtpFrom || "");
  const [subjectPrefix, setSubjectPrefix] = useState(reportSubjectPrefix || "");
  const [status, setStatus] = useState("");

  const providerHint = useMemo(() => {
    if (provider === "gmail_api") return "Recommended for Railway. This keeps your Gmail sender address but avoids Gmail SMTP timeouts. Gmail API credentials stay in the Railway environment.";
    if (provider === "office365") return "Use your Microsoft 365 mailbox address here. The SMTP password stays in the server environment.";
    return "Use this if your company later wants a different SMTP provider.";
  }, [provider]);

  function applyPreset(nextProvider: ProviderKey) {
    setProvider(nextProvider);
    const preset = PRESETS[nextProvider];
    if (preset.host) setHost(preset.host);
    setPort(preset.port);
    setSecure(preset.secure);
    setStatus("");
  }

  async function save() {
    setStatus("Saving...");

    const res = await fetch("/api/settings/shop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        smtpProvider: provider,
        smtpHost: host,
        smtpPort: Number(port || 0),
        smtpSecure: secure,
        smtpUser: user,
        smtpFrom: from,
        reportSubjectPrefix: subjectPrefix,
      }),
    });

    const json = await res.json().catch(() => ({}));
    setStatus(res.ok ? "Saved." : json.error || "Save failed.");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Email Delivery Settings</h2>
          <p className="mt-1 text-sm text-slate-600">
            Use Gmail API on Railway to keep your Gmail sender address without depending on SMTP connectivity.
          </p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-medium ${provider === "gmail_api" ? (gmailApiConfigured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700") : (smtpPasswordConfigured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}`}>
          {provider === "gmail_api"
            ? (gmailApiConfigured ? "Gmail API credentials detected" : "Gmail API credentials missing")
            : (smtpPasswordConfigured ? "SMTP password detected in environment" : "SMTP password missing from environment")}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Provider</label>
          <select
            value={provider}
            onChange={(e) => applyPreset(e.target.value as ProviderKey)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="gmail_api">Gmail API</option>
            <option value="office365">Microsoft 365 SMTP</option>
            <option value="custom">Custom SMTP</option>
          </select>
          <p className="mt-1 text-xs text-slate-500">{providerHint}</p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Report Subject Prefix</label>
          <input
            value={subjectPrefix}
            onChange={(e) => setSubjectPrefix(e.target.value)}
            placeholder="Optional, ex: Creve Coeur"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Sender Email / Username</label>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="your-email@gmail.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">From Address</label>
          <input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="your-email@gmail.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">SMTP Host</label>
          <input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder={provider === "office365" ? "smtp.office365.com" : "smtp.gmail.com"}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            disabled={provider === "gmail_api"}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">SMTP Port</label>
          <input
            value={port}
            onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="587"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            disabled={provider === "gmail_api"}
          />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={secure} onChange={(e) => setSecure(e.target.checked)} disabled={provider === "gmail_api"} />
        Use secure SSL connection (ignored for Gmail API)
      </label>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        {provider === "gmail_api" ? (
          <>
            <p className="font-medium text-slate-800">Gmail API environment variables</p>
            <p className="mt-1">Set these in Railway Variables: <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>, and <code>GOOGLE_REFRESH_TOKEN</code>.</p>
            <p className="mt-2">The Gmail address above must match the Gmail account that granted access.</p>
          </>
        ) : (
          <>
            <p className="font-medium text-slate-800">Password handling</p>
            <p className="mt-1">For safety, the SMTP password is not stored in the app. Keep only the password in your environment as <code>SMTP_PASS</code>.</p>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={save}
        className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-white"
      >
        Save Email Settings
      </button>

      {status ? <p className="mt-3 text-sm text-slate-600">{status}</p> : null}
    </div>
  );
}
