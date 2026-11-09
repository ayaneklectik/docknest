"use client";

import { useState } from "react";
import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";

const authClient = createAuthClient();

export function AdminLoginForm() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function submit(formData: FormData) {
    setError("");
    setSubmitting(true);
    try {
      const result = await authClient.signIn.email({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
        callbackURL: "/admin"
      });
      if (result.error) {
        setError("Sign in failed. Check your credentials and try again.");
        return;
      }
      router.push("/admin");
    } catch {
      setError("Sign in could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="quote-form login-form"
      action={(formData) => void submit(formData)}
    >
      <label>
        Administrator email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className="button button-dark" disabled={submitting} type="submit">
        {submitting ? "Signing in…" : "Sign in"}
      </button>
      <p className="form-message" aria-live="polite" role="status">{error}</p>
    </form>
  );
}
