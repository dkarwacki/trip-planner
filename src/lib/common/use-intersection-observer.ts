import { useEffect, useRef, useState } from "react";

export interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  // Only trigger once when element becomes visible
  triggerOnce?: boolean;
  // Enable/disable the observer
  enabled?: boolean;
}

export interface UseIntersectionObserverResult {
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
  ref: (node: Element | null) => void;
}

/**
 * React hook for using the Intersection Observer API
 * Observes when an element enters or leaves the viewport
 *
 * @example
 * ```tsx
 * const { ref, isIntersecting } = useIntersectionObserver({ threshold: 0.5 });
 *
 * <div ref={ref}>
 *   {isIntersecting && <p>Element is visible!</p>}
 * </div>
 * ```
 */
export function useIntersectionObserver(options: UseIntersectionObserverOptions = {}): UseIntersectionObserverResult {
  const { threshold = 0, root = null, rootMargin = "0px", triggerOnce = false, enabled = true } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry>();
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [node, setNode] = useState<Element | null>(null);
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!enabled || !node) return;

    // If triggerOnce and already triggered, don't observe
    if (triggerOnce && hasTriggered.current) return;

    // Check if browser supports IntersectionObserver
    if (!("IntersectionObserver" in window)) {
      // Fallback: assume visible
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry);
        setIsIntersecting(entry.isIntersecting);

        if (entry.isIntersecting && triggerOnce) {
          hasTriggered.current = true;
          observer.disconnect();
        }
      },
      {
        threshold,
        root,
        rootMargin,
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [node, threshold, root, rootMargin, triggerOnce, enabled]);

  return {
    ref: setNode,
    isIntersecting,
    entry,
  };
}
