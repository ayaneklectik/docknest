import { z } from "zod";
import { currencies } from "@/lib/catalog-types";
import { contactPhoneSchema } from "@/lib/contact";

const knownServices = [
  "Shared hosting",
  "Business hosting",
  "Managed VPS",
  "E-commerce hosting",
  "Custom hosting",
  "Website development",
  "Web application",
  "Custom software and API",
  "Website maintenance",
  "Domain registration",
  "General enquiry"
] as const;

export const quoteRequestSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: contactPhoneSchema,
  company: z.string().trim().max(120).optional().default(""),
  service: z.string().trim().min(2).max(120),
  billingPeriod: z.enum(["monthly", "yearly", "two-year", "three-year"]).optional(),
  currency: z.enum(currencies).optional().default("BDT"),
  productId: z.string().uuid().optional(),
  addonIds: z.array(z.string().uuid()).max(20).optional().default([]),
  requirements: z.string().trim().min(10).max(3000),
  website: z.string().max(200).optional()
}).superRefine((request, context) => {
  if (!request.productId && !knownServices.includes(request.service as (typeof knownServices)[number])) {
    context.addIssue({ code: "custom", path: ["service"], message: "Choose a supported service." });
  }
});

export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;

export const quoteStatuses = [
  "new",
  "reviewing",
  "quoted",
  "approved",
  "rejected",
  "converted"
] as const;

export type QuoteStatus = (typeof quoteStatuses)[number];
