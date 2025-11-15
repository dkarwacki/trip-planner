import React from "react";
import { MessageCircle, Sparkles } from "lucide-react";

/**
 * ChatEmptyState - Welcome message when chat is empty
 *
 * Features:
 * - Friendly welcome message
 * - Example prompts to get started
 * - Encourages persona selection
 */
export function ChatEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 rounded-full bg-primary/10 p-6">
        <MessageCircle className="h-12 w-12 text-primary" />
      </div>

      <h2 className="mb-2 text-2xl font-semibold">Start Planning Your Trip</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        Tell me about your dream destination, and I'll help you discover amazing places
        tailored to your travel style.
      </p>

      <div className="w-full max-w-lg space-y-3">
        <div className="flex items-start gap-3 rounded-lg border bg-card p-4 text-left">
          <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Try asking:</p>
            <p className="mt-1 text-sm text-muted-foreground">
              "I want to explore Japan for 2 weeks, focusing on traditional culture and
              food"
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-lg border bg-card p-4 text-left">
          <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">Or:</p>
            <p className="mt-1 text-sm text-muted-foreground">
              "Suggest some hidden gems in Italy for nature lovers and photographers"
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        💡 Select your travel styles above to get personalized recommendations
      </p>
    </div>
  );
}
