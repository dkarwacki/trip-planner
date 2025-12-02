import React, { useEffect } from "react";
import { PlanLayout } from "./layout/PlanLayout";
import { useAuthStore, type AuthUser } from "@/components/auth";

interface PlanPageProps {
  conversationId?: string | null;
  user?: AuthUser;
}

export function PlanPage({ conversationId, user }: PlanPageProps) {
  const setUser = useAuthStore((state) => state.setUser);

  // Initialize auth store with user from props (runs once on mount)
  useEffect(() => {
    if (user) {
      setUser(user);
    }
  }, [user, setUser]);

  return <PlanLayout conversationId={conversationId} user={user} />;
}
