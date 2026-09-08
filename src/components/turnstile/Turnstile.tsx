import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import "./Turnstile.scss";

type TurnstileTheme = "auto" | "light" | "dark";
type TurnstileSize = "normal" | "flexible" | "compact";
type TurnstileAppearance = "always" | "execute" | "interaction-only";
type TurnstileExecution = "render" | "execute";

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove?: (widgetId: string) => void;
  execute: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export interface TurnstileHandle {
  execute: () => Promise<string>;
  reset: () => void;
}

interface TurnstileProps {
  action: string;
  onToken?: (token: string) => void;
  onError?: () => void;
  onExpired?: () => void;
  theme?: TurnstileTheme;
  size?: TurnstileSize;
  appearance?: TurnstileAppearance;
  execution?: TurnstileExecution;
  className?: string;
  style?: CSSProperties;
}

const SCRIPT_ID = "cloudflare-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";
let scriptPromise: Promise<void> | null = null;

const loadTurnstile = () => {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    const handleLoad = () => {
      if (window.turnstile) {
        resolve();
      } else {
        reject(new Error("Turnstile loaded without its API."));
      }
    };

    const handleError = () => {
      reject(new Error("Turnstile script failed to load."));
    };

    if (existing) {
      existing.addEventListener("load", handleLoad, { once: true });
      existing.addEventListener("error", handleError, { once: true });
      if (window.turnstile) resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  });

  return scriptPromise;
};

const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(
  (
    {
      action,
      onToken,
      onError,
      onExpired,
      theme = "auto",
      size = "flexible",
      appearance = "always",
      execution = "render",
      className = "",
      style,
    },
    ref,
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);
    const pendingResolveRef = useRef<((token: string) => void) | null>(null);
    const pendingRejectRef = useRef<((reason?: unknown) => void) | null>(null);
    const [loadError, setLoadError] = useState(false);

    const siteKey = String(import.meta.env.VITE_TURNSTILE_SITE_KEY || "").trim();

    useImperativeHandle(ref, () => ({
      execute: () => {
        return new Promise<string>((resolve, reject) => {
          if (!window.turnstile || !widgetIdRef.current) {
            reject(new Error("Turnstile is not ready."));
            return;
          }

          pendingResolveRef.current = resolve;
          pendingRejectRef.current = reject;
          window.turnstile.execute(widgetIdRef.current);
        });
      },
      reset: () => {
        if (window.turnstile && widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current);
        }
        pendingResolveRef.current = null;
        pendingRejectRef.current = null;
      },
    }), []);

    const onTokenRef = useRef(onToken);
    const onErrorRef = useRef(onError);
    const onExpiredRef = useRef(onExpired);

    useEffect(() => {
      onTokenRef.current = onToken;
    }, [onToken]);

    useEffect(() => {
      onErrorRef.current = onError;
    }, [onError]);

    useEffect(() => {
      onExpiredRef.current = onExpired;
    }, [onExpired]);

    useEffect(() => {
      if (!containerRef.current || !siteKey) {
        setLoadError(!siteKey);
        return;
      }

      let cancelled = false;

      loadTurnstile()
        .then(() => {
          if (cancelled || !containerRef.current || !window.turnstile) return;

          if (widgetIdRef.current) {
            window.turnstile.remove?.(widgetIdRef.current);
            widgetIdRef.current = null;
          }

          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            action,
            theme,
            size,
            appearance,
            execution,
            language: "fa",
            callback: (token: string) => {
              onTokenRef.current?.(token);
              pendingResolveRef.current?.(token);
              pendingResolveRef.current = null;
              pendingRejectRef.current = null;
            },
            "error-callback": () => {
              onErrorRef.current?.();
              pendingRejectRef.current?.(new Error("Turnstile validation failed."));
              pendingResolveRef.current = null;
              pendingRejectRef.current = null;
            },
            "expired-callback": () => {
              onExpiredRef.current?.();
              pendingRejectRef.current?.(new Error("Turnstile token expired."));
              pendingResolveRef.current = null;
              pendingRejectRef.current = null;
            },
            "timeout-callback": () => {
              pendingRejectRef.current?.(new Error("Turnstile challenge timed out."));
              pendingResolveRef.current = null;
              pendingRejectRef.current = null;
            },
          });
        })
        .catch(() => {
          if (!cancelled) {
            setLoadError(true);
            onErrorRef.current?.();
          }
        });

      return () => {
        cancelled = true;
        if (window.turnstile && widgetIdRef.current) {
          window.turnstile.remove?.(widgetIdRef.current);
          widgetIdRef.current = null;
        }
        pendingRejectRef.current?.(new Error("Turnstile unmounted."));
        pendingResolveRef.current = null;
        pendingRejectRef.current = null;
      };
    }, [action, appearance, execution, size, siteKey, theme]);

    return (
      <div
        ref={containerRef}
        className={`turnstile ${className}`.trim()}
        style={style}
        aria-hidden={loadError}
      />
    );
  },
);

Turnstile.displayName = "Turnstile";

export default Turnstile;
