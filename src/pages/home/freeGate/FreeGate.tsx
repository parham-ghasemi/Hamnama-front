import clsx from 'clsx';
import { cloneElement, isValidElement, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { PiConfettiFill } from 'react-icons/pi';
import './FreeGate.scss';
import { FREE_OVERLAY_MESSAGE, FREE_OVERLAY_TITLE, isFree } from '../freeAccess';

type FreeGateProps = {
  children: ReactNode;
  className?: string;
  /** Matches the border radius of the wrapped card / button. */
  radius?: number;
  /** Compact styling for small targets such as buttons. */
  size?: 'card' | 'button';
  title?: string;
  message?: string;
};

type CloneableChildProps = {
  className?: string;
  children?: ReactNode;
};

const FreeGate = ({
  children,
  className,
  radius = 26,
  size = 'card',
  title = FREE_OVERLAY_TITLE,
  message = FREE_OVERLAY_MESSAGE,
}: FreeGateProps) => {
  if (!isFree) return <>{children}</>;

  const overlay = (
    <span className="free-gate__overlay" role="status">
      <span className="free-gate__overlay__icon" aria-hidden="true">
        <PiConfettiFill />
      </span>
      <span className="free-gate__overlay__title">{title}</span>
      <span className="free-gate__overlay__text">{message}</span>
      <span className="free-gate__overlay__sheen" aria-hidden="true" />
    </span>
  );

  const gatedChild = isValidElement<CloneableChildProps>(children)
    ? cloneElement(children as ReactElement<CloneableChildProps>, {
      className: clsx(children.props.className, 'free-gate__target'),
      children: (
        <>
          {children.props.children}
          {overlay}
        </>
      ),
    })
    : children;

  return (
    <div
      className={clsx('free-gate', `free-gate--${size}`, className)}
      style={{ '--free-gate-radius': `${radius}px` } as CSSProperties}
    >
      {gatedChild}

      <button
        type="button"
        className="free-gate__shield"
        aria-label={`${title} ${message}`}
        onClick={(e) => e.preventDefault()}
      />
    </div>
  );
};

export default FreeGate;
