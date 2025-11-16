/**
 * Utilities for managing recent place searches
 * Stores search history in localStorage
 */

export interface RecentSearch {
  placeId: string;
  mainText: string;
  secondaryText: string;
  timestamp: number;
}

const STORAGE_KEY = 'map-v2-recent-searches';
const MAX_RECENT_SEARCHES = 10;

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const searches = JSON.parse(stored) as RecentSearch[];
    // Sort by timestamp descending
    return searches.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_RECENT_SEARCHES);
  } catch (error) {
    console.error('[recentSearches] Failed to get recent searches:', error);
    return [];
  }
}

/**
 * Add a search to recent searches
 * Removes duplicates and maintains max limit
 */
export function addRecentSearch(search: Omit<RecentSearch, 'timestamp'>): void {
  if (typeof window === 'undefined') return;
  
  try {
    const searches = getRecentSearches();
    
    // Remove existing search with same placeId
    const filtered = searches.filter(s => s.placeId !== search.placeId);
    
    // Add new search at the beginning
    const updated: RecentSearch[] = [
      {
        ...search,
        timestamp: Date.now(),
      },
      ...filtered,
    ].slice(0, MAX_RECENT_SEARCHES);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('[recentSearches] Failed to add recent search:', error);
  }
}

/**
 * Remove a specific search from recent searches
 */
export function removeRecentSearch(placeId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const searches = getRecentSearches();
    const filtered = searches.filter(s => s.placeId !== placeId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[recentSearches] Failed to remove recent search:', error);
  }
}

/**
 * Clear all recent searches
 */
export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[recentSearches] Failed to clear recent searches:', error);
  }
}

