import { useEffect, useMemo, useState } from "react";

type Props = {
  emoji: string;
  x: number;
  y: number;
  onFinish: () => void;
};

const AnimatedParticle = ({ emoji, x, y, onFinish }: Props) => {
  const [mounted, setMounted] = useState(false);

  const drift = useMemo(
    () => ({
      dx: (Math.random() - 0.5) * 160,
      dy: -(120 + Math.random() * 200),
      rotate: (Math.random() - 0.5) * 90,
      scale: 0.8 + Math.random() * 0.8,
      duration: 900 + Math.random() * 700,
    }),
    [],
  );

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    const timer = window.setTimeout(onFinish, drift.duration);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [drift.duration, onFinish]);

  return (
    <span
      style={{
        position: "fixed",
        left: x,
        top: y,
        fontSize: 26,
        lineHeight: 1,
        pointerEvents: "none",
        transform: mounted
          ? `translate(${drift.dx}px, ${drift.dy}px) scale(${drift.scale}) rotate(${drift.rotate}deg)`
          : "translate(0, 0) scale(0.4)",
        opacity: mounted ? 0 : 1,
        transition: `transform ${drift.duration}ms cubic-bezier(0.22, 1, 0.36, 1), opacity ${drift.duration}ms ease-out`,
      }}
      aria-hidden
    >
      {emoji}
    </span>
  );
};

export default AnimatedParticle;
