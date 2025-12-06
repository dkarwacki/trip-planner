/**
 * Email Verification Banner
 *
 * Dismissible banner reminding users to verify their email.
 */

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, X, Loader2 } from "lucide-react";
import { useAuthStore } from "./stores";

interface EmailVerificationBannerProps {
  email: string;
}

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  const { emailVerificationDismissed, dismissEmailVerification } = useAuthStore();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  if (emailVerificationDismissed) return null;

  const handleResend = async () => {
    setIsResending(true);

    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 5000);
    } catch (err) {
      console.error("Resend verification error:", err);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg">
      <div className="flex items-center gap-3">
        <Mail className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <p className="text-sm text-amber-800">
          Please verify your email address.{" "}
          {resendSuccess ? (
            <span className="text-green-600">Verification email sent!</span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-amber-700 hover:text-amber-900 underline disabled:opacity-50"
            >
              {isResending ? (
                <>
                  <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                  Sending...
                </>
              ) : (
                "Resend verification email"
              )}
            </button>
          )}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-100"
        onClick={dismissEmailVerification}
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
