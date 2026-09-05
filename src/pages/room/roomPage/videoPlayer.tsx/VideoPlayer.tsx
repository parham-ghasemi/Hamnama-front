import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { archiveApi, type SubtitleTrack } from "../../../../apiCalls/archiveApi";
import { FaRegClosedCaptioning } from "react-icons/fa";
import type { SubtitleSettings } from "../settingsModal/SettingsModal";
import { DEFAULT_SUBTITLE_SETTINGS } from "../settingsModal/SettingsModal";

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  quality?: string;
  autoPlay?: boolean;
  canControlMedia?: boolean;
  className?: string;
  isPlaying?: boolean;
  currentTime?: number;
  onPlayRequest?: () => void;
  onPauseRequest?: () => void;
  onSeekRequest?: (time: number) => void;
  onLocalTimeUpdate?: (time: number) => void;
  nextEpisode?: {
    title: string;
    quality?: string;
  } | null;
  onNextEpisodeRequest?: () => void;
  subtitleSettings?: SubtitleSettings;
  onSubtitleSettingsChange?: (settings: SubtitleSettings) => void;
  mediaId?: string;
  subtitleSeason?: number | null;
  subtitleEpisode?: number | null;
  customSubtitleTracks?: SubtitleTrack[];
  onSubmitSubtitle?: (input: { file?: File; url?: string }) => Promise<void>;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  quality = "1080p",
  autoPlay = false,
  canControlMedia = true,
  className = "",
  isPlaying,
  currentTime,
  onPlayRequest,
  onPauseRequest,
  onSeekRequest,
  onLocalTimeUpdate,
  nextEpisode,
  onNextEpisodeRequest,
  subtitleSettings = DEFAULT_SUBTITLE_SETTINGS,
  onSubtitleSettingsChange,
  mediaId,
  subtitleSeason,
  subtitleEpisode,
  customSubtitleTracks = [],
  onSubmitSubtitle,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideControlsTimeoutRef = useRef<number | null>(null);

  const [isCompactPlayerHeight, setIsCompactPlayerHeight] = useState(false);
  const [internalPlaying, setInternalPlaying] = useState(autoPlay);
  const [internalCurrentTime, setInternalCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showShortcutHints, setShowShortcutHints] = useState(false);
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  const [isVideoBuffering, setIsVideoBuffering] = useState(true);
  const [bufferedRanges, setBufferedRanges] = useState<
    Array<{ start: number; end: number }>
  >([]);
  const [, setSubtitlesRequested] = useState(false);
  const [localSubtitleSettings, setLocalSubtitleSettings] =
    useState<SubtitleSettings>(subtitleSettings);
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>([]);
  const [subtitleStatus, setSubtitleStatus] = useState<
    "idle" | "loading" | "ready" | "no-subtitles" | "error"
  >("idle");
  const [subtitleError, setSubtitleError] = useState<string | null>(null);
  const [activeSubtitle, setActiveSubtitle] = useState(-1);
  const [subtitleSourceUrl, setSubtitleSourceUrl] = useState("");
  const [subtitleFile, setSubtitleFile] = useState<File | null>(null);
  const [subtitleSubmitError, setSubtitleSubmitError] = useState<string | null>(null);
  const [subtitleSubmitting, setSubtitleSubmitting] = useState(false);

  const lastTouchRef = useRef<{ time: number; x: number } | null>(null);

  const playing = isPlaying ?? internalPlaying;
  const time = currentTime ?? internalCurrentTime;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateCompactHeight = (height: number) => {
      setIsCompactPlayerHeight(height < 430);
    };

    updateCompactHeight(container.getBoundingClientRect().height);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) updateCompactHeight(entry.contentRect.height);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setLocalSubtitleSettings(subtitleSettings);
  }, [subtitleSettings]);

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "00:00";

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const pad = (num: number) => num.toString().padStart(2, "0");

    return h > 0
      ? `${h}:${pad(m)}:${pad(s)}`
      : `${pad(m)}:${pad(s)}`;
  };

  const updateBufferedRanges = useCallback(() => {
    const video = videoRef.current;

    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
      setBufferedRanges([]);
      return;
    }

    const ranges: Array<{ start: number; end: number }> = [];

    for (let i = 0; i < video.buffered.length; i += 1) {
      const start = video.buffered.start(i);
      const end = video.buffered.end(i);

      if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
        ranges.push({ start, end });
      }
    }

    setBufferedRanges(ranges);
  }, []);

  const handleVideoBufferingStart = useCallback(() => {
    // Only show the spinner while the user is actually trying to play.
    if (playing) {
      setIsVideoBuffering(true);
    }
  }, [playing]);

  const handleVideoBufferingEnd = useCallback(() => {
    setIsVideoBuffering(false);
  }, []);

  useEffect(() => {
    if (!playing) {
      setIsVideoBuffering(false);
    }
  }, [playing]);

  useEffect(() => {
    updateBufferedRanges();
  }, [updateBufferedRanges, duration]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current || !canControlMedia) return;

    if (playing) {
      if (onPauseRequest) {
        onPauseRequest();
      } else {
        setInternalPlaying(false);
      }

      videoRef.current.pause();
      setIsVideoBuffering(false);
    } else {
      if (onPlayRequest) {
        onPlayRequest();
      } else {
        setInternalPlaying(true);
      }

      setIsVideoBuffering(true);

      videoRef.current.play().catch(() => {
        setIsVideoBuffering(false);
      });
    }
  }, [playing, onPauseRequest, onPlayRequest, canControlMedia]);

  const handleSeekBy = (seconds: number) => {
    if (!videoRef.current || !canControlMedia) return;

    const next = Math.min(
      Math.max(videoRef.current.currentTime + seconds, 0),
      duration || 0
    );

    videoRef.current.currentTime = next;

    if (onSeekRequest) {
      onSeekRequest(next);
    } else {
      setInternalCurrentTime(next);
      onLocalTimeUpdate?.(next);
    }
  };

  const handleKeyboardSeek = useCallback(
    (seconds: number) => {
      handleSeekBy(seconds);
    },
    [duration]
  );

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canControlMedia) return;
    const targetTime = parseFloat(e.target.value);

    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }

    if (onSeekRequest) {
      onSeekRequest(targetTime);
    } else {
      setInternalCurrentTime(targetTime);
      onLocalTimeUpdate?.(targetTime);
    }
  };

  const handleVolumeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = parseFloat(e.target.value);

    setVolume(val);

    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }

    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;

    const nextMuted = !isMuted;

    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;

    if (nextMuted) {
      videoRef.current.volume = 0;
    } else {
      videoRef.current.volume = volume || 1;
    }
  };

  const effectiveSubtitleSettings = localSubtitleSettings;

  const currentSubtitleText = useMemo(() => {
    if (activeSubtitle < 0) return null;

    const track = subtitleTracks[activeSubtitle];

    if (!track || !track.cues.length) return null;

    const videoTime =
      (videoRef.current?.currentTime ?? time) -
      effectiveSubtitleSettings.offsetMs / 1000;

    let lo = 0;
    let hi = track.cues.length - 1;
    let candidate = -1;

    while (lo <= hi) {
      const mid = (lo + hi) >> 1;

      if (track.cues[mid].start <= videoTime) {
        candidate = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    if (candidate >= 0) {
      const cue = track.cues[candidate];

      if (
        cue.start <= videoTime &&
        cue.end > videoTime
      ) {
        return cue.text;
      }
    }

    return null;
  }, [
    activeSubtitle,
    effectiveSubtitleSettings.offsetMs,
    subtitleTracks,
    time,
  ]);

  const loadSubtitles = useCallback(async () => {
    if (customSubtitleTracks.length) {
      setSubtitlesRequested(true);
      setSubtitleTracks(customSubtitleTracks);
      setSubtitleStatus("ready");
      setSubtitleError(null);

      setActiveSubtitle((current) =>
        current >= 0 ? current : 0
      );

      return;
    }

    if (!mediaId) {
      setSubtitlesRequested(true);
      setSubtitleStatus("no-subtitles");
      setSubtitleTracks([]);
      setActiveSubtitle(-1);

      return;
    }

    setSubtitlesRequested(true);
    setSubtitleStatus("loading");
    setSubtitleError(null);

    try {
      const response = await archiveApi.getSubtitles(mediaId, {
        season: subtitleSeason,
        episode: subtitleEpisode,
      });

      const tracks = response.data.tracks ?? [];

      if (!tracks.length) {
        setSubtitleStatus("no-subtitles");
        setSubtitleTracks([]);
        setActiveSubtitle(-1);

        return;
      }

      setSubtitleTracks(tracks);
      setSubtitleStatus("ready");
      setActiveSubtitle(0);
    } catch (error: any) {
      const status = error?.response?.status;

      setSubtitleStatus(
        status === 404 ? "no-subtitles" : "error"
      );

      setSubtitleError(
        status === 404
          ? "برای این عنوان هنوز زیرنویسی آماده نشده است."
          : "دریافت زیرنویس با خطا مواجه شد."
      );

      setSubtitleTracks([]);
      setActiveSubtitle(-1);
    }
  }, [
    customSubtitleTracks,
    mediaId,
    subtitleEpisode,
    subtitleSeason,
  ]);

  const toggleSubtitles = useCallback(() => {
    if (
      subtitleStatus !== "ready" ||
      !subtitleTracks.length
    ) {
      return;
    }

    setActiveSubtitle((current) =>
      current >= 0 ? -1 : 0
    );
  }, [subtitleStatus, subtitleTracks.length]);

  const updateSubtitle = useCallback(
    <K extends keyof SubtitleSettings>(
      key: K,
      value: SubtitleSettings[K]
    ) => {
      setLocalSubtitleSettings((current) => {
        const next = {
          ...current,
          [key]: value,
        };

        onSubtitleSettingsChange?.(next);

        return next;
      });
    },
    [onSubtitleSettingsChange]
  );

  const resetSubtitleSettings = () => {
    setLocalSubtitleSettings(DEFAULT_SUBTITLE_SETTINGS);
    onSubtitleSettingsChange?.(DEFAULT_SUBTITLE_SETTINGS);
  };

  const validateLocalSubtitleFile = async (file: File) => {
    if (!/\.srt$/i.test(file.name)) return "فایل زیرنویس باید با فرمت SRT باشد.";
    if (file.size > 5 * 1024 * 1024) return "حجم زیرنویس نمی‌تواند بیشتر از ۵ مگابایت باشد.";
    const text = await file.text();
    if (!/^\s*(?:\d+\s*\n)?\s*\d{1,2}:\d{2}:\d{2}[,.]\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,.]\d{3}/m.test(text)) {
      return "محتوای فایل یک SRT معتبر نیست.";
    }
    return null;
  };

  const handleSubmitRoomSubtitle = async () => {
    if (!onSubmitSubtitle || !canControlMedia || subtitleSubmitting) return;
    setSubtitleSubmitError(null);
    const url = subtitleSourceUrl.trim();
    if (!subtitleFile && !url) {
      setSubtitleSubmitError("یک فایل SRT یا لینک زیرنویس وارد کن.");
      return;
    }
    if (subtitleFile && url) {
      setSubtitleSubmitError("فقط یکی از فایل یا لینک زیرنویس را انتخاب کن.");
      return;
    }
    if (subtitleFile) {
      const validationError = await validateLocalSubtitleFile(subtitleFile);
      if (validationError) {
        setSubtitleSubmitError(validationError);
        return;
      }
    }
    if (url) {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          setSubtitleSubmitError("لینک زیرنویس باید با HTTP یا HTTPS شروع شود.");
          return;
        }
      } catch {
        setSubtitleSubmitError("لینک زیرنویس معتبر نیست.");
        return;
      }
    }

    setSubtitleSubmitting(true);
    try {
      await onSubmitSubtitle(subtitleFile ? { file: subtitleFile } : { url });
      setSubtitleFile(null);
      setSubtitleSourceUrl("");
      setSubtitleSubmitError(null);
    } catch (error) {
      setSubtitleSubmitError(error instanceof Error ? error.message : "ثبت زیرنویس انجام نشد.");
    } finally {
      setSubtitleSubmitting(false);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current
        .requestFullscreen()
        .catch((err) => console.error(err));
    } else {
      await document
        .exitFullscreen()
        .catch((err) => console.error(err));
    }
  };

  const togglePip = async () => {
    if (!videoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error("PiP error:", err);
    }
  };

  const handleTouchEnd = (
    e: React.TouchEvent<HTMLDivElement>
  ) => {
    const touch = e.changedTouches[0];

    if (!touch) return;

    const target = e.target as HTMLElement;

    if (
      target.closest(
        "button, input, select, textarea"
      ) &&
      target !== videoRef.current
    ) {
      lastTouchRef.current = null;
      return;
    }

    const now = Date.now();
    const lastTouch = lastTouchRef.current;

    const isDoubleTap =
      lastTouch &&
      now - lastTouch.time < 320 &&
      Math.abs(touch.clientX - lastTouch.x) < 80;

    if (isDoubleTap) {
      void toggleFullscreen();
      lastTouchRef.current = null;
      return;
    }

    lastTouchRef.current = {
      time: now,
      x: touch.clientX,
    };
  };

  const handleMouseMove = () => {
    setShowControls(true);

    if (hideControlsTimeoutRef.current) {
      clearTimeout(
        hideControlsTimeoutRef.current
      );
    }

    if (playing) {
      hideControlsTimeoutRef.current =
        window.setTimeout(() => {
          setShowControls(false);
        }, 2500);
    }
  };

  useEffect(() => {
    if (!videoRef.current) return;

    if (typeof isPlaying === "boolean") {
      if (isPlaying) {
        setIsVideoBuffering(true);

        videoRef.current.play().catch(() => {
          setIsVideoBuffering(false);
        });
      } else {
        videoRef.current.pause();
        setIsVideoBuffering(false);
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (typeof currentTime !== "number") return;

    const diff = Math.abs(
      videoRef.current.currentTime - currentTime
    );

    if (diff > 0.75) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  useEffect(() => {
    let cancelled = false;

    setSubtitlesRequested(false);
    setSubtitleTracks([]);
    setSubtitleStatus("idle");
    setSubtitleError(null);
    setActiveSubtitle(-1);

    void (async () => {
      await loadSubtitles();

      if (cancelled) return;
    })();

    return () => {
      cancelled = true;
    };
  }, [
    src,
    mediaId,
    subtitleSeason,
    subtitleEpisode,
    customSubtitleTracks,
    loadSubtitles,
  ]);

  useEffect(() => {
    const handleGlobalKeyDown = (
      e: KeyboardEvent
    ) => {
      const target = e.target as HTMLElement | null;

      if (
        target?.closest(
          '#room-chat-input, [data-video-link-input], [data-video-keyboard-ignore], .archive-modal input, .archive-modal select, .archive-modal textarea'
        )
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      let handled = true;

      switch (key) {
        case "j":
          handleKeyboardSeek(-10);
          break;

        case "l":
          handleKeyboardSeek(10);
          break;

        case "k":
        case " ":
        case "spacebar":
          togglePlay();
          break;

        case "arrowleft":
          handleKeyboardSeek(-5);
          break;

        case "arrowright":
          handleKeyboardSeek(5);
          break;

        case "f":
          void toggleFullscreen();
          break;

        default:
          handled = false;
      }

      if (handled) {
        e.preventDefault();
      }
    };

    document.addEventListener(
      "keydown",
      handleGlobalKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleGlobalKeyDown
      );
    };
  }, [handleKeyboardSeek, togglePlay]);

  useEffect(() => {
    const handleFsChange = () =>
      setIsFullscreen(
        !!document.fullscreenElement
      );

    const handlePipChange = () =>
      setIsPip(
        document.pictureInPictureElement ===
        videoRef.current
      );

    document.addEventListener(
      "fullscreenchange",
      handleFsChange
    );

    const videoElem = videoRef.current;

    if (videoElem) {
      videoElem.addEventListener(
        "enterpictureinpicture",
        handlePipChange
      );

      videoElem.addEventListener(
        "leavepictureinpicture",
        handlePipChange
      );
    }

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFsChange
      );

      if (videoElem) {
        videoElem.removeEventListener(
          "enterpictureinpicture",
          handlePipChange
        );

        videoElem.removeEventListener(
          "leavepictureinpicture",
          handlePipChange
        );
      }
    };
  }, []);

  useEffect(() => {
    if (!playing) {
      setShowControls(true);
      setIsVideoBuffering(false);
    }
  }, [playing]);

  useEffect(() => {
    if (
      subtitleStatus !== "loading" &&
      subtitleStatus !== "error" &&
      subtitleStatus !== "no-subtitles"
    ) {
      return;
    }

    const timer = setTimeout(() => {
      setSubtitleStatus("idle");
    }, 10_000);

    return () => clearTimeout(timer);
  }, [subtitleStatus]);

  useEffect(() => {
    if (!showSubtitleSettings) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowSubtitleSettings(false);
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [showSubtitleSettings]);

  const playedPercent =
    duration > 0
      ? Math.min(
        100,
        Math.max(0, (time / duration) * 100)
      )
      : 0;

  return (
    <div
      ref={containerRef}
      dir="ltr"
      aria-label="پخش‌کننده ویدیو"
      onTouchEnd={handleTouchEnd}
      onDoubleClick={() => void toggleFullscreen()}
      onMouseMove={handleMouseMove}
      onMouseLeave={() =>
        playing && setShowControls(false)
      }
      className={`relative group overflow-hidden bg-black rounded-2xl shadow-2xl select-none font-sans text-white h-full w-full ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        onClick={togglePlay}
        onLoadStart={() => {
          updateBufferedRanges();

          if (playing) {
            setIsVideoBuffering(true);
          }
        }}
        onWaiting={handleVideoBufferingStart}
        onStalled={handleVideoBufferingStart}
        onCanPlay={handleVideoBufferingEnd}
        onPlaying={handleVideoBufferingEnd}
        onProgress={updateBufferedRanges}
        onPlay={() => {
          setInternalPlaying(true);

          if (!isPlaying) {
            onPlayRequest?.();
          }

          if (!videoRef.current?.paused) {
            setIsVideoBuffering(
              !videoRef.current?.readyState ||
              videoRef.current.readyState < 3
            );
          }
        }}
        onPause={() => {
          setInternalPlaying(false);
          setIsVideoBuffering(false);

          if (isPlaying) {
            onPauseRequest?.();
          }
        }}
        onTimeUpdate={() => {
          const t =
            videoRef.current?.currentTime ?? 0;

          setInternalCurrentTime(t);
          onLocalTimeUpdate?.(t);
          updateBufferedRanges();
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(
              videoRef.current.duration
            );

            updateBufferedRanges();

            if (
              typeof currentTime === "number"
            ) {
              videoRef.current.currentTime =
                currentTime;
            }
          }
        }}
        onEnded={() => {
          setInternalPlaying(false);
          setIsVideoBuffering(false);
          updateBufferedRanges();
        }}
        className={`w-full h-full object-contain ${canControlMedia ? "cursor-pointer" : "cursor-default"} focus:outline-none`}
      />

      {/* Video loading spinner */}
      <AnimatePresence>
        {isVideoBuffering && playing && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
            }}
            transition={{
              duration: 0.2,
            }}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            aria-label="در حال بارگذاری ویدیو"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-black/50 backdrop-blur-md max-[410px]:h-10 max-[410px]:w-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-white max-[410px]:h-5 max-[410px]:w-5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {currentSubtitleText &&
        activeSubtitle >= 0 && (
          <motion.div
            key={`${activeSubtitle}-${currentSubtitleText}`}
            initial={{
              opacity: 0,
              y:
                effectiveSubtitleSettings.position ===
                  "middle"
                  ? 4
                  : 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.18,
            }}
            className={`pointer-events-none absolute z-15 flex justify-center ${isCompactPlayerHeight ? "inset-x-2 px-2" : "inset-x-4 px-4"
              } ${effectiveSubtitleSettings.position ===
                "middle"
                ? "top-1/2 -translate-y-1/2"
                : isCompactPlayerHeight
                  ? "bottom-14"
                  : "bottom-19.5 sm:bottom-22"
              }`}
            aria-live="polite"
          >
            <span
              className={`max-w-[92%] whitespace-pre-line rounded-md text-center text-white shadow-lg [text-shadow:0_2px_3px_rgba(0,0,0,0.9)] ${isCompactPlayerHeight
                ? "px-2 py-0.5 text-xs leading-snug"
                : "px-3 py-1.5 leading-relaxed"
                }`}
              style={{
                fontSize: isCompactPlayerHeight
                  ? `${Math.max(10, effectiveSubtitleSettings.fontSize * 0.8)}px`
                  : `${effectiveSubtitleSettings.fontSize}px`,
                fontWeight:
                  effectiveSubtitleSettings.fontWeight,
                opacity:
                  effectiveSubtitleSettings.opacity /
                  100,
                background: `rgba(0, 0, 0, ${effectiveSubtitleSettings.backgroundOpacity /
                  100
                  })`,
              }}
            >
              {currentSubtitleText}
            </span>
          </motion.div>
        )}

      <AnimatePresence>
        {subtitleStatus === "loading" && (
          <motion.div
            initial={{
              opacity: 0,
              y: 6,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 6,
            }}
            onClick={() =>
              setSubtitleStatus("idle")
            }
            className="absolute bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs text-white/80 shadow-xl backdrop-blur-md"
          >
            <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#d04e2f] align-middle" />
            در حال دریافت زیرنویس…
          </motion.div>
        )}

        {subtitleStatus === "error" &&
          subtitleError && (
            <motion.div
              initial={{
                opacity: 0,
                y: 8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 8,
              }}
              onClick={() =>
                setSubtitleStatus("idle")
              }
              className="absolute bottom-20 left-1/2 z-30 w-[min(460px,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-red-400/20 bg-black/80 px-4 py-3 text-center text-sm text-white shadow-2xl backdrop-blur-md"
            >
              <div className="font-medium text-red-300">
                خطا در دریافت زیرنویس
              </div>

              <div className="mt-1 text-xs text-white/65">
                {subtitleError}
              </div>
            </motion.div>
          )}

        {subtitleStatus === "no-subtitles" && (
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 8,
            }}
            onClick={() =>
              setSubtitleStatus("idle")
            }
            className="absolute bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-white/10 bg-black/75 px-4 py-2.5 text-center text-xs text-white/80 shadow-2xl backdrop-blur-md"
          >
            برای این ویدیو زیرنویس آماده نشده است.
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!playing && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.8,
            }}
            transition={{
              duration: 0.2,
            }}
            onClick={togglePlay}
            className={`absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center z-10 max-[410px]:w-10 max-[410px]:h-10 ${canControlMedia ? "cursor-pointer hover:scale-110 transition-transform pointer-events-auto" : "cursor-not-allowed opacity-70"}`}
          >
            <Play className="w-8 h-8 fill-[#d04e2f] text-[#d04e2f] max-[410px]:w-4 max-[410px]:h-4" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {nextEpisode &&
          duration > 0 &&
          time >=
          Math.max(0, duration - 60) && (
            <motion.button
              type="button"
              initial={{
                opacity: 0,
                y: 10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 10,
              }}
              onClick={canControlMedia ? onNextEpisodeRequest : undefined}
              disabled={!canControlMedia}
              aria-label={`پخش قسمت بعدی${nextEpisode.title
                ? `: ${nextEpisode.title}`
                : ""
                }`}
              className="absolute bottom-24 right-4 z-30 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm max-[420px]:text-xs font-semibold text-black shadow-xl transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white/80"
            >
              <Play className="h-4 w-4 fill-current max-[420px]:w-3 max-[420px]:h-3" />
              قسمت بعدی
            </motion.button>
          )}
      </AnimatePresence>

      <AnimatePresence>
        {showShortcutHints && (
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 8,
            }}
            role="dialog"
            aria-label="راهنمای میانبرهای پخش ویدیو"
            className="absolute bottom-20 right-4 z-40 w-[min(320px,calc(100%-2rem))] rounded-xl border border-white/15 bg-black/40 p-4 text-sm text-white shadow-2xl backdrop-blur-md"
            dir="rtl"
          >
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#ffffff4f] pb-1">
              <strong>میانبرهای دسترسی</strong>

              <button
                type="button"
                onClick={() =>
                  setShowShortcutHints(false)
                }
                aria-label="بستن راهنمای میانبرها"
                className="cursor-pointer rounded-md px-2 py-1 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className="grid grid-cols-2 gap-x-4 gap-y-2 text-white/80"
              dir="rtl"
            >
              <span>
                <b className="text-white">J</b> /{" "}
                <b className="text-white">L</b>
              </span>
              <span>۱۰ ثانیه عقب / جلو</span>

              <span>
                <b className="text-white">K</b> /{" "}
                <b className="text-white">Space</b>
              </span>
              <span>پخش / توقف</span>

              <span>
                <b className="text-white">←</b> /{" "}
                <b className="text-white">→</b>
              </span>
              <span>۵ ثانیه عقب / جلو</span>

              <span>
                <b className="text-white">F</b>
              </span>
              <span>تمام‌صفحه</span>

              <span>
                <b className="text-white">
                  Double tap
                </b>
              </span>
              <span>
                تمام‌صفحه با دو ضربه
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtitle settings */}
      <AnimatePresence>
        {showSubtitleSettings && (
          <motion.div
            initial={{
              opacity: 0,
              x: 14,
              y: 0,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              x: 14,
              y: 0,
              scale: 0.98,
            }}
            transition={{
              duration: 0.18,
              ease: "easeOut",
            }}
            className="pointer-events-none absolute inset-0 z-40 flex items-end justify-end p-3 pb-19.5 sm:p-4 sm:pb-21.5 md:p-5 md:pb-23"
          >
            <div className="pointer-events-auto flex max-h-full w-[min(430px,100%)] min-w-0 overflow-hidden rounded-2xl bg-black/45 p-1 backdrop-blur-xl max-[520px]:w-full">
              <motion.div
                id="video-subtitle-settings"
                role="dialog"
                aria-label="تنظیمات زیرنویس"
                dir="rtl"
                className="flex min-h-0 w-full max-h-[min(560px,calc(100vh-2rem))] flex-col overflow-hidden rounded-xl text-white max-[520px]:max-h-[min(560px,calc(100vh-1.5rem))]"
              >
                <div className="shrink-0 px-3 pt-3 sm:px-4 sm:pt-4">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <FaRegClosedCaptioning className="h-4 w-4 shrink-0 text-[#d04e2f]" />

                        <strong className="truncate text-sm sm:text-base">
                          تنظیمات زیرنویس
                        </strong>
                      </div>

                      <span className="mt-1 block text-[11px] text-white/55 sm:text-xs">
                        ظاهر، جایگاه و هماهنگی زیرنویس را تنظیم کن
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setShowSubtitleSettings(false)
                      }
                      aria-label="بستن تنظیمات زیرنویس"
                      className="shrink-0 rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                    >
                      <X className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                </div>

                <div
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4 [scrollbar-gutter:stable]"
                  style={{
                    scrollbarWidth: "thin",
                  }}
                >
                  <div className="space-y-3 pr-1 sm:pr-1.5">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">
                            زیرنویس
                          </div>

                          <div className="mt-0.5 text-[11px] text-white/50 sm:text-xs">
                            {subtitleStatus === "loading"
                              ? "در حال دریافت زیرنویس…"
                              : subtitleStatus === "no-subtitles"
                                ? "برای این ویدیو زیرنویسی پیدا نشد"
                                : subtitleStatus === "error"
                                  ? subtitleError ||
                                  "دریافت زیرنویس ناموفق بود"
                                  : subtitleTracks.length
                                    ? activeSubtitle >= 0
                                      ? "فعال است"
                                      : "خاموش است"
                                    : "زیرنویسی در دسترس نیست"}
                          </div>
                        </div>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={activeSubtitle >= 0}
                          aria-label="روشن یا خاموش کردن زیرنویس"
                          disabled={
                            subtitleStatus !== "ready" ||
                            !subtitleTracks.length
                          }
                          onClick={toggleSubtitles}
                          className={`relative h-7 w-12 shrink-0 rounded-full p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${activeSubtitle >= 0
                            ? "bg-[#d04e2f]"
                            : "bg-white/15 hover:bg-white/20"
                            }`}
                        >
                          <span
                            className={`block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${activeSubtitle >= 0
                              ? "translate-x-0"
                              : "-translate-x-5"
                              }`}
                          />
                        </button>
                      </div>
                    </div>

                    {onSubmitSubtitle && canControlMedia && (
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="mb-3">
                          <div className="text-sm font-semibold">زیرنویس اختصاصی اتاق</div>
                          <div className="mt-0.5 text-[11px] leading-relaxed text-white/50 sm:text-xs">
                            فایل SRT را آپلود کن یا لینک مستقیم فایل SRT را وارد کن. زیرنویس جدید جایگزین زیرنویس قبلی اتاق می‌شود.
                          </div>
                        </div>

                        <label className="mb-2 block text-xs text-white/65">لینک مستقیم SRT</label>
                        <input
                          type="url"
                          dir="ltr"
                          placeholder="https://example.com/subtitle.srt"
                          value={subtitleSourceUrl}
                          onChange={(event) => {
                            setSubtitleSourceUrl(event.target.value);
                            if (subtitleFile) setSubtitleFile(null);
                            setSubtitleSubmitError(null);
                          }}
                          disabled={subtitleSubmitting}
                          className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-xs text-white outline-none transition placeholder:text-white/25 focus:border-white/30"
                          data-video-keyboard-ignore
                        />

                        <div className="my-3 flex items-center gap-2 text-[10px] text-white/30">
                          <span className="h-px flex-1 bg-white/10" />
                          <span>یا</span>
                          <span className="h-px flex-1 bg-white/10" />
                        </div>

                        <label className="block text-xs text-white/65">آپلود فایل SRT</label>
                        <input
                          type="file"
                          accept=".srt,text/plain,application/x-subrip"
                          onChange={(event) => {
                            const nextFile = event.target.files?.[0] ?? null;
                            setSubtitleSourceUrl("");
                            setSubtitleFile(nextFile);
                            if (!nextFile) {
                              setSubtitleSubmitError(null);
                              return;
                            }
                            void validateLocalSubtitleFile(nextFile).then(setSubtitleSubmitError);
                          }}
                          disabled={subtitleSubmitting}
                          className="mt-1 block w-full cursor-pointer rounded-lg border border-white/10 bg-black/25 px-2 py-2 text-xs text-white/70 file:mr-2 file:rounded-md file:border-0 file:bg-white/10 file:px-2.5 file:py-1.5 file:text-xs file:text-white hover:file:bg-white/15"
                        />

                        {subtitleSubmitError && (
                          <p className="mt-2 text-[11px] leading-relaxed text-red-300" role="alert">
                            {subtitleSubmitError}
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => void handleSubmitRoomSubtitle()}
                          disabled={subtitleSubmitting || (!subtitleFile && !subtitleSourceUrl.trim())}
                          className="mt-3 w-full rounded-lg bg-[#d04e2f] px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-[#bb4328] disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {subtitleSubmitting ? "در حال دریافت و پردازش…" : "ثبت و جایگزینی زیرنویس"}
                        </button>
                      </div>
                    )}

                    {subtitleStatus === "ready" &&
                      subtitleTracks.length > 0 && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <label className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-3">
                              <span className="flex items-center justify-between gap-2 text-xs text-white/65">
                                <span>اندازه متن</span>

                                <strong className="text-white">
                                  {effectiveSubtitleSettings.fontSize}px
                                </strong>
                              </span>

                              <input
                                type="range"
                                min="14"
                                max="34"
                                step="1"
                                value={
                                  effectiveSubtitleSettings.fontSize
                                }
                                onChange={(event) =>
                                  updateSubtitle(
                                    "fontSize",
                                    Number(event.target.value)
                                  )
                                }
                                className="mt-2 w-full accent-[#d04e2f]"
                              />
                            </label>

                            <label className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-3">
                              <span className="flex items-center justify-between gap-2 text-xs text-white/65">
                                <span>شفافیت متن</span>

                                <strong className="text-white">
                                  {effectiveSubtitleSettings.opacity}%
                                </strong>
                              </span>

                              <input
                                type="range"
                                min="60"
                                max="100"
                                step="5"
                                value={
                                  effectiveSubtitleSettings.opacity
                                }
                                onChange={(event) =>
                                  updateSubtitle(
                                    "opacity",
                                    Number(event.target.value)
                                  )
                                }
                                className="mt-2 w-full accent-[#d04e2f]"
                              />
                            </label>

                            <label className="min-w-0 rounded-xl border border-white/10 bg-white/5 p-3">
                              <span className="flex items-center justify-between gap-2 text-xs text-white/65">
                                <span>پس‌زمینه</span>

                                <strong className="text-white">
                                  {
                                    effectiveSubtitleSettings.backgroundOpacity
                                  }%
                                </strong>
                              </span>

                              <input
                                type="range"
                                min="0"
                                max="90"
                                step="5"
                                value={
                                  effectiveSubtitleSettings.backgroundOpacity
                                }
                                onChange={(event) =>
                                  updateSubtitle(
                                    "backgroundOpacity",
                                    Number(event.target.value)
                                  )
                                }
                                className="mt-2 w-full accent-[#d04e2f]"
                              />
                            </label>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                              <span className="mb-2 block px-1 text-xs text-white/60">
                                ضخامت
                              </span>

                              <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/20 p-1">
                                {([500, 700, 800] as const).map(
                                  (weight) => (
                                    <button
                                      key={weight}
                                      type="button"
                                      onClick={() =>
                                        updateSubtitle(
                                          "fontWeight",
                                          weight
                                        )
                                      }
                                      className={`rounded-md px-2 py-2 text-xs transition ${effectiveSubtitleSettings.fontWeight ===
                                        weight
                                        ? "bg-white/15 text-white"
                                        : "text-white/55 hover:bg-white/10 hover:text-white"
                                        }`}
                                    >
                                      {weight === 500
                                        ? "عادی"
                                        : weight === 700
                                          ? "نیمه‌پر"
                                          : "پررنگ"}
                                    </button>
                                  )
                                )}
                              </div>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                              <span className="mb-2 block px-1 text-xs text-white/60">
                                جایگاه
                              </span>

                              <div className="grid grid-cols-2 gap-1 rounded-lg bg-black/20 p-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSubtitle(
                                      "position",
                                      "low"
                                    )
                                  }
                                  className={`rounded-md px-2 py-2 text-xs transition ${effectiveSubtitleSettings.position ===
                                    "low"
                                    ? "bg-white/15 text-white"
                                    : "text-white/55 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                  پایین
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSubtitle(
                                      "position",
                                      "middle"
                                    )
                                  }
                                  className={`rounded-md px-2 py-2 text-xs transition ${effectiveSubtitleSettings.position ===
                                    "middle"
                                    ? "bg-white/15 text-white"
                                    : "text-white/55 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                  میانی
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Offset */}
                          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="min-w-0">
                                <strong className="block text-xs sm:text-sm">
                                  هماهنگ‌سازی زمان زیرنویس
                                </strong>

                                <span className="mt-1 block text-[11px] leading-relaxed text-white/50 sm:text-xs">
                                  مقدار مثبت یعنی زیرنویس دیرتر نمایش داده می‌شود.
                                </span>
                              </div>

                              <label className="flex shrink-0 items-center gap-2">
                                <span className="text-xs text-white/60">
                                  تاخیر
                                </span>

                                <input
                                  type="number"
                                  min="-10000"
                                  max="10000"
                                  step="100"
                                  value={
                                    effectiveSubtitleSettings.offsetMs
                                  }
                                  onChange={(event) =>
                                    updateSubtitle(
                                      "offsetMs",
                                      Number(event.target.value) || 0
                                    )
                                  }
                                  className="w-24 rounded-lg border border-white/10 bg-black/25 px-2.5 py-2 text-center text-xs text-white outline-none transition focus:border-white/30 sm:w-28"
                                />

                                <small className="text-xs text-white/45">
                                  ms
                                </small>
                              </label>
                            </div>

                            <div className="mt-3 grid grid-cols-5 gap-1">
                              {[1000, 500, 0, -500, -1000].map(
                                (value) => (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() =>
                                      updateSubtitle(
                                        "offsetMs",
                                        Math.max(
                                          -10000,
                                          Math.min(
                                            10000,
                                            value === 0
                                              ? 0
                                              : effectiveSubtitleSettings.offsetMs +
                                              value
                                          )
                                        )
                                      )
                                    }
                                    className={`rounded-lg border px-1.5 py-2 text-[10px] transition sm:text-xs ${value === 0
                                      ? effectiveSubtitleSettings.offsetMs === 0
                                        ? "border-white/15 bg-white/15 text-white"
                                        : "border-white/5 bg-black/15 text-white/50 hover:bg-white/10 hover:text-white"
                                      : "border-white/5 bg-black/15 text-white/50 hover:bg-white/10 hover:text-white"
                                      }`}
                                  >
                                    {value === 0
                                      ? "۰"
                                      : `${value > 0 ? "+" : ""}${value / 1000
                                      }s`}
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={resetSubtitleSettings}
                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/65 transition hover:bg-white/10 hover:text-white"
                          >
                            بازنشانی تنظیمات زیرنویس
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{
              opacity: 0,
              y: 15,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              y: 15,
            }}
            transition={{
              duration: 0.25,
              ease: "easeOut",
            }}
            className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-3 bg-linear-to-t from-black/90 via-black/40 to-transparent p-4"
          >
            <div className="group/scrubber relative flex h-3 w-full cursor-pointer items-center">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-lg"
                style={{
                  background: "rgba(255,255,255,.28)",
                }}
              />

              {duration > 0 &&
                bufferedRanges.map((range, index) => {
                  const left = Math.min(
                    100,
                    Math.max(0, (range.start / duration) * 100)
                  );

                  const width = Math.min(
                    100 - left,
                    Math.max(
                      0,
                      ((range.end - range.start) / duration) * 100
                    )
                  );

                  return (
                    <div
                      key={`${range.start}-${range.end}-${index}`}
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 rounded-lg bg-white/45"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                      }}
                    />
                  );
                })}

              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-lg bg-[#d04e2f]"
                style={{
                  width: `${playedPercent}%`,
                }}
              />

              <input
                type="range"
                min={0}
                max={duration || 100}
                step="0.1"
                value={time}
                onChange={handleScrub}
                disabled={!canControlMedia}
                className="
      absolute
      inset-x-0
      top-1/2
      z-10
      h-3
      w-full
      -translate-y-1/2
      cursor-pointer
      appearance-none
      bg-transparent
      focus:outline-none

      [&::-webkit-slider-runnable-track]:h-1
      [&::-webkit-slider-runnable-track]:rounded-full
      [&::-webkit-slider-runnable-track]:bg-transparent

      [&::-webkit-slider-thumb]:-mt-1.25
      [&::-webkit-slider-thumb]:h-3
      [&::-webkit-slider-thumb]:w-3
      [&::-webkit-slider-thumb]:appearance-none
      [&::-webkit-slider-thumb]:rounded-full
      [&::-webkit-slider-thumb]:border-0
      [&::-webkit-slider-thumb]:bg-[#d04e2f]
      [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(0,0,0,0.15)]
      [&::-webkit-slider-thumb]:transition-transform
      [&::-webkit-slider-thumb]:duration-150
      group-hover/scrubber:[&::-webkit-slider-thumb]:scale-[1.01]

      [&::-moz-range-track]:h-1
      [&::-moz-range-track]:rounded-full
      [&::-moz-range-track]:bg-transparent

      [&::-moz-range-thumb]:h-3
      [&::-moz-range-thumb]:w-3
      [&::-moz-range-thumb]:rounded-full
      [&::-moz-range-thumb]:border-0
      [&::-moz-range-thumb]:bg-[#d04e2f]
      [&::-moz-range-thumb]:transition-transform
      [&::-moz-range-thumb]:duration-150
      group-hover/scrubber:[&::-moz-range-thumb]:scale-[1.01]
    "
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <button
                  disabled={!canControlMedia}
                  onClick={() =>
                    handleSeekBy(-10)
                  }
                  title="Rewind 10s"
                  className="rounded-full p-1.5 text-gray-200 transition-colors hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>

                <button
                  disabled={!canControlMedia}
                  onClick={togglePlay}
                  title={
                    playing ? "Pause" : "Play"
                  }
                  className="rounded-full bg-[#d04e2f]/15 p-2 text-[#d04e2f] backdrop-blur-sm transition-all hover:bg-[#d04e2f]/25 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {playing ? (
                    <Pause className="h-5 w-5 fill-white text-white max-[420px]:h-3 max-[420px]:w-3" />
                  ) : (
                    <Play className="h-5 w-5 fill-[#d04e2f] text-[#d04e2f] max-[420px]:h-3 max-[420px]:w-3" />
                  )}
                </button>

                <button
                  disabled={!canControlMedia}
                  onClick={() =>
                    handleSeekBy(10)
                  }
                  title="Fast Forward 10s"
                  className="hidden rounded-full p-1.5 text-gray-200 transition-colors hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 sm:block"
                >
                  <RotateCw className="h-4 w-4" />
                </button>

                {/* Volume */}
                <div
                  className="group/volume flex items-center rounded-xl border border-white/10 bg-black/25 px-1 py-1 backdrop-blur-md transition-all duration-200"
                  title={`Volume ${Math.round(
                    (isMuted ? 0 : volume) * 100
                  )}%`}
                >
                  <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={
                      isMuted || volume === 0
                        ? "Unmute"
                        : "Mute"
                    }
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-200 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {isMuted ||
                      volume === 0 ? (
                      <VolumeX className="h-4 w-4 text-[#d04e2f]" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </button>

                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={
                      isMuted ? 0 : volume
                    }
                    onChange={handleVolumeChange}
                    aria-label="Volume"
                    className="h-1.5 w-0 max-w-20 cursor-pointer appearance-none overflow-hidden rounded-full opacity-0 transition-[width,opacity] duration-200 focus:outline-none group-hover/volume:w-20 group-hover/volume:opacity-100 max-[520px]:group-hover/volume:w-14"
                    style={{
                      background: `linear-gradient(to right, #d04e2f 0%, #d04e2f ${Math.round(
                        (isMuted ? 0 : volume) *
                        100
                      )}%, rgba(255,255,255,.22) ${Math.round(
                        (isMuted ? 0 : volume) *
                        100
                      )}%, rgba(255,255,255,.22) 100%)`,
                      accentColor: "#d04e2f",
                    }}
                  />
                </div>
              </div>

              <div className="hidden rounded-md border border-white/5 bg-black/30 px-2.5 py-1 font-mono text-xs tracking-wider text-gray-300 backdrop-blur-sm sm:block">
                {formatTime(time)} /{" "}
                {formatTime(duration)}
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-200 backdrop-blur-sm">
                  {quality}
                </span>

                {/* CC opens subtitle settings instead of toggling subtitles */}
                <button
                  type="button"
                  onClick={() =>
                    setShowSubtitleSettings(
                      (open) => !open
                    )
                  }
                  disabled={
                    subtitleStatus ===
                    "loading"
                  }
                  title={
                    subtitleStatus ===
                      "loading"
                      ? "در حال دریافت زیرنویس"
                      : "تنظیمات زیرنویس"
                  }
                  aria-label="تنظیمات زیرنویس"
                  aria-expanded={
                    showSubtitleSettings
                  }
                  aria-controls="video-subtitle-settings"
                  aria-busy={
                    subtitleStatus ===
                    "loading"
                  }
                  className={`relative rounded-full p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${showSubtitleSettings
                    ? "bg-white/15 text-white"
                    : activeSubtitle >= 0
                      ? "text-white"
                      : "text-gray-200 hover:bg-white/20 hover:text-white"
                    } ${subtitleStatus ===
                      "loading"
                      ? "animate-pulse"
                      : ""
                    }`}
                >
                  <FaRegClosedCaptioning className="h-4 w-4" />

                  {activeSubtitle >= 0 &&
                    subtitleStatus ===
                    "ready" && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#d04e2f]" />
                    )}

                  {subtitleStatus ===
                    "loading" && (
                      <span className="absolute -right-0.5 -top-0.5 h-2 w-2 animate-ping rounded-full bg-yellow-400" />
                    )}
                </button>

                <button
                  onClick={togglePip}
                  title="Picture in Picture"
                  className={`hidden rounded-full p-1.5 transition-colors hover:bg-white/20 sm:block ${isPip
                    ? "text-red-400"
                    : "text-gray-200 hover:text-white"
                    }`}
                >
                  <PictureInPicture2 className="h-4 w-4" />
                </button>

                <button
                  onClick={toggleFullscreen}
                  title={
                    isFullscreen
                      ? "Exit Fullscreen"
                      : "Fullscreen"
                  }
                  className="rounded-full p-1.5 text-gray-200 transition-colors hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPlayer;