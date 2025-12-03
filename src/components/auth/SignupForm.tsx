/**
 * Signup Form
 *
 * User registration form with email/password and Google OAuth.
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { AuthLayout, AuthFormInput, FormErrorMessage, PasswordStrengthIndicator } from "./layout";
import { GoogleOAuthButton } from "./GoogleOAuthButton";
import { SignupCommandSchema } from "@/infrastructure/auth/api/schemas";

interface SignupFormProps {
  supabaseUrl: string;
  supabaseKey: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function SignupForm({ supabaseUrl, supabaseKey }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const result = SignupCommandSchema.safeParse({ email, password, confirmPassword });

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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setFormError(data.error ?? "Registration failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Redirect on success (auto-login)
      window.location.href = "/";
    } catch (err) {
      console.error("Signup error:", err);
      setFormError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create an account"
      description="Start planning your next adventure"
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:text-blue-700 hover:underline">
            Sign in
          </a>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <FormErrorMessage message={formError} />}

        <AuthFormInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
          required
        />

        <div className="space-y-2">
          <AuthFormInput
            label="Password"
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
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />

        <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create account
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <GoogleOAuthButton redirectTo="/" supabaseUrl={supabaseUrl} supabaseKey={supabaseKey} />

        <p className="text-center text-xs text-muted-foreground">
          By creating an account, you agree to our <span className="text-blue-600">Terms of Service</span> and{" "}
          <span className="text-blue-600">Privacy Policy</span>
        </p>
      </form>
    </AuthLayout>
  );
}
