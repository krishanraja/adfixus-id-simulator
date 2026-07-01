import React from 'react';
import wordmarkUrl from '@/assets/adfixus-wordmark.svg';

interface AdfixusLogoProps {
  className?: string;
  /** Height in px. Width scales automatically. */
  height?: number;
  /** Full wordmark (glyph + "AdFixus") when true; the glyph mark alone when false. */
  showWordmark?: boolean;
}

/**
 * The real AdFixus brand mark.
 *
 * The full wordmark is the official brand SVG (bundled from the AdFixus brand
 * assets): the angular arrow glyph in brand cyan with the white "AdFixus"
 * wordmark, which sits correctly on the dark canvas. When `showWordmark` is
 * false we render just the glyph, inline, so it can be tinted/used as a compact
 * mark. The brand-cyan gradient matches the design-system `--primary` token.
 */
export const AdfixusLogo: React.FC<AdfixusLogoProps> = ({
  className,
  height = 28,
  showWordmark = true,
}) => {
  if (showWordmark) {
    return (
      <img
        src={wordmarkUrl}
        alt="AdFixus"
        height={height}
        style={{ height, width: 'auto', display: 'block' }}
        className={className}
      />
    );
  }

  // Glyph-only mark (the three facets of the AdFixus arrow), in brand cyan.
  return (
    <svg
      height={height}
      viewBox="0 0 118 145"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
      role="img"
      aria-label="AdFixus"
    >
      <path
        d="M.3 139.52c-1.37 3.04 2.24 5.9 4.88 3.86l45.72-35.24c1.27-.98 1.43-2.84.34-4.02L27.78 78.61.3 139.52Z"
        fill="#07c0f8"
      />
      <path
        d="M98.17 71.8 68.32 1.95c-1.1-2.57-4.73-2.61-5.88-.06L27.8 78.62l35.69 17.79c1.02.51 2.23.39 3.13-.31l31.54-24.31Z"
        fill="#0c9ece"
      />
      <path
        d="M117.14 116.19 98.17 71.8 78.6 100.26a2.687 2.687 0 0 0 1.04 3.94l33.15 16.13c2.67 1.3 5.52-1.41 4.35-4.15Z"
        fill="#107da5"
      />
    </svg>
  );
};
