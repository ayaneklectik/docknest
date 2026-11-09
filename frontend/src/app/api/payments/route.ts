import { NextResponse } from "next/server";
import { z } from "zod";
import { consumePublicFormRateLimit } from "@backend/rate-limit";
import { submitManualPayment } from "@backend/sales";
import { contactPhoneSchema } from "@/lib/contact";

export const runtime = "nodejs";

const paymentSchema = z.object({
  orderNumber: z.string().trim().min(8).max(60),
  email: z.string().trim().email().max(254),
  phone: contactPhoneSchema,
  method: z.enum(["manual_bank", "manual_mobile", "other"]),
  reference: z.string().trim().min(2).max(160),
  amountMinor: z.number().int().min(1).max(100_000_000_000)
});

export async function POST(request: Request) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 10_000) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    if (!consumePublicFormRateLimit(address)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    const parsed = paymentSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Please check your payment submission." }, { status: 400 });
    const id = submitManualPayment(parsed.data);
    return NextResponse.json({
      ok: true,
      id,
      message: "Payment details submitted for manual review. No service is activated by submission."
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment submission failed.";
    if ([
      "Order number and customer email did not match.",
      "This order is not accepting payment submissions.",
      "Payment amount exceeds the outstanding order balance."
    ].includes(message)) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Manual payment details could not be saved.", error);
    return NextResponse.json({ error: "We could not save your payment details. Please try again later." }, { status: 500 });
  }
}
