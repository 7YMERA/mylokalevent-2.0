"use client";

import { useActionState } from "react";

import { FormAlert, FormField, SubmitButton } from "@/components/form-field";
import type { FormState } from "@/lib/auth-schemas";

import { signIn } from "../actions";

export function SignInForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(
    signIn,
    {},
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {state.error && <FormAlert tone="danger">{state.error}</FormAlert>}
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
        autoComplete="current-password"
        required
        error={errors.password}
      />
      <SubmitButton pending={pending}>Sign in</SubmitButton>
    </form>
  );
}
