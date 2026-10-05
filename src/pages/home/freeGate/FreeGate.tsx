import clsx from 'clsx';
import {
  cloneElement,
  isValidElement,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { PiConfettiFill } from 'react-icons/pi';
import { billingApi } from '../../../apiCalls/billingApi';
import { FREE_OVERLAY_MESSAGE, FREE_OVERLAY_TITLE } from '../freeAccess';
import './FreeGate.scss';

type FreeGateProps = {
  children: ReactNode;
  className?: string;
  radius?: number;
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
  title,
  message,
}: FreeGateProps) => {
  const { data } = useQuery({
    queryKey: ['billing-public'],
    queryFn: () => billingApi.getPublicConfig().then((response) => response.data),
    staleTime: 30_000,
  });

  const isFree = data ? !data.is_paid : true;

  if (!isFree) {
    return <>{children}</>;
  }

  const overlayTitle = title ?? data?.free_overlay.title ?? FREE_OVERLAY_TITLE;
  const overlayMessage =
    message ?? data?.free_overlay.message ?? FREE_OVERLAY_MESSAGE;

  const overlay = (
    <span className="free-gate__overlay" role="status">
      <span className="free-gate__overlay__icon" aria-hidden="true">
        <PiConfettiFill />
      </span>
      <span className="free-gate__overlay__title">{overlayTitle}</span>
      <span className="free-gate__overlay__text">{overlayMessage}</span>
      <span className="free-gate__overlay__sheen" aria-hidden="true" />
    </span>
  );

  const gatedChild = isValidElement<CloneableChildProps>(children)
    ? cloneElement(
        children as ReactElement<CloneableChildProps>,
        {
          className: clsx(children.props.className, 'free-gate__target'),
          children: (
            <>
              {children.props.children}
              {overlay}
            </>
          ),
        },
      )
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
        aria-label={`${overlayTitle} ${overlayMessage}`}
        onClick={(event) => event.preventDefault()}
      />
    </div>
  );
};

export default FreeGate;
