import type { Metadata } from "next";
import Link from "next/link";

import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in · MyLokalEvent" };

export default function SignInPage() {
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Welcome back
      </h1>
      <p className="mt-1 mb-6 text-muted-foreground">
        Sign in to see your saved events.
      </p>
      <SignInForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/sign-up" className="font-semibold text-primary underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
