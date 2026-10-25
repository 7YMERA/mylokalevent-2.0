import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
};

export function FormField({ label, name, error, hint, ...input }: Props) {
  const describedBy = error
    ? `${name}-error`
    : hint
      ? `${name}-hint`
      : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-semibold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`rounded-xl border bg-surface px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground ${
          error ? "border-danger" : "border-border"
        }`}
        {...input}
      />
      {error ? (
        <p id={`${name}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${name}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}

export function FormAlert({
  tone,
  children,
}: {
  tone: "danger" | "success";
  children: React.ReactNode;
}) {
  const styles =
    tone === "danger"
      ? "bg-danger-soft text-danger"
      : "bg-success-soft text-success";
  return (
    <p role="alert" className={`rounded-xl px-4 py-3 text-sm ${styles}`}>
      {children}
    </p>
  );
}
