import { NextRequest, NextResponse } from "next/server";
import { parseWorkbook, recalcAndReplaceShopSnapshot } from "@/lib/workload";
import { logShopAudit } from "@/lib/audit";
import { assertRoleAccessOrThrow, errorResponseFromAuthError, getCurrentShopIdFromSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await assertRoleAccessOrThrow({ importWip: true });
    const shopId = await getCurrentShopIdFromSession(session);
    if (!shopId) return NextResponse.json({ error: "No shop selected." }, { status: 400 });
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Upload an Excel file." }, { status: 400 });
    const rows = parseWorkbook(Buffer.from(await file.arrayBuffer()));
    await recalcAndReplaceShopSnapshot(shopId, rows, file.name);
    await logShopAudit({ shopId, action: "IMPORT_WIP", entityType: "WIP_IMPORT", entityId: file.name, summary: `Imported ${rows.length} WIP row${rows.length === 1 ? "" : "s"} from ${file.name}.`, metadata: { fileName: file.name, rowCount: rows.length } });
    return NextResponse.json({ ok: true, rowCount: rows.length });
  } catch (error) {
    const auth = errorResponseFromAuthError(error);
    return NextResponse.json(auth.body, { status: auth.status });
  }
}
