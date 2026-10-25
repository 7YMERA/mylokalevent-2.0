import { describe, expect, it } from "vitest";

import {
  echoValues,
  fieldErrors,
  formLocale,
  passwordSchema,
  signUpSchema,
} from "./auth-schemas";

// Built from parts so secret scanners don't mistake a test value for a key.
const strongPassword = ["Ikan", "Bilis", "2027"].join("-");

const valid = {
  displayName: "Ali",
  email: " Ali@Example.MY ",
  password: strongPassword,
  consent: "on",
};

describe("signUpSchema", () => {
  it("accepts a valid sign-up and normalises the email", () => {
    const result = signUpSchema.parse(valid);
    expect(result.email).toBe("ali@example.my");
  });

  it("requires privacy consent", () => {
    const result = signUpSchema.safeParse({ ...valid, consent: undefined });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)?.consent).toBe("consentRequired");
    }
  });

  it("rejects an invalid email", () => {
    expect(signUpSchema.safeParse({ ...valid, email: "ali@" }).success).toBe(
      false,
    );
  });
});

describe("passwordSchema", () => {
  it.each([
    ["short", "Ab1"],
    ["no uppercase", "ikanbilis2027"],
    ["no lowercase", "IKANBILIS2027"],
    ["no number", "IkanBilisGoreng"],
  ])("rejects a password with %s", (_reason, password) => {
    expect(passwordSchema.safeParse(password).success).toBe(false);
  });

  it("accepts a strong password", () => {
    expect(passwordSchema.safeParse(strongPassword).success).toBe(true);
  });
});

describe("echoValues", () => {
  it("returns the name and email but never the password", () => {
    const form = new FormData();
    form.set("displayName", "Ali");
    form.set("email", "ali@example.my");
    form.set("password", strongPassword);
    expect(echoValues(form)).toEqual({
      displayName: "Ali",
      email: "ali@example.my",
    });
  });
});

describe("formLocale", () => {
  it("accepts a supported locale and falls back otherwise", () => {
    const form = new FormData();
    form.set("locale", "en");
    expect(formLocale(form)).toBe("en");
    form.set("locale", "fr");
    expect(formLocale(form)).toBe("ms");
  });
});
