import type { Messages } from "./messages";

// Turns a message key returned by a Server Action into text. Unknown keys
// (for example a validation message we haven't mapped) fall back to a
// generic message rather than showing the key.
export function translateMessage(
  messages: Messages["messages"],
  key: string | undefined,
): string | undefined {
  if (!key) return undefined;
  return key in messages
    ? messages[key as keyof Messages["messages"]]
    : messages.generic;
}
