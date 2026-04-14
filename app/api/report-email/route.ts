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

    const recipients = ((data.shop as any).reportRecipients || process.env.DEFAULT_REPORT_RECIPIENTS || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (!recipients.length) {
      return NextResponse.json(
        { error: "No report recipients configured." },
        { status: 400 }
      );
    }

    const baseUrl = resolveBaseUrl(request);
    const html = buildDashboardEmailHtml({
      shopName: data.shop.name,
      baseUrl,
      totals: data.totals,
      unassigned: data.unassigned,
      techRank: data.techRank,
      stages: data.stages,
      assignableRows: data.assignableRows,
    });

    const subjectPrefix = data.shop.reportSubjectPrefix?.trim();
    const subject = subjectPrefix
      ? `${subjectPrefix} - ${data.shop.name} WIP Workload Report`
      : `${data.shop.name} WIP Workload Report`;

    const textLines = [
      `${data.shop.name} WIP Workload Report`,
      "",
      `Total Jobs WIP: ${data.totals.totalJobs}`,
      `Total Hours WIP: ${data.totals.totalHoursWip}`,
      `Remaining Hours WIP: ${data.totals.totalRemainingHours}`,
      `Jobs to Handout: ${data.unassigned.totalJobs}`,
      `Hours to Handout: ${data.unassigned.totalHours}`,
      "",
      `Dashboard Link Base: ${baseUrl}`,
    ];

    await sendReportEmail({
      to: recipients,
      subject,
      text: textLines.join("\n"),
      html,
      mailSettings: {
        host: data.shop.smtpHost || undefined,
        port: data.shop.smtpPort || undefined,
        secure: data.shop.smtpSecure,
        user: data.shop.smtpUser || undefined,
        from: data.shop.smtpFrom || undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email report failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
