import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { logoCandidates } from '@/core/intel';

interface BrandLogoProps {
  /** Registrable domain, e.g. "theguardian.com". */
  domain: string | null;
  /** Rendered box size in px. */
  size?: number;
  className?: string;
}

/**
 * Renders a visitor's real brand logo/favicon for their domain - the "magic"
 * confirmation that the tool recognised them. Walks an ordered candidate list
 * (Brandfetch logo CDN when a client id is configured, then public favicon
 * services) on each <img> error, and falls back to a neutral globe if every
 * source fails or no domain is set. Nothing is fetched server-side; the browser
 * loads the image directly.
 */
export const BrandLogo = ({ domain, size = 56, className }: BrandLogoProps) => {
  const candidates = domain ? logoCandidates(domain, Math.max(64, size * 2)) : [];
  const [idx, setIdx] = useState(0);

  // Reset to the first candidate whenever the domain changes.
  useEffect(() => {
    setIdx(0);
  }, [domain]);

  const src = candidates[idx];

  return (
    <div
      className={[
        'flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white/[0.04]',
        className ?? '',
      ].join(' ')}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          key={src}
          src={src}
          alt={domain ? `${domain} logo` : 'logo'}
          width={size}
          height={size}
          loading="lazy"
          className="h-full w-full object-contain p-1.5"
          onError={() => setIdx((i) => i + 1)}
        />
      ) : (
        <Globe className="text-muted-foreground" style={{ width: size * 0.5, height: size * 0.5 }} />
      )}
    </div>
  );
};
