import { NextRequest, NextResponse } from "next/server";
import { requireShopId } from "@/lib/auth";
import { parseWorkbook, recalcAndReplaceShopSnapshot } from "@/lib/workload";
export async function POST(request: NextRequest) {
  const shopId = await requireShopId();
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Upload an Excel file." }, { status: 400 });
  const rows = parseWorkbook(Buffer.from(await file.arrayBuffer()));
  await recalcAndReplaceShopSnapshot(shopId, rows, file.name);
  return NextResponse.json({ ok: true, rowCount: rows.length });
}
