import { NextRequest, NextResponse } from "next/server";
import { requireShopId } from "@/lib/auth";
import { parseWorkbook, recalcAndReplaceShopSnapshot } from "@/lib/workload";
import { parseProductionPdf } from "@/lib/pdfProductionParser";
import { normalizeTechnicianName, UNASSIGNED_TECH_NAME } from "@/lib/stages";

function detectFileType(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "PDF" as const;
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "Excel" as const;
  return null;
}

export async function POST(request: NextRequest) {
  const shopId = await requireShopId();
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Upload an Excel or PDF file." }, { status: 400 });
  }

  const fileType = detectFileType(file.name);
  if (!fileType) {
    return NextResponse.json({ error: "Only .xlsx, .xls, and .pdf files are supported." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const rows = fileType === "PDF" ? await parseProductionPdf(buffer) : parseWorkbook(buffer);

  if (!rows.length) {
    return NextResponse.json({ error: `No importable rows were found in this ${fileType.toLowerCase()} file.` }, { status: 400 });
  }

  await recalcAndReplaceShopSnapshot(shopId, rows, file.name);

  const techsFound = new Set(
    rows
      .map((row) => normalizeTechnicianName(row.technician) || UNASSIGNED_TECH_NAME)
      .filter(Boolean)
  ).size;
  const unassignedJobs = rows.filter(
    (row) => (normalizeTechnicianName(row.technician) || UNASSIGNED_TECH_NAME) === UNASSIGNED_TECH_NAME
  ).length;

  return NextResponse.json({
    ok: true,
    rowCount: rows.length,
    fileType,
    techsFound,
    unassignedJobs,
    skippedRows: 0,
  });
}
