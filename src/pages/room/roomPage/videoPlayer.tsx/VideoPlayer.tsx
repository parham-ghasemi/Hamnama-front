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
  Keyboard,
  Captions,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMkvSubtitles } from "../../../../hooks/useMKVSubtitles";
import type { SubtitleSettings } from "../settingsModal/SettingsModal";

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  quality?: string;
  autoPlay?: boolean;
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
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  quality = "1080p",
  autoPlay = false,
  className = "",
  isPlaying,
  currentTime,
  onPlayRequest,
  onPauseRequest,
  onSeekRequest,
  onLocalTimeUpdate,
  nextEpisode,
  onNextEpisodeRequest,
  subtitleSettings = { fontSize: 20, opacity: 100, backgroundOpacity: 72, fontWeight: 500, position: "low" },
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideControlsTimeoutRef = useRef<number | null>(null);

  const [internalPlaying, setInternalPlaying] = useState(autoPlay);
  const [internalCurrentTime, setInternalCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);
  const [showShortcutHints, setShowShortcutHints] = useState(false);
  const [subtitlesRequested, setSubtitlesRequested] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState(-1);
  const lastTouchRef = useRef<{ time: number; x: number } | null>(null);

  // MKV subtitles are demuxed in the browser and rendered by React as an
  // overlay. This avoids relying on the browser's opaque native TextTrack
  // renderer, which is not reliable for embedded MKV subtitle streams.
  const {
    status: mkvSubtitleStatus,
    error: mkvSubtitleError,
    tracks: mkvSubtitleTracks,
    cues: mkvSubtitleCues,
    cueRevision: mkvCueRevision,
    bytesRead: mkvBytesRead,
    totalBytes: mkvTotalBytes,
    loadingElapsedMs: mkvLoadingElapsedMs,
  } = useMkvSubtitles(videoRef, subtitlesRequested ? src : "");

  const playing = isPlaying ?? internalPlaying;
  const time = currentTime ?? internalCurrentTime;

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const pad = (num: number) => num.toString().padStart(2, "0");
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (playing) {
      if (onPauseRequest) onPauseRequest();
      else setInternalPlaying(false);
      videoRef.current.pause();
    } else {
      if (onPlayRequest) onPlayRequest();
      else setInternalPlaying(true);
      videoRef.current.play().catch(() => { });
    }
  }, [playing, onPauseRequest, onPlayRequest]);

  const handleSeekBy = (seconds: number) => {
    if (!videoRef.current) return;
    const next = Math.min(Math.max(videoRef.current.currentTime + seconds, 0), duration || 0);
    videoRef.current.currentTime = next;
    if (onSeekRequest) onSeekRequest(next);
    else {
      setInternalCurrentTime(next);
      onLocalTimeUpdate?.(next);
    }
  };

  const handleKeyboardSeek = useCallback((seconds: number) => {
    handleSeekBy(seconds);
  }, [duration]);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
    if (onSeekRequest) onSeekRequest(targetTime);
    else {
      setInternalCurrentTime(targetTime);
      onLocalTimeUpdate?.(targetTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const currentSubtitleText = useMemo(() => {
    if (activeSubtitle < 0) return null;

    const track = mkvSubtitleTracks[activeSubtitle];
    if (!track || !mkvSubtitleCues.length) return null;

    const videoTime = videoRef.current?.currentTime ?? time;

    // Cues are emitted in MKV timeline order. Binary-search for the region
    // around the current time, then check nearby overlapping cues for the
    // selected track.
    let lo = 0;
    let hi = mkvSubtitleCues.length - 1;
    let candidate = -1;

    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const cue = mkvSubtitleCues[mid];

      if (cue.start <= videoTime) {
        candidate = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    for (let i = candidate; i >= 0; i -= 1) {
      const cue = mkvSubtitleCues[i];
      if (cue.start > videoTime) continue;
      if (videoTime - cue.start > 15) break;
      if (cue.trackNumber === track.number && cue.end > videoTime) {
        return cue.text;
      }
    }

    for (let i = candidate + 1; i < mkvSubtitleCues.length; i += 1) {
      const cue = mkvSubtitleCues[i];
      if (cue.start > videoTime) break;
      if (cue.trackNumber === track.number && cue.end > videoTime) {
        return cue.text;
      }
    }

    return null;
  }, [activeSubtitle, mkvSubtitleCues, mkvSubtitleTracks, time, mkvCueRevision]);

  const toggleSubtitles = useCallback(() => {
    // Do not touch the MKV subtitle parser until the user explicitly asks
    // for subtitles. This keeps subtitle extraction off the critical path
    // for normal video playback.
    if (!subtitlesRequested) {
      setSubtitlesRequested(true);
      return;
    }

    if (mkvSubtitleStatus === "loading") return;

    if (!mkvSubtitleTracks.length) {
      console.warn("[mkv-subtitles] no parsed subtitle tracks", {
        status: mkvSubtitleStatus,
        error: mkvSubtitleError,
        src,
      });
      return;
    }

    setActiveSubtitle((current) => (current >= 0 ? -1 : 0));
  }, [mkvSubtitleError, mkvSubtitleStatus, mkvSubtitleTracks.length, src, subtitlesRequested]);

  useEffect(() => {
    // The first subtitle-button press starts extraction. Once extraction
    // finishes successfully, enable the first available track automatically
    // so the same click acts as the "enable subtitles" action.
    if (subtitlesRequested && mkvSubtitleStatus !== "loading" && mkvSubtitleTracks.length > 0) {
      setActiveSubtitle((current) => (current >= 0 ? current : 0));
    }
  }, [mkvSubtitleStatus, mkvSubtitleTracks.length, subtitlesRequested]);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch((err) => console.error(err));
    } else {
      await document.exitFullscreen().catch((err) => console.error(err));
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

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (!touch) return;

    const target = e.target as HTMLElement;
    if (target.closest("button, input, select, textarea") && target !== videoRef.current) {
      lastTouchRef.current = null;
      return;
    }

    const now = Date.now();
    const lastTouch = lastTouchRef.current;
    const isDoubleTap = lastTouch && now - lastTouch.time < 320 && Math.abs(touch.clientX - lastTouch.x) < 80;

    if (isDoubleTap) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        handleSeekBy(touch.clientX - rect.left < rect.width / 2 ? -10 : 10);
      }
      lastTouchRef.current = null;
      return;
    }

    lastTouchRef.current = { time: now, x: touch.clientX };
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (playing) {
      hideControlsTimeoutRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  useEffect(() => {
    if (!videoRef.current) return;
    if (typeof isPlaying === "boolean") {
      if (isPlaying) {
        videoRef.current.play().catch(() => { });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (typeof currentTime !== "number") return;

    const diff = Math.abs(videoRef.current.currentTime - currentTime);
    if (diff > 0.75) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  useEffect(() => {
    // A new source starts with subtitle extraction disabled. The next click
    // on the captions button explicitly opts into MKV subtitle loading.
    setSubtitlesRequested(false);
    setActiveSubtitle(-1);
  }, [src]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;

      if (target?.closest('#room-chat-input, [data-video-link-input], [data-video-keyboard-ignore], .archive-modal input, .archive-modal select, .archive-modal textarea')) {
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

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleKeyboardSeek, togglePlay]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    const handlePipChange = () => setIsPip(document.pictureInPictureElement === videoRef.current);

    document.addEventListener("fullscreenchange", handleFsChange);

    const videoElem = videoRef.current;
    if (videoElem) {
      videoElem.addEventListener("enterpictureinpicture", handlePipChange);
      videoElem.addEventListener("leavepictureinpicture", handlePipChange);
    }

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      if (videoElem) {
        videoElem.removeEventListener("enterpictureinpicture", handlePipChange);
        videoElem.removeEventListener("leavepictureinpicture", handlePipChange);
      }
    };
  }, []);

  useEffect(() => {
    if (!playing) {
      setShowControls(true);
    }
  }, [playing]);

  return (
    <div
      ref={containerRef}
      dir="ltr"
      aria-label="پخش‌کننده ویدیو"
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
      className={`relative group overflow-hidden bg-black rounded-2xl shadow-2xl select-none font-sans text-white h-full w-full ${className}`}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        onClick={togglePlay}
        onPlay={() => {
          setInternalPlaying(true);

          if (!isPlaying) {
            onPlayRequest?.();
          }
        }}

        onPause={() => {
          setInternalPlaying(false);

          if (isPlaying) {
            onPauseRequest?.();
          }
        }}
        onTimeUpdate={() => {
          const t = videoRef.current?.currentTime ?? 0;
          setInternalCurrentTime(t);
          onLocalTimeUpdate?.(t);
        }}
        onLoadedMetadata={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
            if (typeof currentTime === "number") {
              videoRef.current.currentTime = currentTime;
            }
          }
        }}
        onEnded={() => setInternalPlaying(false)}
        className="w-full h-full object-contain cursor-pointer focus:outline-none"
      />

      {currentSubtitleText && activeSubtitle >= 0 && (
        <motion.div
          key={`${activeSubtitle}-${currentSubtitleText}`}
          initial={{ opacity: 0, y: subtitleSettings.position === "middle" ? 4 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className={`pointer-events-none absolute inset-x-4 z-15 flex justify-center px-4 ${subtitleSettings.position === "middle" ? "top-1/2 -translate-y-1/2" : "bottom-19.5 sm:bottom-22"}`}
          aria-live="polite"
        >
          <span
            className="max-w-[92%] whitespace-pre-line rounded-md px-3 py-1.5 text-center leading-relaxed text-white shadow-lg [text-shadow:0_2px_3px_rgba(0,0,0,0.9)]"
            style={{
              fontSize: `${subtitleSettings.fontSize}px`,
              fontWeight: subtitleSettings.fontWeight,
              opacity: subtitleSettings.opacity / 100,
              background: `rgba(0, 0, 0, ${subtitleSettings.backgroundOpacity / 100})`,
            }}
          >
            {currentSubtitleText}
          </span>
        </motion.div>
      )}

      <AnimatePresence>
        {mkvSubtitleStatus === "loading" && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="absolute bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs text-white/80 shadow-xl backdrop-blur-md"
          >
            <span className="mr-2 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#d04e2f] align-middle" />
            {mkvTotalBytes && mkvTotalBytes > 0
              ? `در حال آماده‌سازی زیرنویس · ${Math.min(100, Math.round((mkvBytesRead / mkvTotalBytes) * 100))}%`
              : mkvLoadingElapsedMs > 8000 ? "در حال آماده‌سازی زیرنویس…" : "در حال خواندن زیرنویس…"}
          </motion.div>
        )}

        {mkvSubtitleStatus === "error" && mkvSubtitleError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-20 left-1/2 z-30 w-[min(460px,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-red-400/20 bg-black/80 px-4 py-3 text-center text-sm text-white shadow-2xl backdrop-blur-md"
          >
            <div className="font-medium text-red-300">Couldn’t load subtitles</div>
            <div className="mt-1 text-xs text-white/65">{mkvSubtitleError}</div>
          </motion.div>
        )}

        {mkvSubtitleStatus === "no-subtitles" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-white/10 bg-black/75 px-4 py-2.5 text-center text-xs text-white/80 shadow-2xl backdrop-blur-md"
          >
            No supported embedded subtitles were found in this video.
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!playing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform pointer-events-auto z-10 max-[410px]:w-10 max-[410px]:h-10"
          >
            <Play className="w-8 h-8 fill-[#d04e2f] text-[#d04e2f] max-[410px]:w-4 max-[410px]:h-4 " />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {nextEpisode && duration > 0 && time >= Math.max(0, duration - 60) && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={onNextEpisodeRequest}
            aria-label={`پخش قسمت بعدی${nextEpisode.title ? `: ${nextEpisode.title}` : ""}`}
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            role="dialog"
            aria-label="راهنمای میانبرهای پخش ویدیو"
            className="absolute bottom-20 right-4 z-40 w-[min(320px,calc(100%-2rem))] rounded-xl border border-white/15 bg-black/40 p-4 text-sm text-white shadow-2xl backdrop-blur-md"
            dir="rtl"
          >
            <div className="mb-4 pb-1 flex items-center justify-between gap-3 border-b border-[#ffffff4f]">
              <strong>میانبرهای دسترسی</strong>
              <button
                type="button"
                onClick={() => setShowShortcutHints(false)}
                aria-label="بستن راهنمای میانبرها"
                className="rounded-md px-2 py-1 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/60 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-white/80" dir="rtl">
              <span><b className="text-white">J</b> / <b className="text-white">L</b></span><span>۱۰ ثانیه عقب / جلو</span>
              <span><b className="text-white">K</b> / <b className="text-white">Space</b></span><span>پخش / توقف</span>
              <span><b className="text-white">←</b> / <b className="text-white">→</b></span><span>۵ ثانیه عقب / جلو</span>
              <span><b className="text-white">F</b></span><span>تمام‌صفحه</span>
              <span><b className="text-white">Double tap</b></span><span>۱۰ ثانیه عقب / جلو در موبایل</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="absolute inset-x-0 bottom-0 z-20 p-4 bg-linear-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-3"
          >
            <div className="relative flex items-center group/scrubber w-full h-3 cursor-pointer">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step="0.1"
                value={time}
                onChange={handleScrub}
                className="absolute inset-0 w-full h-1 rounded-lg appearance-none cursor-pointer hover:h-2 transition-all duration-150 focus:outline-none"
                style={{
                  background: duration > 0
                    ? `linear-gradient(to right, #d04e2f 0%, #d04e2f ${Math.min(100, Math.max(0, (time / duration) * 100))}%, rgba(255,255,255,.28) ${Math.min(100, Math.max(0, (time / duration) * 100))}%, rgba(255,255,255,.28) 100%)`
                    : "rgba(255,255,255,.28)",
                  accentColor: "#d04e2f",
                }}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleSeekBy(-10)}
                  title="Rewind 10s"
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-gray-200 hover:text-white"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePlay}
                  title={playing ? "Pause" : "Play"}
                  className="p-2 rounded-full bg-[#d04e2f]/15 hover:bg-[#d04e2f]/25 transition-all text-[#d04e2f] backdrop-blur-sm"
                >
                  {playing ? (
                    <Pause className="w-5 h-5 fill-white text-white max-[420px]:w-3 max-[420px]:h-3" />
                  ) : (
                    <Play className="w-5 h-5 fill-[#d04e2f] text-[#d04e2f] max-[420px]:w-3 max-[420px]:h-3" />
                  )}
                </button>

                <button
                  onClick={() => handleSeekBy(10)}
                  title="Fast Forward 10s"
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-gray-200 hover:text-white sm:block hidden"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                <div
                  className="relative flex items-center gap-2"
                  onMouseEnter={() => setIsHoveringVolume(true)}
                  onMouseLeave={() => setIsHoveringVolume(false)}
                >
                  <button
                    onClick={toggleMute}
                    className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-gray-200 hover:text-white"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-red-400" />
                    ) : volume < 0.5 ? (
                      <Volume1 className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isHoveringVolume && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 70 }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden flex items-center"
                      >
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-16 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="text-xs tracking-wider text-gray-300 font-mono bg-black/30 px-2.5 py-1 rounded-md border border-white/5 backdrop-blur-sm sm:block hidden">
                {formatTime(time)} / {formatTime(duration)}
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase bg-white/10 text-gray-200 border border-white/15 rounded backdrop-blur-sm">
                  {quality}
                </span>

                <button
                  type="button"
                  onClick={toggleSubtitles}
                  disabled={
                    subtitlesRequested &&
                    (mkvSubtitleStatus === "loading" || mkvSubtitleStatus === "no-subtitles" || mkvSubtitleStatus === "error")
                  }
                  title={
                    !subtitlesRequested
                      ? "Load subtitles"
                      : mkvSubtitleStatus === "loading"
                        ? mkvLoadingElapsedMs > 8000
                          ? "Subtitles are still being extracted from the video…"
                          : "Extracting subtitles…"
                        : mkvSubtitleStatus === "no-subtitles"
                          ? "No supported subtitles found in this MKV"
                          : mkvSubtitleStatus === "error"
                            ? mkvSubtitleError || "Couldn't load subtitles"
                            : activeSubtitle >= 0
                              ? "Hide subtitles"
                              : "Show subtitles"
                  }
                  aria-label={
                    !subtitlesRequested
                      ? "Load subtitles"
                      : mkvSubtitleStatus === "loading"
                        ? "Loading subtitles"
                        : activeSubtitle >= 0
                          ? "Hide subtitles"
                          : "Show subtitles"
                  }
                  aria-pressed={activeSubtitle >= 0}
                  aria-busy={subtitlesRequested && mkvSubtitleStatus === "loading"}
                  className={`relative p-1.5 rounded-full transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${activeSubtitle >= 0
                    ? "bg-white/15 text-white"
                    : "text-gray-200 hover:bg-white/20 hover:text-white"
                    } ${mkvSubtitleStatus === "loading" ? "animate-pulse" : ""}`}
                >
                  <Captions className="w-4 h-4" />
                  {mkvSubtitleStatus === "loading" && (
                    <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-yellow-400 animate-ping" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowShortcutHints((prev) => !prev)}
                  title="Keyboard shortcuts"
                  aria-label="نمایش میانبرهای صفحه‌کلید و لمس"
                  aria-expanded={showShortcutHints}
                  className={`p-1.5 rounded-full hover:bg-white/20 transition-colors text-gray-200 hover:text-white sm:block hidden ${showShortcutHints ? "bg-white/15 text-white" : ""}`}
                >
                  <Keyboard className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePip}
                  title="Picture in Picture"
                  className={`p-1.5 rounded-full hover:bg-white/20 transition-colors sm:block hidden ${isPip ? "text-red-400" : "text-gray-200 hover:text-white"
                    }`}
                >
                  <PictureInPicture2 className="w-4 h-4" />
                </button>

                <button
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-gray-200 hover:text-white"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
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
