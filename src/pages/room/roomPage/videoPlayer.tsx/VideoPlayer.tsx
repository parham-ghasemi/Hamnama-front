import React, { useState, useRef, useEffect, useCallback } from "react";
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
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const lastTouchRef = useRef<{ time: number; x: number } | null>(null);

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
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;

      if (target?.closest('#room-chat-input, [data-video-link-input]')) {
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
            <Play className="w-8 h-8 fill-white text-white max-[410px]:w-4 max-[410px]:h-4 " />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {nextEpisode && duration > 0 && time >= Math.max(0, duration - 20) && (
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
                className="absolute inset-0 w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-red-500 hover:h-2 transition-all duration-150 focus:outline-none"
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
                  className="p-2 rounded-full bg-white/10 hover:bg-white/25 transition-all text-white backdrop-blur-sm"
                >
                  {playing ? (
                    <Pause className="w-5 h-5 fill-white max-[420px]:w-3 max-[420px]:h-3" />
                  ) : (
                    <Play className="w-5 h-5 fill-white max-[420px]:w-3 max-[420px]:h-3" />
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
                  onClick={() => setShowShortcutHints((prev) => !prev)}
                  title="Keyboard shortcuts"
                  aria-label="نمایش میانبرهای صفحه‌کلید و لمس"
                  aria-expanded={showShortcutHints}
                  className={`p-1.5 rounded-full hover:bg-white/20 transition-colors text-gray-200 hover:text-white ${showShortcutHints ? "bg-white/15 text-white" : ""}`}
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