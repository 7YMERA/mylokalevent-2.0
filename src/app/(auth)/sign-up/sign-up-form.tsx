"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormAlert, FormField, SubmitButton } from "@/components/form-field";
import type { FormState } from "@/lib/auth-schemas";

import { signUp } from "../actions";

export function SignUpForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signUp,
    {},
  );

  if (state.message) {
    return <FormAlert tone="success">{state.message}</FormAlert>;
  }

  const errors = state.fieldErrors ?? {};
  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.error && <FormAlert tone="danger">{state.error}</FormAlert>}
      <FormField
        label="Name"
        name="displayName"
        autoComplete="name"
        defaultValue={state.values?.displayName}
        required
        error={errors.displayName}
      />
      <FormField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        required
        error={errors.email}
      />
      <FormField
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        hint="At least 10 characters, with upper and lowercase letters and a number."
        error={errors.password}
      />
      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            name="consent"
            required
            aria-invalid={errors.consent ? true : undefined}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>
            I have read and agree to the{" "}
            <Link
              href="/privacy"
              className="font-semibold text-primary underline"
            >
              privacy notice
            </Link>
            .
          </span>
        </label>
        {errors.consent && (
          <p className="text-sm text-danger">{errors.consent}</p>
        )}
      </div>
      <SubmitButton pending={pending}>Create account</SubmitButton>
    </form>
  );
}
