"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type IOSVideoElement = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

export default function MemoryPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [actionIcon, setActionIcon] = useState<"forward" | null>(null);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iconTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef(0);

  const showActionIcon = useCallback((type: "forward") => {
    setActionIcon(type);

    if (iconTimeoutRef.current) {
      clearTimeout(iconTimeoutRef.current);
    }

    iconTimeoutRef.current = setTimeout(() => {
      setActionIcon(null);
      iconTimeoutRef.current = null;
    }, 420);
  }, []);

  const startPlayback = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      video.currentTime = 0;
      await video.play();

      // Some browsers support fullscreen only after a user gesture.
      if (document.fullscreenElement == null) {
        try {
          await video.requestFullscreen();
        } catch {
          (video as IOSVideoElement).webkitEnterFullscreen?.();
        }
      }

      setIsPaused(false);
    } catch {}
  }, []);

  useEffect(() => {
    void startPlayback();

    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }

      if (iconTimeoutRef.current) {
        clearTimeout(iconTimeoutRef.current);
      }
    };
  }, [startPlayback]);

  const togglePausePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
        setIsPaused(false);
      } catch {}
      return;
    }

    video.pause();
    setIsPaused(true);
  }, []);

  const fastForward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const nextTime = Math.min(video.currentTime + 10, video.duration || video.currentTime + 10);
    video.currentTime = nextTime;
    showActionIcon("forward");
  }, [showActionIcon]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < 280;

    if (isDoubleTap) {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      fastForward();
      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;
    tapTimeoutRef.current = setTimeout(() => {
      void togglePausePlay();
      tapTimeoutRef.current = null;
    }, 280);
  }, [fastForward, togglePausePlay]);

  return (
    <main className="fixed inset-0 bg-black flex items-center justify-center" onPointerUp={handleTap}>
      <div className="relative w-full h-full max-w-lg max-h-screen flex items-center justify-center" style={{perspective: '1000px'}}>
        {/* Polaroid Frame */}
        <div className="bg-white p-4 pb-12 shadow-2xl relative flex flex-col" style={{aspectRatio: '3/4'}}>
          <div className="flex-1 relative min-h-0">
            <video
              ref={videoRef}
              className="w-full h-full object-cover bg-black"
              src="/csec.mp4"
              autoPlay
              playsInline
              preload="auto"
              onPlay={() => setIsPaused(false)}
              onPause={() => setIsPaused(true)}
            />

            {isPaused ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
                <div className="rounded-full border border-white/35 bg-black/30 px-5 py-3 text-2xl text-white backdrop-blur-[1px]">
                  &#10074;&#10074;
                </div>
              </div>
            ) : null}

            {actionIcon === "forward" ? (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
                <div className="rounded-full border border-white/35 bg-black/30 px-5 py-3 text-lg font-semibold text-white backdrop-blur-[1px]">
                  &#9193; 10s
                </div>
              </div>
            ) : null}
          </div>

          {/* Caption */}
          <div className="text-center pt-2">
            <p className="text-s text-gray-600 font-light italic">
              Memories that last forever
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
