"use client";

import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const authClient = createAuthClient();

export function AdminLogoutButton() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function signOut() {
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError("Could not sign out. Please try again.");
        return;
      }
      router.replace("/admin/login");
      router.refresh();
    } catch {
      setError("Could not reach the server to sign out.");
    }
  }

  return (
    <>
      <button className="button button-dark" onClick={() => void signOut()} type="button">Sign out</button>
      <span className="form-message" aria-live="polite" role="status">{error}</span>
    </>
  );
}
