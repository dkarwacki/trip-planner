import { useState, useEffect } from "react";

interface ApiCallStats {
  nearbySearch: number;
  geocode: number;
  reverseGeocode: number;
  placeDetails: number;
  textSearch: number;
  searchPlace: number;
}

export function DevStats() {
  const [stats, setStats] = useState<ApiCallStats | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only run in development
    if (!import.meta.env.DEV) {
      return;
    }

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dev-stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
          setError(null);
        } else {
          setError("Failed to fetch stats");
        }
      } catch (err) {
        setError("Error fetching stats");
      }
    };

    // Fetch immediately
    fetchStats();

    // Poll every 2 seconds
    const interval = setInterval(fetchStats, 2000);

    return () => clearInterval(interval);
  }, []);

  // Don't render in production
  if (!import.meta.env.DEV) {
    return null;
  }

  const totalCalls = stats ? Object.values(stats).reduce((sum, count) => sum + count, 0) : 0;

  return (
    <div className="fixed top-4 right-4 z-[9999] font-mono text-xs">
      <div className="bg-black/80 text-white rounded-lg shadow-lg border border-gray-700 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/10 transition-colors"
        >
          <span className="font-semibold">DEV STATS</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">({totalCalls} calls)</span>
            <span className="text-gray-400">{isCollapsed ? "▼" : "▲"}</span>
          </div>
        </button>

        {/* Content */}
        {!isCollapsed && (
          <div className="px-3 pb-3 pt-1 border-t border-gray-700">
            {error ? (
              <div className="text-red-400 py-1">{error}</div>
            ) : stats ? (
              <div className="space-y-1">
                <StatRow label="nearbySearch" count={stats.nearbySearch} />
                <StatRow label="geocode" count={stats.geocode} />
                <StatRow label="reverseGeocode" count={stats.reverseGeocode} />
                <StatRow label="placeDetails" count={stats.placeDetails} />
                <StatRow label="textSearch" count={stats.textSearch} />
                <StatRow label="searchPlace" count={stats.searchPlace} />
              </div>
            ) : (
              <div className="text-gray-400 py-1">Loading...</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-gray-300">{label}:</span>
      <span className={`font-semibold ${count > 0 ? "text-green-400" : "text-gray-500"}`}>{count}</span>
    </div>
  );
}
