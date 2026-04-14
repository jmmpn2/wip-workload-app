type MailProvider = "gmail" | "gmail_api" | "office365" | "custom";

export type MailSettings = {
  provider?: MailProvider;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

function escapeHeader(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function toBase64Url(input: string) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildMimeMessage(params: {
  from: string;
  to: string[];
  subject: string;
  text: string;
  html?: string;
}) {
  const boundary = `boundary_${Date.now().toString(36)}`;
  const headers = [
    `From: ${escapeHeader(params.from)}`,
    `To: ${params.to.map(escapeHeader).join(", ")}`,
    `Subject: ${escapeHeader(params.subject)}`,
    "MIME-Version: 1.0",
  ];

  if (params.html) {
    return [
      ...headers,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      params.text,
      "",
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      params.html,
      "",
      `--${boundary}--`,
      "",
    ].join("\r\n");
  }

  return [
    ...headers,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    params.text,
    "",
  ].join("\r\n");
}

function resolveMailSettings(input?: Partial<MailSettings>) {
  const provider = ((input?.provider || process.env.EMAIL_PROVIDER || "gmail_api") as string).trim().toLowerCase();
  const settings: Partial<MailSettings> = {
    provider: (provider === "gmail" ? "gmail_api" : provider) as MailProvider,
    host: input?.host || process.env.SMTP_HOST || "",
    port: input?.port || Number(process.env.SMTP_PORT || 0) || 0,
    secure: input?.secure ?? (String(process.env.SMTP_SECURE || "false").toLowerCase() === "true"),
    user: input?.user || process.env.SMTP_USER || "",
    pass: input?.pass || process.env.SMTP_PASS || "",
    from: input?.from || process.env.SMTP_FROM || "",
  };

  if (settings.provider === "gmail_api") {
    const missing: string[] = [];
    if (!settings.user) missing.push("SMTP Username / Gmail address");
    if (!settings.from) missing.push("From Address");
    if (!process.env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID environment variable");
    if (!process.env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET environment variable");
    if (!process.env.GOOGLE_REFRESH_TOKEN) missing.push("GOOGLE_REFRESH_TOKEN environment variable");
    if (missing.length) {
      throw new Error(`Gmail API settings are incomplete. Missing: ${missing.join(", ")}.`);
    }
    return settings as MailSettings;
  }

  const missing: string[] = [];
  if (!settings.host) missing.push("SMTP Host");
  if (!settings.port) missing.push("SMTP Port");
  if (!settings.user) missing.push("SMTP Username");
  if (!settings.pass) missing.push("SMTP_PASS environment variable");
  if (!settings.from) missing.push("From Address");

  if (missing.length) {
    throw new Error(`Email settings are incomplete. Missing: ${missing.join(", ")}.`);
  }

  return settings as MailSettings;
}

async function getGoogleAccessToken() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId || "",
      client_secret: clientSecret || "",
      refresh_token: refreshToken || "",
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(`Failed to refresh Gmail API access token${data?.error ? `: ${data.error}` : "."}`);
  }

  return data.access_token as string;
}

async function sendViaGmailApi(params: {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  settings: MailSettings;
}) {
  const accessToken = await getGoogleAccessToken();
  const raw = toBase64Url(
    buildMimeMessage({
      from: params.settings.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    })
  );

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.error?.message || data?.error || response.statusText;
    throw new Error(`Gmail API send failed: ${detail}`);
  }

  return data;
}

async function sendViaSmtp(params: {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  settings: MailSettings;
}) {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: params.settings.host,
    port: Number(params.settings.port),
    secure: params.settings.secure || Number(params.settings.port) === 465,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    auth: {
      user: params.settings.user,
      pass: params.settings.pass,
    },
  });

  try {
    return await transporter.sendMail({
      from: params.settings.from,
      to: params.to.join(", "),
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
  } finally {
    transporter.close();
  }
}

export async function sendReportEmail(params: {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  mailSettings?: Partial<MailSettings>;
}) {
  const settings = resolveMailSettings(params.mailSettings);

  if (settings.provider === "gmail_api") {
    return sendViaGmailApi({
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      settings,
    });
  }

  return sendViaSmtp({
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
    settings,
  });
}
