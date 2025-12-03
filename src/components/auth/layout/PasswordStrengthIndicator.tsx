/**
 * Password Strength Indicator
 *
 * Visual display of password requirements and strength.
 */

import { Check, X } from "lucide-react";
import { cn } from "@/lib/common/utils";

interface Requirement {
  label: string;
  met: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const requirements: Requirement[] = [
    {
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      label: "At least 1 special character (!@#$%^&*)",
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];

  if (!password) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Password requirements:</p>
      <ul className="space-y-1">
        {requirements.map((req) => (
          <li key={req.label} className="flex items-center gap-2 text-xs">
            {req.met ? <Check className="h-3.5 w-3.5 text-green-600" /> : <X className="h-3.5 w-3.5 text-muted-foreground" />}
            <span className={cn(req.met ? "text-green-600" : "text-muted-foreground")}>{req.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}




