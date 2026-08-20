import { useEffect } from "react";

/**
 * Keeps a stable app height on mobile browsers.
 *
 * Mobile keyboards resize (or scroll) the layout viewport, which used to leave a
 * blank gap under the page after the keyboard closed. We drive the layout from
 * `visualViewport` instead and always pin the document back to the top, so the
 * room page keeps exactly one screen of height whatever the keyboard does.
 */
export function useAppViewport() {
  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const vv = window.visualViewport;
      const height = vv ? vv.height : window.innerHeight;
      root.style.setProperty("--app-height", `${Math.round(height)}px`);
      // Keyboards on iOS scroll the page; undo it so nothing is pushed up.
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    };

    apply();

    const vv = window.visualViewport;
    vv?.addEventListener("resize", apply);
    vv?.addEventListener("scroll", apply);
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    document.addEventListener("focusout", apply);

    return () => {
      vv?.removeEventListener("resize", apply);
      vv?.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
      document.removeEventListener("focusout", apply);
      root.style.removeProperty("--app-height");
    };
  }, []);
}
