"use client";

import { useMemo, useState } from "react";

type ProviderKey = "gmail" | "office365" | "custom";

const PRESETS: Record<ProviderKey, { label: string; host: string; port: string; secure: boolean }> = {
  gmail: { label: "Gmail", host: "smtp.gmail.com", port: "587", secure: false },
  office365: { label: "Microsoft 365", host: "smtp.office365.com", port: "587", secure: false },
  custom: { label: "Custom", host: "", port: "587", secure: false },
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
}: {
  smtpProvider: string;
  smtpHost: string;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUser: string;
  smtpFrom: string;
  reportSubjectPrefix: string;
  smtpPasswordConfigured: boolean;
}) {
  const [provider, setProvider] = useState<ProviderKey>(
    smtpProvider === "gmail" || smtpProvider === "office365" || smtpProvider === "custom"
      ? smtpProvider
      : "gmail"
  );
  const [host, setHost] = useState(smtpHost || PRESETS.gmail.host);
  const [port, setPort] = useState(String(smtpPort || 587));
  const [secure, setSecure] = useState(Boolean(smtpSecure));
  const [user, setUser] = useState(smtpUser || "");
  const [from, setFrom] = useState(smtpFrom || "");
  const [subjectPrefix, setSubjectPrefix] = useState(reportSubjectPrefix || "");
  const [status, setStatus] = useState("");

  const providerHint = useMemo(() => {
    if (provider === "gmail") return "Use a Gmail address here. The SMTP password should be a Google app password, not your normal Gmail password.";
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
            Save the mail provider settings here so you can use Gmail now and switch to Microsoft 365 later.
          </p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-medium ${smtpPasswordConfigured ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
          {smtpPasswordConfigured ? "SMTP password detected in environment" : "SMTP password missing from environment"}
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
            <option value="gmail">Gmail</option>
            <option value="office365">Microsoft 365</option>
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
          <label className="mb-1 block text-sm font-medium text-slate-700">SMTP Host</label>
          <input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder="smtp.gmail.com"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">SMTP Port</label>
          <input
            value={port}
            onChange={(e) => setPort(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="587"
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">SMTP Username</label>
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
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={secure} onChange={(e) => setSecure(e.target.checked)} />
        Use secure SSL connection (normally leave this off for Gmail and Microsoft 365 on port 587)
      </label>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-800">Password handling</p>
        <p className="mt-1">
          For safety, the SMTP password is not stored in the app. Keep only the password in your environment as <code>SMTP_PASS</code>.
        </p>
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
