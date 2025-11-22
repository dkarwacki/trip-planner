/**
 * Simple SVG illustrations for empty states
 * Minimal, friendly, and color-adaptive
 */

interface IllustrationProps {
  className?: string;
}

export function MapPinIllustration({ className = "h-16 w-16" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M32 8C23.716 8 17 14.716 17 23c0 11.25 15 29 15 29s15-17.75 15-29c0-8.284-6.716-15-15-15z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="text-muted-foreground"
      />
      <circle
        cx="32"
        cy="23"
        r="5"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        className="text-muted-foreground"
      />
    </svg>
  );
}

export function SearchIllustration({ className = "h-16 w-16" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="28"
        cy="28"
        r="14"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        className="text-muted-foreground"
      />
      <path
        d="M38 38l12 12"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-muted-foreground"
      />
    </svg>
  );
}

export function ClipboardIllustration({ className = "h-16 w-16" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="16"
        y="12"
        width="32"
        height="44"
        rx="2"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        className="text-muted-foreground"
      />
      <rect
        x="22"
        y="8"
        width="20"
        height="8"
        rx="2"
        stroke="currentColor"
        strokeWidth="3"
        fill="currentColor"
        className="text-muted-foreground"
      />
      <path
        d="M24 28h16M24 36h16M24 44h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-muted-foreground opacity-40"
      />
    </svg>
  );
}

export function SparkleIllustration({ className = "h-16 w-16" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M32 8v48M16 32h32M22 16l20 32M42 16L22 48"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-muted-foreground"
      />
      <circle cx="32" cy="32" r="8" fill="currentColor" className="text-muted-foreground" />
    </svg>
  );
}

export function WifiOffIllustration({ className = "h-16 w-16" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 20c12-12 32-12 44 0M18 28c8-8 20-8 28 0M26 36c4-4 8-4 12 0"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="text-muted-foreground opacity-40"
      />
      <circle cx="32" cy="44" r="3" fill="currentColor" className="text-muted-foreground" />
      <path d="M10 10l44 44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-destructive" />
    </svg>
  );
}

export function MapCursorIllustration({ className = "h-16 w-16" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="8"
        y="8"
        width="48"
        height="48"
        rx="2"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        className="text-muted-foreground"
      />
      <path
        d="M8 24h48M24 8v48"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="text-muted-foreground opacity-40"
      />
      <path d="M32 32l8 16 3-3 3 3 2-16-16 0z" fill="currentColor" className="text-muted-foreground" />
    </svg>
  );
}

export function QuestionMapPinIllustration({ className = "h-16 w-16" }: IllustrationProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M32 8C23.716 8 17 14.716 17 23c0 11.25 15 29 15 29s15-17.75 15-29c0-8.284-6.716-15-15-15z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="text-muted-foreground"
      />
      <path
        d="M32 19v1M32 26a3 3 0 0 0-3-3"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="text-muted-foreground"
      />
      <circle cx="32" cy="28" r="1.5" fill="currentColor" className="text-muted-foreground" />
    </svg>
  );
}













