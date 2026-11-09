import { NextResponse } from "next/server";
import { quoteRequestSchema } from "@/lib/quote";
import { createQuoteRequest } from "@backend/quotes";
import { consumePublicFormRateLimit } from "@backend/rate-limit";

export const runtime = "nodejs";

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
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    const parsed = quoteRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please check the form and try again.", fields: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (parsed.data.website) {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const id = createQuoteRequest(parsed.data);
    return NextResponse.json(
      { ok: true, message: "Your request has been recorded. An acknowledgement is queued and will be sent after outbound email is configured and dispatched.", id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Quote request could not be processed.", error);
    return NextResponse.json(
      { error: "We could not save your request. Please try again later." },
      { status: 500 }
    );
  }
}
