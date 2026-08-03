import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import gsap from "gsap";

interface Props {
  emoji: string;
  x: number; // Starting X coordinate (center of the button)
  y: number; // Starting Y coordinate (center of the button)
  onFinish: () => void;
}

const AnimatedParticle = ({ emoji, x, y, onFinish }: Props) => {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!container.current) return;

    // Randomize the ending properties
    const spreadDistance = 300; // How far they can travel in pixels
    const endX = x + (Math.random() - 0.5) * spreadDistance;
    const endY = y + (Math.random() - 0.5) * spreadDistance;
    const endRotation = (Math.random() - 0.5) * 360; // Random rotation between -180 and 180 deg
    const endScale = Math.random() * 1.8 + 0.8; // Random size between 0.8x and 2.6x
    const randomDuration = Math.random() * 1.8 + 0.8; // Random speed between 0.8s and 2.6s

    gsap.fromTo(
      container.current,
      {
        x: x,
        y: y,
        opacity: 1,
        scale: 0.1, // Start tiny
      },
      {
        x: endX,
        y: endY,
        rotation: endRotation,
        scale: endScale,
        opacity: 0, // Fade out by the end
        duration: randomDuration,
        ease: "power4.out", // Explosive start, slow down at the end
        onComplete: onFinish,
      }
    );
  }, { scope: container });

  return (
    <div
      ref={container}
      className="fixed top-0 left-0 pointer-events-none text-2xl select-none z-50"
      style={{ marginLeft: "-1rem", marginTop: "-1rem" }} // Centers the emoji exactly on the mouse coordinates
    >
      {emoji}
    </div>
  );
};

export default AnimatedParticle;