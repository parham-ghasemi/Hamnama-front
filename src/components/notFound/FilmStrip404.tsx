/**
 * Custom 404 mark for a watch-together cinema site.
 *
 * It is a single piece of 35mm film held up to the light: sprocket holes down
 * both edges and three frames spelling 4 · 0 · 4, where the middle "0" is the
 * hub of a film reel that keeps turning. Everything is drawn with
 * `currentColor` / theme variables, so light and dark mode need no second
 * asset.
 */
const FilmStrip404 = () => (
  <svg
    className="not-found__mark__svg"
    viewBox="0 0 420 200"
    role="img"
    aria-label="۴۰۴"
    focusable="false"
  >
    <defs>
      <linearGradient id="nf-strip" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--nf-strip-top)" />
        <stop offset="100%" stopColor="var(--nf-strip-bottom)" />
      </linearGradient>

      <linearGradient id="nf-beam" x1="0.5" y1="0" x2="0.5" y2="1">
        <stop offset="0%" stopColor="var(--nf-accent)" stopOpacity="0.55" />
        <stop offset="100%" stopColor="var(--nf-accent)" stopOpacity="0" />
      </linearGradient>

      <clipPath id="nf-frame-clip">
        <rect x="34" y="44" width="352" height="112" rx="10" />
      </clipPath>
    </defs>

    {/* projector beam falling across the strip */}
    <g className="not-found__mark__beam" clipPath="url(#nf-frame-clip)">
      <polygon points="120,-40 260,-40 400,240 -20,240" fill="url(#nf-beam)" />
    </g>

    {/* the film body */}
    <rect
      x="18"
      y="24"
      width="384"
      height="152"
      rx="16"
      fill="url(#nf-strip)"
      stroke="var(--nf-edge)"
      strokeWidth="1.5"
    />

    {/* sprocket holes, top and bottom */}
    <g className="not-found__mark__sprockets" fill="var(--nf-hole)">
      {Array.from({ length: 9 }).map((_, i) => (
        <rect
          key={`t-${i}`}
          x={36 + i * 42}
          y={31}
          width="20"
          height="11"
          rx="3.5"
          style={{ animationDelay: `${i * 90}ms` }}
        />
      ))}
      {Array.from({ length: 9 }).map((_, i) => (
        <rect
          key={`b-${i}`}
          x={36 + i * 42}
          y={158}
          width="20"
          height="11"
          rx="3.5"
          style={{ animationDelay: `${i * 90 + 45}ms` }}
        />
      ))}
    </g>

    {/* three frames */}
    <g fill="var(--nf-frame)" stroke="var(--nf-edge)" strokeWidth="1.25">
      <rect x="34" y="48" width="112" height="104" rx="9" />
      <rect x="154" y="48" width="112" height="104" rx="9" />
      <rect x="274" y="48" width="112" height="104" rx="9" />
    </g>

    {/* 4 */}
    <text
      className="not-found__mark__digit"
      x="90"
      y="100"
      textAnchor="middle"
      dominantBaseline="central"
    >
      4
    </text>

    {/* 0 — a spinning reel instead of a digit */}
    <g className="not-found__mark__reel" transform="translate(210 100)">
      <circle r="37" fill="none" stroke="var(--nf-accent)" strokeWidth="9" />
      <circle r="7.5" fill="var(--nf-accent)" />
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <circle
          key={angle}
          cx={Math.cos((angle * Math.PI) / 180) * 20}
          cy={Math.sin((angle * Math.PI) / 180) * 20}
          r="5.5"
          fill="var(--nf-accent)"
          opacity="0.75"
        />
      ))}
    </g>

    {/* 4 */}
    <text
      className="not-found__mark__digit"
      x="330"
      y="100"
      textAnchor="middle"
      dominantBaseline="central"
    >
      4
    </text>
  </svg>
);

export default FilmStrip404;
