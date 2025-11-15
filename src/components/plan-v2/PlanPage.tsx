import React from "react";
import { PlanLayout } from "./layout/PlanLayout";

interface PlanPageProps {
  conversationId?: string | null;
}

export function PlanPage({ conversationId }: PlanPageProps) {
  return <PlanLayout conversationId={conversationId} />;
}
