import { useEffect, useRef, useState } from "react";
import type {
  MatroskaSubtitleCue,
  MatroskaSubtitleTrackInfo,
} from "../types/matroska-subtitles-global";

export interface MkvSubtitleCue {
  trackNumber: number;
  start: number;
  end: number;
  text: string;
}

/**
 * Self-hosted browser build of matroska-subtitles 3.x.
 *
 * The package's documented browser entry is the UMD build loaded with a
 * normal <script> tag, which exposes window.MatroskaSubtitles. The package
 * supports SRT/SSA/ASS text tracks and emits `tracks` followed by `subtitle`.
 */
const PARSER_SCRIPT_SRC = "/vendor/matroska-subtitles.min.js";

let scriptLoadPromise: Promise<void> | null = null;

function loadParserLibrary(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Not in a browser environment"));
  }

  if (window.MatroskaSubtitles?.SubtitleParser) {
    return Promise.resolve();
  }

  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PARSER_SCRIPT_SRC}"]`,
    );

    const onLoad = () => {
      if (!window.MatroskaSubtitles?.SubtitleParser) {
        reject(new Error("matroska-subtitles loaded but did not expose SubtitleParser"));
        return;
      }
      resolve();
    };
    const onError = () => reject(new Error(`Failed to load ${PARSER_SCRIPT_SRC}`));

    if (existing) {
      if (window.MatroskaSubtitles?.SubtitleParser) {
        resolve();
        return;
      }
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener("error", onError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = PARSER_SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    // Allow a later component mount to retry after a failed script load.
    scriptLoadPromise = null;
    throw error;
  });

  return scriptLoadPromise;
}

/** Strip ASS/SSA override blocks and normalize ASS line breaks. */
function cleanCueText(raw: string): string {
  return raw
    .replace(/\{[^}]*\}/g, "")
    .replace(/\\N|\\n/gi, "\n")
    .trim();
}

export interface MkvSubtitleTrack {
  number: number;
  label: string;
  language: string;
  type: string;
}

export type MkvSubtitleStatus =
  | "idle"
  | "loading"
  | "ready"
  | "no-subtitles"
  | "error";

export function useMkvSubtitles(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  src: string,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const [status, setStatus] = useState<MkvSubtitleStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [tracks, setTracks] = useState<MkvSubtitleTrack[]>([]);
  const [cueRevision, setCueRevision] = useState(0);
  const [bytesRead, setBytesRead] = useState(0);
  const [totalBytes, setTotalBytes] = useState<number | null>(null);
  const [loadingElapsedMs, setLoadingElapsedMs] = useState(0);
  const cuesRef = useRef<MkvSubtitleCue[]>([]);

  useEffect(() => {
    const video = videoRef.current;
    const isMkv = /\.mkv(?:\?|#|$)/i.test(src);

    setStatus("idle");
    setError(null);
    setTracks([]);
    setBytesRead(0);
    setTotalBytes(null);
    setLoadingElapsedMs(0);
    cuesRef.current = [];
    setCueRevision((v) => v + 1);

    if (!enabled || !video || !src || !isMkv) return;

    let cancelled = false;
    const abortController = new AbortController();
    const startedAt = performance.now();
    let parsedCueCount = 0;
    let lastRevision = 0;
    let progressTimer: number | null = null;

    const debug = (...args: unknown[]) => {
      console.debug("[mkv-subtitles]", ...args);
    };

    setStatus("loading");
    debug("start", { src });

    progressTimer = window.setInterval(() => {
      if (!cancelled) setLoadingElapsedMs(Math.round(performance.now() - startedAt));
    }, 500);

    (async () => {
      try {
        await loadParserLibrary();
        if (cancelled) return;

        debug("parser library loaded");
        const ParserCtor = window.MatroskaSubtitles?.SubtitleParser;
        if (!ParserCtor) throw new Error("SubtitleParser is unavailable");

        const response = await fetch(src, {
          signal: abortController.signal,
          credentials: "same-origin",
        });

        const contentLength = response.headers.get("content-length");
        const parsedTotalBytes = contentLength ? Number(contentLength) : null;
        setTotalBytes(Number.isFinite(parsedTotalBytes) ? parsedTotalBytes : null);

        debug("fetch response", {
          ok: response.ok,
          status: response.status,
          contentType: response.headers.get("content-type"),
          contentLength,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Could not fetch MKV for subtitle extraction (HTTP ${response.status})`);
        }

        const parser = new ParserCtor();

        parser.once("tracks", (allTracks: MatroskaSubtitleTrackInfo[]) => {
          if (cancelled) return;

          debug("tracks", allTracks);

          const subtitleTracks = allTracks.filter(
            (track) => track.type === "utf8" || track.type === "ass" || track.type === "ssa",
          );

          if (!subtitleTracks.length) {
            debug("no supported subtitle tracks", allTracks);
            setStatus("no-subtitles");
            return;
          }

          setTracks(
            subtitleTracks.map((track) => ({
              number: track.number,
              label:
                track.name ||
                (track.language ? track.language.toUpperCase() : `Track ${track.number}`),
              language: track.language || "",
              type: track.type,
            })),
          );
          debug("subtitle tracks found", { count: subtitleTracks.length });
        });

        parser.on("subtitle", (subtitle: MatroskaSubtitleCue, trackNumber: number) => {
          if (cancelled) return;

          const start = Math.max(0, subtitle.time / 1000);
          const end = start + Math.max(0, subtitle.duration / 1000);
          const text = cleanCueText(subtitle.text);
          if (!text || end <= start) return;

          cuesRef.current.push({
            ...subtitle,
            trackNumber,
            text,
            start,
            end,
          });

          parsedCueCount += 1;

          if (parsedCueCount - lastRevision >= 25) {
            lastRevision = parsedCueCount;
            setCueRevision(parsedCueCount);
          }

          if (parsedCueCount <= 5 || parsedCueCount % 500 === 0) {
            debug("cue", { parsedCueCount, trackNumber, start, end, text });
          }
        });

        const reader = response.body.getReader();
        let bytes = 0;

        try {
          for (; ;) {
            const { done, value } = await reader.read();
            if (done) break;

            if (cancelled) {
              await reader.cancel();
              return;
            }

            bytes += value.byteLength;
            setBytesRead(bytes);
            parser.write(value);
          }
        } finally {
          reader.releaseLock();
        }

        parser.end();
        setCueRevision(parsedCueCount);

        if (!parsedCueCount) {
          debug("subtitle tracks existed, but parser produced zero cues");
          setStatus("error");
          setError(
            "Subtitle tracks were found, but no usable subtitle cues were decoded from this MKV.",
          );
          return;
        }

        setStatus("ready");
        debug("parser finished", {
          cues: parsedCueCount,
          bytesRead: bytes,
          elapsedMs: Math.round(performance.now() - startedAt),
        });
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;

        console.error("[mkv-subtitles] extraction failed", err);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    })();

    return () => {
      cancelled = true;
      abortController.abort();
      if (progressTimer !== null) window.clearInterval(progressTimer);
    };
    // videoRef is stable; src is the extraction key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, enabled]);

  return {
    status,
    error,
    tracks,
    cues: cuesRef.current,
    cueCount: cuesRef.current.length,
    cueRevision,
    bytesRead,
    totalBytes,
    loadingElapsedMs,
  };
}
