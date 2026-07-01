import React from 'react';

interface AdfixusLogoProps {
  className?: string;
  /** Height in px. Width scales automatically. */
  height?: number;
  showWordmark?: boolean;
}

/**
 * AdFixus brand mark, rendered as an inline SVG so it is always crisp and
 * always visible on the dark background (the shipped PNG wordmark is dark navy
 * and disappears on black). The arrow mark uses the brand cyan; the wordmark is
 * white. No external asset required.
 */
export const AdfixusLogo: React.FC<AdfixusLogoProps> = ({
  className,
  height = 28,
  showWordmark = true,
}) => {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: showWordmark ? 10 : 0 }}
      aria-label="AdFixus"
      role="img"
    >
      {/* Arrow / chevron mark */}
      <svg
        height={height}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="afx-mark" x1="24" y1="4" x2="8" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(195 95% 60%)" />
            <stop offset="1" stopColor="hsl(195 95% 45%)" />
          </linearGradient>
        </defs>
        {/* Upper triangle */}
        <path d="M24 4 L40 40 L24 30 L8 40 Z" fill="url(#afx-mark)" />
        {/* Lower-left accent */}
        <path d="M8 40 L24 30 L16 46 Z" fill="hsl(195 95% 68%)" opacity="0.9" />
      </svg>

      {showWordmark && (
        <span
          style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: height * 0.72,
            letterSpacing: '-0.01em',
            lineHeight: 1,
            color: '#ffffff',
            whiteSpace: 'nowrap',
          }}
        >
          Ad<span style={{ color: 'hsl(195 95% 55%)' }}>Fixus</span>
        </span>
      )}
    </span>
  );
};
