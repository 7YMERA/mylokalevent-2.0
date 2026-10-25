import { locale } from "next/root-params";
import { notFound } from "next/navigation";

import en from "@/messages/en.json";

import { isLocale, type Locale } from "./config";

export type Messages = typeof en;
export type MessageKey = keyof Messages["messages"];

const loaders: Record<Locale, () => Promise<Messages>> = {
  ms: () => import("@/messages/ms.json").then((m) => m.default),
  en: () => Promise.resolve(en),
};

// The current locale from the URL. Server Components only; Server Actions
// receive it from a hidden form field instead.
export async function getLocale(): Promise<Locale> {
  const value = await locale();
  if (!isLocale(value)) notFound();
  return value;
}

export async function getMessages(): Promise<Messages> {
  return loaders[await getLocale()]();
}
