import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { NextResponse } from "next/server";
import { getAdminSession } from "@backend/admin-session";

export const runtime = "nodejs";

const maxImageBytes = 8 * 1024 * 1024;
const mediaDirectory = resolve(process.env.MEDIA_DIRECTORY ?? "./data/media");

function detectImageType(bytes: Uint8Array): { extension: "png" | "jpg" | "webp"; mimeType: string } | null {
  if (bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return { extension: "png", mimeType: "image/png" };
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { extension: "jpg", mimeType: "image/jpeg" };
  }
  if (bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    return { extension: "webp", mimeType: "image/webp" };
  }
  return null;
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Administrator access required." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxImageBytes + 64 * 1024) {
    return NextResponse.json({ error: "Images must be 8 MB or smaller." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch (error) {
    console.error("Image upload form could not be read.", error);
    return NextResponse.json({ error: "Choose a PNG, JPEG, or WebP image to upload." }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  if (file.size > maxImageBytes) {
    return NextResponse.json({ error: "Images must be 8 MB or smaller." }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const imageType = detectImageType(bytes);
  if (!imageType) {
    return NextResponse.json({ error: "Only valid PNG, JPEG, and WebP image files are supported." }, { status: 415 });
  }

  const filename = `${randomUUID()}.${imageType.extension}`;
  try {
    await mkdir(mediaDirectory, { recursive: true });
    await writeFile(join(mediaDirectory, filename), bytes, { flag: "wx" });
    return NextResponse.json({ ok: true, url: `/media/${filename}` }, { status: 201 });
  } catch (error) {
    console.error("Image upload could not be stored.", error);
    return NextResponse.json({ error: "Image upload could not be stored." }, { status: 500 });
  }
}
