import nodemailer from "nodemailer";

export type MailSettings = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

export function resolveMailSettings(input?: Partial<MailSettings>) {
  const settings: Partial<MailSettings> = {
    host: input?.host || process.env.SMTP_HOST || "",
    port: input?.port || Number(process.env.SMTP_PORT || 0) || 0,
    secure: input?.secure ?? (String(process.env.SMTP_SECURE || "false").toLowerCase() === "true"),
    user: input?.user || process.env.SMTP_USER || "",
    pass: input?.pass || process.env.SMTP_PASS || "",
    from: input?.from || process.env.SMTP_FROM || "",
  };

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

export async function sendReportEmail(params: {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  mailSettings?: Partial<MailSettings>;
}) {
  const settings = resolveMailSettings(params.mailSettings);

  const transporter = nodemailer.createTransport({
    host: settings.host,
    port: Number(settings.port),
    secure: settings.secure || Number(settings.port) === 465,
    auth: {
      user: settings.user,
      pass: settings.pass,
    },
  });

  await transporter.sendMail({
    from: settings.from,
    to: params.to.join(", "),
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
}
