import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const mediaDirectory = resolve(process.env.MEDIA_DIRECTORY ?? "./data/media");
const imageTypes = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp"
} as const;

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params;
  const match = /^([a-f0-9-]{36})\.(png|jpg|webp)$/.exec(filename);
  if (!match) return new NextResponse(null, { status: 404 });

  try {
    const bytes = await readFile(resolve(mediaDirectory, filename));
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": imageTypes[match[2] as keyof typeof imageTypes],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return new NextResponse(null, { status: 404 });
    }
    console.error("Uploaded image could not be read.", error);
    return NextResponse.json({ error: "Image could not be loaded." }, { status: 500 });
  }
}
