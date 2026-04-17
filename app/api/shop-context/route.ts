import { NextRequest, NextResponse } from "next/server";
import { setCurrentShopForSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { shopId } = await request.json();
    await setCurrentShopForSession(String(shopId || ""));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to switch shops.";
    return NextResponse.json({ error: message === "FORBIDDEN" ? "You cannot switch shops." : "Invalid shop." }, { status: 400 });
  }
}
