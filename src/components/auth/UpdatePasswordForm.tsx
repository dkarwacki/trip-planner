/**
 * Update Password Form
 *
 * Form to set a new password (after clicking reset link from email).
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";
import { AuthLayout, AuthFormInput, FormErrorMessage, PasswordStrengthIndicator } from "./layout";
import { UpdatePasswordCommandSchema } from "@/infrastructure/auth/api/schemas";

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

export function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateForm = (): boolean => {
    const result = UpdatePasswordCommandSchema.safeParse({ password, confirmPassword });

    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        newErrors[field] = err.message;
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setFormError(data.error ?? "Failed to update password. Please try again.");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      console.error("Update password error:", err);
      setFormError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <AuthLayout title="Password updated" description="Your password has been changed successfully">
        <div className="flex flex-col items-center space-y-4 py-4">
          <CheckCircle className="h-12 w-12 text-green-400" />
          <p className="text-center text-sm text-slate-400">You can now sign in with your new password.</p>
          <a
            href="/login?reset=true"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Sign in
          </a>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set new password" description="Enter your new password below">
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <FormErrorMessage message={formError} />}

        <div className="space-y-2">
          <AuthFormInput
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            autoComplete="new-password"
            required
          />
          <PasswordStrengthIndicator password={password} />
        </div>

        <AuthFormInput
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
