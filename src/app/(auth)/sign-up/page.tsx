import type { Metadata } from "next";
import Link from "next/link";

import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create an account · MyLokalEvent" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">
        Create your account
      </h1>
      <p className="mt-1 mb-6 text-muted-foreground">
        Save events, follow organisers and get reminders.
      </p>
      <SignUpForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-primary underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
