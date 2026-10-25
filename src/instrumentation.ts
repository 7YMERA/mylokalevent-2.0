import { parseEnv } from "@/lib/env";

// Runs once when the server starts: refuse to serve requests with a
// missing or placeholder secret rather than fail later at runtime.
export function register() {
  parseEnv(process.env);
}
