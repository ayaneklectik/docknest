import { z } from "zod";

export const contactPhoneSchema = z.string()
  .trim()
  .min(7, "Enter a valid contact number.")
  .max(40, "Contact number is too long.")
  .regex(/^\+?[0-9][0-9\s().-]*$/, "Enter a valid contact number.");
