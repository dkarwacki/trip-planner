/**
 * Login Form
 *
 * Email/password login form with validation and error handling.
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { AuthLayout, AuthFormInput, FormErrorMessage } from "./layout";
import { GoogleOAuthButton } from "./GoogleOAuthButton";
import { LoginCommandSchema } from "@/infrastructure/auth/api/schemas";

interface LoginFormProps {
  redirectTo?: string;
  error?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

export function LoginForm({ redirectTo = "/", error: initialError }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState(initialError ?? "");
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const result = LoginCommandSchema.safeParse({ email, password });

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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setFormError(data.error ?? "Invalid email or password");
        setIsLoading(false);
        return;
      }

      // Redirect on success
      window.location.href = redirectTo;
    } catch (err) {
      console.error("Login error:", err);
      setFormError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Ready to explore?"
      description="Sign in to pick up where you left off."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-blue-600 hover:text-blue-700 hover:underline">
            Sign up
          </a>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" data-testid="login-form">
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
          data-testid="login-email-input"
        />

        <AuthFormInput
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          required
          data-testid="login-password-input"
        />

        <div className="text-right">
          <a href="/reset-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
          disabled={isLoading}
          data-testid="login-submit-button"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign in
        </Button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <GoogleOAuthButton redirectTo={redirectTo} />
      </form>
    </AuthLayout>
  );
}
