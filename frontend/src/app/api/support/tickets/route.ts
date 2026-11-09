import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupportTicket } from "@backend/operations";
import { consumePublicFormRateLimit } from "@backend/rate-limit";
import { contactPhoneSchema } from "@/lib/contact";

export const runtime = "nodejs";

const ticketSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: contactPhoneSchema,
  subject: z.string().trim().min(4).max(180),
  body: z.string().trim().min(10).max(5000),
  website: z.string().max(200).optional()
});

export async function POST(request: Request) {
  const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 12_000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    if (!consumePublicFormRateLimit(address)) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    const parsed = ticketSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Please check your support request." }, { status: 400 });
    if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 201 });
    const ticket = createSupportTicket(parsed.data);
    return NextResponse.json({
      ok: true,
      id: ticket.id,
      ticketNumber: ticket.ticketNumber,
      message: `Your support request ${ticket.ticketNumber} has been recorded. An acknowledgement is queued; outbound email must be configured and dispatched before it is sent.`
    }, { status: 201 });
  } catch (error) {
    console.error("Support request could not be saved.", error);
    return NextResponse.json({ error: "We could not save your request. Please try again later." }, { status: 500 });
  }
}
