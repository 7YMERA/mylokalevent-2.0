import { z } from "zod";

import { isMalaysianState } from "@/lib/geo";

// Error messages are keys into the `messages` section of src/messages/*.json,
// shown in the visitor's language (same convention as auth-schemas.ts).

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "slugTooShort")
  .max(60, "slugTooLong")
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "slugInvalid");

const state = z.string().trim().refine(isMalaysianState, "stateInvalid");

// SSM registration number: optional, loose format check only (SSM has several
// formats). Verification is a human admin step, not a regex.
const ssmNumber = z
  .string()
  .trim()
  .min(4, "ssmInvalid")
  .max(40, "ssmInvalid")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const applyOrganiserSchema = z.object({
  name: z.string().trim().min(2, "nameTooShort").max(120, "nameTooLong"),
  slug,
  phone: z
    .string()
    .trim()
    .min(6, "phoneInvalid")
    .max(20, "phoneInvalid")
    .regex(/^[0-9+\-\s]+$/, "phoneInvalid"),
  state,
  ssmNumber,
});

export type ApplyOrganiserInput = z.infer<typeof applyOrganiserSchema>;

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "titleTooShort").max(140, "titleTooLong"),
    slug,
    categorySlug: z.string().trim().min(1, "categoryRequired"),
    description: z
      .string()
      .trim()
      .min(20, "descriptionTooShort")
      .max(8000, "descriptionTooLong"),
    startsAt: z.coerce.date({ error: "startRequired" }),
    endsAt: z.coerce
      .date()
      .optional()
      .or(z.literal("").transform(() => undefined)),
    state,
    district: z
      .string()
      .trim()
      .min(2, "districtTooShort")
      .max(80, "districtTooLong"),
    venue: z.string().trim().min(2, "venueTooShort").max(160, "venueTooLong"),
    feeMyr: z.coerce
      .number()
      .int("feeInvalid")
      .min(0, "feeInvalid")
      .max(100000, "feeInvalid")
      .default(0),
  })
  .refine((data) => !data.endsAt || data.endsAt >= data.startsAt, {
    path: ["endsAt"],
    message: "endsBeforeStart",
  });

export type EventInput = z.infer<typeof eventSchema>;

export type FormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  message?: string;
  values?: Record<string, string>;
};
