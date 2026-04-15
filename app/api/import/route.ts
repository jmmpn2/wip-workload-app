import { NextRequest, NextResponse } from "next/server";
import { requireShopId } from "@/lib/auth";
import { parseWorkbook, recalcAndReplaceShopSnapshot } from "@/lib/workload";
import { parsePdfProductionList } from "@/lib/pdfProductionParser";
import { UNASSIGNED_TECH_NAME } from "@/lib/stages";

export async function POST(request: NextRequest) {
  const shopId = await requireShopId();
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload an Excel or PDF file." }, { status: 400 });
  }

  const fileName = file.name || "";
  const lowerName = fileName.toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());

  let rows;
  let fileType: "pdf" | "excel";

  try {
    if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
      fileType = "pdf";
      rows = await parsePdfProductionList(buffer);
    } else if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
      fileType = "excel";
      rows = parseWorkbook(buffer);
    } else {
      return NextResponse.json({ error: "Unsupported file type. Upload an Excel or PDF file." }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!rows.length) {
    return NextResponse.json({ error: "No valid rows were found in that file." }, { status: 400 });
  }

  await recalcAndReplaceShopSnapshot(shopId, rows, file.name);

  const techniciansFound = new Set(rows.filter((row) => row.technician && row.technician !== UNASSIGNED_TECH_NAME).map((row) => row.technician)).size;
  const unassignedJobs = rows.filter((row) => row.technician === UNASSIGNED_TECH_NAME).length;

  return NextResponse.json({
    ok: true,
    fileType,
    rowCount: rows.length,
    techniciansFound,
    unassignedJobs,
    skippedRows: 0,
  });
}
