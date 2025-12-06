import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/infrastructure/common/database/types";

teardown("cleanup e2e user data", async () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const userId = process.env.E2E_USERNAME_ID;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials not provided, skipping cleanup");
    return;
  }

  if (!userId) {
    console.warn("E2E_USERNAME_ID not provided, skipping cleanup");
    return;
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseKey);

  // Delete user-specific data in FK order (trips -> conversations)
  // trips and conversations have user_id column
  const { error: tripsError } = await supabase.from("trips").delete().eq("user_id", userId);
  if (tripsError) console.error("Failed to cleanup trips:", tripsError.message);
  else console.log("Cleaned up trips for user:", userId);

  const { error: convError } = await supabase.from("conversations").delete().eq("user_id", userId);
  if (convError) console.error("Failed to cleanup conversations:", convError.message);
  else console.log("Cleaned up conversations for user:", userId);

  const { error: personasError } = await supabase.from("user_personas").delete().eq("user_id", userId);
  if (personasError) console.error("Failed to cleanup user_personas:", personasError.message);
  else console.log("Cleaned up user_personas for user:", userId);

  // Note: attractions and places are shared data (no user_id), not cleaned up
});
