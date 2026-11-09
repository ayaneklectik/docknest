import { createHash } from "node:crypto";
import { db } from "@backend/db";

const WINDOW_SECONDS = 60 * 15;
const MAX_HITS = 5;

export function consumePublicFormRateLimit(clientAddress: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / WINDOW_SECONDS) * WINDOW_SECONDS;
  const key = createHash("sha256").update(clientAddress).digest("hex");

  const consume = db.transaction(() => {
    db.prepare("DELETE FROM rate_limit_hits WHERE window_start < ?").run(
      windowStart - WINDOW_SECONDS
    );
    const row = db
      .prepare(
        `INSERT INTO rate_limit_hits (key, window_start, hits)
         VALUES (?, ?, 1)
         ON CONFLICT(key, window_start) DO UPDATE SET hits = hits + 1
         RETURNING hits`
      )
      .get(key, windowStart) as { hits: number };
    return row.hits <= MAX_HITS;
  });

  return consume();
}
