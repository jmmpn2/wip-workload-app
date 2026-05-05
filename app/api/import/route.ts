import { NextRequest, NextResponse } from "next/server";
import { parseWorkbook, recalcAndReplaceShopSnapshot } from "@/lib/workload";
import { parseRepairPulsePdf } from "@/lib/repairPulsePdf";
import { logShopAudit } from "@/lib/audit";
import { assertRoleAccessOrThrow, errorResponseFromAuthError, getCurrentShopIdFromSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await assertRoleAccessOrThrow({ importWip: true });
    const shopId = await getCurrentShopIdFromSession(session);
    if (!shopId) return NextResponse.json({ error: "No shop selected." }, { status: 400 });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Upload an Excel or Repair Pulse PDF file." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const lowerName = file.name.toLowerCase();
    const isPdf = lowerName.endsWith(".pdf") || file.type === "application/pdf";
    const isExcel = lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls") || file.type.includes("spreadsheet") || file.type.includes("excel");

    if (!isPdf && !isExcel) {
      return NextResponse.json({ error: "Upload an Excel file or a Repair Pulse PDF export." }, { status: 400 });
    }

    const rows = isPdf ? await parseRepairPulsePdf(buffer) : parseWorkbook(buffer);
    if (!rows.length) {
      return NextResponse.json({ error: isPdf ? "No usable Repair Pulse rows were found in that PDF." : "No usable WIP rows were found in that Excel file." }, { status: 400 });
    }

    await recalcAndReplaceShopSnapshot(shopId, rows, file.name);
    await logShopAudit({ shopId, action: "IMPORT_WIP", entityType: "WIP_IMPORT", entityId: file.name, summary: `Imported ${rows.length} WIP row${rows.length === 1 ? "" : "s"} from ${file.name}${isPdf ? " using the Repair Pulse PDF parser" : ""}.`, metadata: { fileName: file.name, rowCount: rows.length, sourceType: isPdf ? "repair-pulse-pdf" : "excel" } });
    return NextResponse.json({ ok: true, rowCount: rows.length, sourceType: isPdf ? "PDF" : "Excel" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (["PASSWORD_CHANGE_REQUIRED", "FORBIDDEN"].includes(message)) {
      const auth = errorResponseFromAuthError(error);
      return NextResponse.json(auth.body, { status: auth.status });
    }
    console.error("Import failed", error);
    return NextResponse.json({ error: message || "Import failed." }, { status: 500 });
  }
}
