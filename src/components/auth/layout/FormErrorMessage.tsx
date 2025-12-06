/**
 * Form Error Message
 *
 * Displays form-level error messages with consistent styling.
 */

import { AlertCircle } from "lucide-react";

interface FormErrorMessageProps {
  message: string;
}

export function FormErrorMessage({ message }: FormErrorMessageProps) {
  if (!message) return null;

  return (
    <div
      className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
      role="alert"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
