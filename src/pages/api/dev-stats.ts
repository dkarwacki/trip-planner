import type { APIRoute } from "astro";
import { getApiCallStats } from "@/infrastructure/common/google-maps/GoogleMapsClient";

export const GET: APIRoute = async () => {
  // Only allow in development mode
  if (!import.meta.env.DEV) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  const stats = getApiCallStats();

  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
