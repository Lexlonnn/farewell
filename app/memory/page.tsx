"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type IOSVideoElement = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
};

export default function MemoryPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTapRef = useRef(0);

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

      setNeedsInteraction(false);
    } catch {
      setNeedsInteraction(true);
    }
  }, []);

  useEffect(() => {
    void startPlayback();

    return () => {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, [startPlayback]);

  const togglePausePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
        setNeedsInteraction(false);
      } catch {
        setNeedsInteraction(true);
      }
      return;
    }

    video.pause();
  }, []);

  const fastForward = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const nextTime = Math.min(video.currentTime + 10, video.duration || video.currentTime + 10);
    video.currentTime = nextTime;
  }, []);

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
    <main className="fixed inset-0 bg-black" onPointerUp={handleTap}>
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        src="/memory-video.mp4"
        playsInline
        preload="auto"
      />

      {needsInteraction ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 px-6 text-center text-lg font-semibold text-white">
          Tap once to play/pause. Double tap to fast forward 10s.
        </div>
      ) : null}
    </main>
  );
}
