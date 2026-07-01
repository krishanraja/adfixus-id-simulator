import { Button } from '@/components/ui/button';
import { CalendarCheck } from 'lucide-react';
import { AdfixusLogo } from '@/components/brand/AdfixusLogo';
import { MEETING_BOOKING_URL } from '@/config';

export const AppHeader = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <a
          href="https://www.adfixus.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center transition-opacity hover:opacity-90"
        >
          <AdfixusLogo height={26} />
        </a>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs font-medium uppercase tracking-widest text-muted-foreground sm:inline">
            ID Durability Simulator
          </span>
          <Button asChild size="sm" className="gap-2">
            <a href={MEETING_BOOKING_URL} target="_blank" rel="noreferrer">
              <CalendarCheck className="h-4 w-4" />
              Book a meeting
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
};
