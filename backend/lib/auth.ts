import { betterAuth } from "better-auth";
import { db } from "@backend/db";

const secret = process.env.BETTER_AUTH_SECRET;
const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
if (
  process.env.NODE_ENV === "production" &&
  !isProductionBuild &&
  (!secret || secret.length < 32)
) {
  throw new Error("BETTER_AUTH_SECRET must be set to at least 32 characters.");
}

export const auth = betterAuth({
  database: db,
  secret: secret ?? (isProductionBuild
    ? "build-only-secret-not-valid-at-runtime-000000000000"
    : "development-only-secret-change-before-deploy-00000000"),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    disableSignUp: true
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false
      }
    }
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 10
  }
});
