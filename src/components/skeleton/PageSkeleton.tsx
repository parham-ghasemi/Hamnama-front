import './PageSkeleton.scss';

type SkeletonKind = 'profile' | 'table' | 'cards' | 'dashboard' | 'detail' | 'join';

interface PageSkeletonProps {
  kind: SkeletonKind;
  rows?: number;
}

const Block = ({ className = '' }: { className?: string }) => (
  <span className={`page-skeleton__shimmer ${className}`} aria-hidden="true" />
);

export const PageSkeleton = ({ kind, rows = 6 }: PageSkeletonProps) => {
  if (kind === 'profile') {
    return (
      <section className="page-skeleton page-skeleton--profile" aria-busy="true" aria-label="در حال بارگذاری">
        <div className="page-skeleton__profile-head">
          <Block className="avatar" />
          <div className="stack">
            <Block className="line line--wide" />
            <Block className="line line--medium" />
          </div>
        </div>
        <div className="page-skeleton__profile-grid">
          <div className="panel"><Block className="line line--wide" /><Block className="line" /><Block className="line line--short" /><Block className="button" /></div>
          <div className="panel"><Block className="line line--medium" /><Block className="chart" /></div>
        </div>
      </section>
    );
  }

  if (kind === 'dashboard') {
    return (
      <section className="page-skeleton page-skeleton--dashboard" aria-busy="true" aria-label="در حال بارگذاری">
        <div className="heading"><Block className="line line--medium" /><Block className="line line--short" /></div>
        <div className="metrics">
          {Array.from({ length: 4 }).map((_, index) => <div className="metric" key={index}><Block className="line line--short" /><Block className="line line--wide" /></div>)}
        </div>
        <div className="wide-panel"><Block className="line line--medium" /><Block className="chart chart--large" /></div>
      </section>
    );
  }

  if (kind === 'join') {
    return (
      <section className="page-skeleton page-skeleton--join" aria-busy="true" aria-label="در حال آماده‌سازی اتاق‌ها">
        <div className="join-heading"><Block className="line line--wide" /><Block className="line line--long" /></div>
        <div className="join-grid">
          <div className="join-card"><Block className="icon" /><Block className="line line--medium" /><Block className="screen" /><Block className="line" /><Block className="button" /></div>
          <div className="join-card"><Block className="icon" /><Block className="line line--medium" /><Block className="screen" /><Block className="line" /><Block className="button" /></div>
        </div>
        <div className="join-last"><Block className="icon" /><div><Block className="line line--short" /><Block className="line line--medium" /></div><Block className="button button--small" /></div>
      </section>
    );
  }

  if (kind === 'detail') {
    return (
      <section className="page-skeleton page-skeleton--detail" aria-busy="true" aria-label="در حال بارگذاری">
        <div className="detail-heading"><Block className="line line--short" /><Block className="line line--long" /><Block className="line line--medium" /></div>
        <div className="detail-body"><Block className="line line--wide" /><Block className="line" /><Block className="line line--medium" /><Block className="text-block" /><Block className="text-block text-block--short" /></div>
      </section>
    );
  }

  return (
    <section className="page-skeleton page-skeleton--table" aria-busy="true" aria-label="در حال بارگذاری">
      <div className="table-head"><Block className="line line--medium" /><Block className="line line--short" /><Block className="button button--small" /></div>
      <div className="table-panel">
        {Array.from({ length: rows }).map((_, index) => (
          <div className="table-row" key={index}>
            <Block className="avatar avatar--small" /><Block className="line line--medium" /><Block className="line line--short" /><Block className="line line--short" /><Block className="pill" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default PageSkeleton;
