/**
 * Reset Password Form
 *
 * Form to request a password reset email.
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { AuthLayout, AuthFormInput, FormErrorMessage } from "./layout";
import { ResetPasswordCommandSchema } from "@/infrastructure/auth/api/schemas";

export function ResetPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate
    const result = ResetPasswordCommandSchema.safeParse({ email });
    if (!result.success) {
      setError(result.error.errors[0]?.message ?? "Please enter a valid email");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error ?? "Failed to send reset email. Please try again.");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      console.error("Reset password error:", err);
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout title="Check your email" description="We've sent you a password reset link">
        <div className="flex flex-col items-center space-y-4 py-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
          <p className="text-center text-sm text-muted-foreground">
            If an account exists with <span className="font-medium text-foreground">{email}</span>, you will receive a password reset
            link shortly.
          </p>
          <a href="/login" className="text-blue-600 hover:text-blue-700 hover:underline">
            Back to sign in
          </a>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      description="Enter your email and we'll send you a reset link"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <a href="/login" className="text-blue-600 hover:text-blue-700 hover:underline">
            Sign in
          </a>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <FormErrorMessage message={error} />}

        <AuthFormInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}




