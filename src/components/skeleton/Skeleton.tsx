import type { CSSProperties, HTMLAttributes } from 'react';
import './Skeleton.scss';

export type SkeletonVariant = 'text' | 'circle' | 'rect' | 'pill';

export interface SkeletonProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: SkeletonVariant;
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  radius?: CSSProperties['borderRadius'];
}

/** A small, layout-neutral loading primitive meant to live where real content will appear. */
const Skeleton = ({
  variant = 'text',
  width,
  height,
  radius,
  className = '',
  style,
  ...props
}: SkeletonProps) => (
  <span
    aria-hidden="true"
    className={`skeleton ${className}`.trim()}
    data-variant={variant}
    style={{ width, height, borderRadius: radius, ...style }}
    {...props}
  />
);

export default Skeleton;
