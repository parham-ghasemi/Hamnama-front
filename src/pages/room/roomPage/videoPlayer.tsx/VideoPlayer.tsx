import React, { useState, useRef, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  /** Static display quality passed from parent (e.g., "1080p HD", "4K", "720p") */
  quality?: string;
  autoPlay?: boolean;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  poster,
  quality = '1080p',
  autoPlay = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideControlsTimeoutRef = useRef<number | null>(null);

  // States
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);

  // Format seconds to MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const pad = (num: number) => num.toString().padStart(2, '0');

    if (h > 0) {
      return `${h}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  // Toggle Play / Pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Rewind / Fast Forward
  const handleSeekBy = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(
      Math.max(videoRef.current.currentTime + seconds, 0),
      duration
    );
  };

  // Scrub bar change
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      setCurrentTime(targetTime);
    }
  };

  // Volume slider change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  // Toggle Mute
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

  // Toggle Fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch((err) => console.error(err));
    } else {
      await document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  // Toggle Picture in Picture
  const togglePip = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  // Auto-hide controls when idle
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (isPlaying) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  };

  // Listeners for fullscreen and PiP changes
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    const handlePipChange = () => {
      setIsPip(document.pictureInPictureElement === videoRef.current);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    const videoElem = videoRef.current;
    if (videoElem) {
      videoElem.addEventListener('enterpictureinpicture', handlePipChange);
      videoElem.addEventListener('leavepictureinpicture', handlePipChange);
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      if (videoElem) {
        videoElem.removeEventListener('enterpictureinpicture', handlePipChange);
        videoElem.removeEventListener('leavepictureinpicture', handlePipChange);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      /* Force dir="ltr" on the root player container to maintain standard player controls layout and scrub direction even inside RTL parent containers */
      dir="ltr"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative group overflow-hidden bg-black rounded-2xl shadow-2xl select-none font-sans text-white h-full w-full ${className}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        onClick={togglePlay}
        onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
        onLoadedMetadata={() => videoRef.current && setDuration(videoRef.current.duration)}
        onEnded={() => setIsPlaying(false)}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Center Play Overlay Icon on Click/Pause */}
      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform pointer-events-auto z-10"
          >
            <Play className="w-8 h-8 fill-white text-white translate-x-0.5" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Bar Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-x-0 bottom-0 z-20 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-3"
          >
            {/* Timeline Scrubber */}
            <div className="relative flex items-center group/scrubber w-full h-3 cursor-pointer">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step="0.1"
                value={currentTime}
                onChange={handleScrub}
                className="absolute inset-0 w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-red-500 hover:h-2 transition-all duration-150 focus:outline-none"
              />
            </div>

            {/* Controls Grid Layout */}
            <div className="flex items-center justify-between text-sm">
              {/* Bottom Left Controls: Rewind, Play/Pause, Fast-Forward, Volume */}
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
                  title={isPlaying ? 'Pause' : 'Play'}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/25 transition-all text-white backdrop-blur-sm"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-white" />
                  ) : (
                    <Play className="w-5 h-5 fill-white translate-x-0.5" />
                  )}
                </button>

                <button
                  onClick={() => handleSeekBy(10)}
                  title="Fast Forward 10s"
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-gray-200 hover:text-white"
                >
                  <RotateCw className="w-4 h-4" />
                </button>

                {/* Volume Controls */}
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

              {/* Bottom Middle: Timer */}
              <div className="text-xs tracking-wider text-gray-300 font-mono bg-black/30 px-2.5 py-1 rounded-md border border-white/5 backdrop-blur-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>

              {/* Bottom Right Controls: Quality Badge, Picture-in-Picture, Fullscreen */}
              <div className="flex items-center gap-3">
                {/* Static Quality Tag */}
                <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase bg-white/10 text-gray-200 border border-white/15 rounded backdrop-blur-sm">
                  {quality}
                </span>

                {/* Picture in Picture */}
                <button
                  onClick={togglePip}
                  title="Picture in Picture"
                  className={`p-1.5 rounded-full hover:bg-white/20 transition-colors ${isPip ? 'text-red-400' : 'text-gray-200 hover:text-white'
                    }`}
                >
                  <PictureInPicture2 className="w-4 h-4" />
                </button>

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-gray-200 hover:text-white"
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4" />
                  ) : (
                    <Maximize className="w-4 h-4" />
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