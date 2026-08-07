import { useEffect, useRef, useState } from "react";

type Options = {
  /** How much of the element must be visible before it reveals. */
  threshold?: number;
  /** Extra offset so the reveal starts slightly before the element enters. */
  rootMargin?: string;
};

/**
 * Reveals an element once, the first time it scrolls into view.
 * Falls back to "always visible" when IntersectionObserver is unavailable
 * or the user prefers reduced motion, so content is never hidden.
 */
export const useReveal = <T extends HTMLElement>({
  threshold = 0.15,
  rootMargin = "0px 0px -10% 0px",
}: Options = {}) => {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  return { ref, isVisible };
};
