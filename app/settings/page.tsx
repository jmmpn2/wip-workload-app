import { CapacitySettingsForm } from "@/components/CapacitySettingsForm";
import { StageSettingsForm } from "@/components/StageSettingsForm";
import { ShopThresholdSettingsForm } from "@/components/ShopThresholdSettingsForm";
import { HighlightedInsuranceSettingsForm } from "@/components/HighlightedInsuranceSettingsForm";
import { requireShopId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const shopId = await requireShopId();
  const [shop, technicians, stages, highlightedInsurers, currentRows] = await Promise.all([
    prisma.shop.findUniqueOrThrow({ where: { id: shopId } }),
    prisma.technician.findMany({ where: { shopId }, orderBy: { name: "asc" } }),
    prisma.stageRule.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.highlightedInsuranceCompany.findMany({ where: { shopId }, orderBy: { insuranceName: "asc" } }),
    prisma.currentWipRow.findMany({ where: { shopId, insurance: { not: "" } }, select: { insurance: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Settings</h1>
        <p className="mt-1 text-slate-600">
          Configure capacities, stage rules, thresholds, and highlighted insurers for this shop.
        </p>
      </div>

      <ShopThresholdSettingsForm
        needsWorkThreshold={shop.needsWorkThreshold}
        overloadedThreshold={shop.overloadedThreshold}
      />
      <HighlightedInsuranceSettingsForm
        highlightedInsurers={highlightedInsurers.map((row) => row.insuranceName)}
        availableInsurers={[...new Set(currentRows.map((row) => row.insurance))].sort((a, b) => a.localeCompare(b))}
      />
      <CapacitySettingsForm technicians={technicians} />
      <StageSettingsForm stages={stages} />
    </div>
  );
}
