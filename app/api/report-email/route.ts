import { NextRequest, NextResponse } from "next/server";
import { requireShopId } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { sendReportEmail } from "@/lib/mailer";
import { buildDashboardEmailHtml } from "@/lib/emailReport";

function resolveBaseUrl(request: NextRequest) {
  const explicit = process.env.APP_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const origin = request.headers.get("origin")?.trim();
  if (origin) return origin.replace(/\/$/, "");

  const host = request.headers.get("host")?.trim();
  if (host) {
    const proto = host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export async function POST(request: NextRequest) {
  try {
    const shopId = await requireShopId();
    const data = await getDashboardData(shopId);

    if (!data.rows.length) {
      return NextResponse.json(
        { error: "There is no current WIP snapshot to email yet." },
        { status: 400 }
      );
    }

    const shop = data.shop as any;

    const recipients = ((shop.reportRecipients as string | undefined) || process.env.DEFAULT_REPORT_RECIPIENTS || "")
      .split(",")
      .map((value: string) => value.trim())
      .filter(Boolean);

    if (!recipients.length) {
      return NextResponse.json(
        { error: "No report recipients configured." },
        { status: 400 }
      );
    }

    const baseUrl = resolveBaseUrl(request);
    const html = buildDashboardEmailHtml({
      shopName: shop.name,
      baseUrl,
      totals: data.totals,
      unassigned: data.unassigned,
      techRank: data.techRank,
      stages: data.stages,
      assignableRows: data.assignableRows,
    });

    const subjectPrefix = shop.reportSubjectPrefix?.trim();
    const subject = subjectPrefix
      ? `${subjectPrefix} - ${shop.name} WIP Workload Report`
      : `${shop.name} WIP Workload Report`;

    const textLines = [
      `${shop.name} WIP Workload Report`,
      "",
      `Total Jobs WIP: ${data.totals.totalJobs}`,
      `Total Hours WIP: ${data.totals.totalHoursWip}`,
      `Remaining Hours WIP: ${data.totals.totalRemainingHours}`,
      `Jobs to Handout: ${data.unassigned.totalJobs}`,
      `Hours to Handout: ${data.unassigned.totalHours}`,
      "",
      `Dashboard Link Base: ${baseUrl}`,
    ];

    console.log("[report-email] starting", {
      shopId,
      recipientCount: recipients.length,
      provider: shop.smtpProvider || process.env.EMAIL_PROVIDER || "gmail_api",
      host: shop.smtpHost || process.env.SMTP_HOST || null,
      port: shop.smtpPort || process.env.SMTP_PORT || null,
      user: shop.smtpUser || process.env.SMTP_USER || null,
    });

    await withTimeout(
      sendReportEmail({
        to: recipients,
        subject,
        text: textLines.join("\n"),
        html,
        mailSettings: {
          provider: shop.smtpProvider || undefined,
          host: shop.smtpHost || undefined,
          port: shop.smtpPort || undefined,
          secure: shop.smtpSecure,
          user: shop.smtpUser || undefined,
          from: shop.smtpFrom || undefined,
        },
      }),
      25000,
      "Email send timed out after 25 seconds."
    );

    console.log("[report-email] sent", { shopId, recipientCount: recipients.length });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email report failed.";
    console.error("[report-email] failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
