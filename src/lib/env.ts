import { z } from "zod";

// Values copied from .env.example that must never reach a running server.
const PLACEHOLDER = /^(|change-me|changeme|replace-me|your-.*|xxx+|todo)$/i;

const required = z
  .string()
  .trim()
  .refine((value) => !PLACEHOLDER.test(value), {
    message: "is missing or still set to a placeholder",
  });

// Server-side environment. Add each new variable here and to .env.example.
const serverSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_SITE_URL: required.pipe(z.url()),
});

export type Env = z.infer<typeof serverSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = serverSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment configuration. Copy .env.example to .env.local and fill it in.\n${problems}`,
    );
  }
  return result.data;
}
