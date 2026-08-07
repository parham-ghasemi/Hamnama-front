import clsx from "clsx";
import type { CSSProperties, ElementType, ReactNode } from "react";
import { useReveal } from "../../../hooks/useReveal";
import "./Reveal.scss";

type RevealProps = {
  children: ReactNode;
  /** Rendered element — kept configurable so semantics stay intact. */
  as?: ElementType;
  className?: string;
  /** Staggered delay in ms. Keep small; this is a supporting effect. */
  delay?: number;
  /** Entrance flavour. */
  variant?: "up" | "fade" | "scale";
};

/**
 * Gentle, one-shot entrance wrapper.
 *
 * The entrance uses a keyframe animation rather than a transition, so a
 * revealed element is free to use `transform`/`transition` for its own hover
 * states without the two fighting each other.
 */
const Reveal = ({
  children,
  as: Tag = "div",
  className,
  delay = 0,
  variant = "up",
}: RevealProps) => {
  const { ref, isVisible } = useReveal<HTMLElement>();

  return (
    <Tag
      ref={ref}
      className={clsx("reveal", `reveal--${variant}`, isVisible && "reveal--in", className)}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
