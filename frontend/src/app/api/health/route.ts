import { NextResponse } from "next/server";
import { db, isBusinessDatabaseReady } from "@backend/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!isBusinessDatabaseReady()) {
      return NextResponse.json({ status: "unavailable", reason: "database_migrations_pending" }, { status: 503 });
    }
    db.prepare("SELECT 1").get();
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Health check failed.", error);
    return NextResponse.json({ status: "unavailable", reason: "health_check_failed" }, { status: 503 });
  }
}
