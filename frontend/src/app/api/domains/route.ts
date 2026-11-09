import { NextResponse } from "next/server";
import { z } from "zod";
import { createDomainRequest } from "@backend/domains";
import { rdapRegistrarAdapter } from "@backend/registrar";
import { consumePublicFormRateLimit } from "@backend/rate-limit";
import { contactPhoneSchema } from "@/lib/contact";

export const runtime = "nodejs";

const domainSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: contactPhoneSchema,
  domain: z.string().trim().toLowerCase().min(3).max(253)
    .regex(/^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/),
  website: z.string().max(200).optional()
});

const domainNameSchema = domainSchema.shape.domain;

function getClientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
}

export async function GET(request: Request) {
  const parsed = domainNameSchema.safeParse(new URL(request.url).searchParams.get("domain"));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid domain name." }, { status: 400 });
  try {
    if (!consumePublicFormRateLimit(getClientAddress(request))) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    const result = await rdapRegistrarAdapter.checkAvailability(parsed.data);
    return NextResponse.json({ domain: parsed.data, ...result });
  } catch (error) {
    console.error("Live domain availability lookup failed.", error);
    return NextResponse.json(
      { error: "The registry could not be reached. Please try again or request a manual check." },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") ?? 0) > 4000) {
      return NextResponse.json({ error: "Request is too large." }, { status: 413 });
    }
    if (!consumePublicFormRateLimit(getClientAddress(request))) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }
    const parsed = domainSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid domain name." }, { status: 400 });
    if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 201 });
    const result = await createDomainRequest(parsed.data);
    return NextResponse.json({
      ok: true,
      id: result.id,
      status: result.status,
      message: `Your request is recorded. ${result.message}`
    }, { status: 201 });
  } catch (error) {
    console.error("Domain request could not be saved.", error);
    return NextResponse.json({ error: "Domain request could not be saved." }, { status: 500 });
  }
}
