import { CapacitySettingsForm } from "@/components/CapacitySettingsForm";
import { StageSettingsForm } from "@/components/StageSettingsForm";
import { ShopThresholdSettingsForm } from "@/components/ShopThresholdSettingsForm";
import { ReportRecipientsSettingsForm } from "@/components/ReportRecipientsSettingsForm";
import { EmailSettingsForm } from "@/components/EmailSettingsForm";
import { requireShopId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const shopId = await requireShopId();
  const [shop, technicians, stages] = await Promise.all([
    prisma.shop.findUniqueOrThrow({ where: { id: shopId } }),
    prisma.technician.findMany({ where: { shopId }, orderBy: { name: "asc" } }),
    prisma.stageRule.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-slate-600">
          Configure capacities, stage rules, thresholds, and report recipients for this shop.
        </p>
      </div>

      <ShopThresholdSettingsForm
        needsWorkThreshold={shop.needsWorkThreshold}
        overloadedThreshold={shop.overloadedThreshold}
      />
      <ReportRecipientsSettingsForm reportRecipients={shop.reportRecipients || ""} />
      <EmailSettingsForm
        smtpProvider={shop.smtpProvider || "gmail_api"}
        smtpHost={shop.smtpHost || "smtp.gmail.com"}
        smtpPort={shop.smtpPort}
        smtpSecure={shop.smtpSecure}
        smtpUser={shop.smtpUser || ""}
        smtpFrom={shop.smtpFrom || ""}
        reportSubjectPrefix={shop.reportSubjectPrefix || ""}
        smtpPasswordConfigured={Boolean(process.env.SMTP_PASS)}
        gmailApiConfigured={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN)}
      />
      <CapacitySettingsForm technicians={technicians} />
      <StageSettingsForm stages={stages} />
    </div>
  );
}
