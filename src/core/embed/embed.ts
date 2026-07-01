// AdFixus core — iframe embedding module.
//
// Makes any AdFixus tool safely embeddable in adfixus.com (or any parent page)
// by reporting its content height to the parent via postMessage, so the parent
// iframe can resize to fit with no inner scrollbar. Ported from the
// id-simulator's proven implementation and parameterized.
//
// Usage (call once, e.g. from main.tsx):
//   import { initAdfixusEmbed } from '@/core/embed/embed';
//   initAdfixusEmbed({ appName: 'AdFixus-ID-Simulator' });
//
// Parent-page snippet is documented in docs/ADFIXUS_CORE_SPEC.md.

export interface EmbedOptions {
  /** Origin allowed to receive/height-request messages. Default: adfixus.com. */
  parentOrigin?: string;
  /** Identifies this app in postMessage payloads and logs. */
  appName?: string;
  /** Verbose console logging. Default: false. */
  debug?: boolean;
  /** Safety cap so runaway layouts can't request an infinite iframe height. */
  maxHeight?: number;
}

export function initAdfixusEmbed(options: EmbedOptions = {}): void {
  if (typeof window === 'undefined') return;

  const PARENT_ORIGIN = options.parentOrigin ?? 'https://www.adfixus.com';
  const APP_NAME = options.appName ?? 'AdFixus-Tool';
  const DEBUG = options.debug ?? false;
  const MAX_HEIGHT = options.maxHeight ?? 5000;

  const log = (...args: unknown[]) => {
    if (DEBUG) console.log(`[${APP_NAME}:iframe]`, ...args);
  };

  let lastSentHeight = 0;

  const getDocHeight = (): number => {
    const root = document.getElementById('root');
    const contentHeight = root ? root.scrollHeight : document.body.scrollHeight;
    return Math.min(contentHeight, MAX_HEIGHT);
  };

  const sendHeight = (trigger = 'unknown'): void => {
    const isInIframe = window.parent && window.parent !== window;
    if (!isInIframe) return;

    const height = Math.round(getDocHeight());
    // Only send if the change is meaningful (>10px) — prevents feedback loops.
    if (Math.abs(height - lastSentHeight) < 10) return;
    lastSentHeight = height;

    try {
      window.parent.postMessage(
        { type: 'setHeight', height, source: APP_NAME, trigger },
        PARENT_ORIGIN,
      );
      log(`height sent: ${height}px (${trigger})`);
    } catch (err) {
      log('failed to send height', err);
    }
  };

  window.addEventListener('load', () => sendHeight('load'));

  let resizeTimeout: ReturnType<typeof setTimeout>;
  try {
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => sendHeight('resize'), 100);
    });
    ro.observe(document.documentElement);
    ro.observe(document.body);
  } catch {
    setInterval(() => sendHeight('interval'), 1000);
  }

  window.addEventListener('message', (ev: MessageEvent) => {
    if (ev.origin !== PARENT_ORIGIN && ev.origin !== window.location.origin) return;
    const data = ev.data as { type?: string } | null;
    if (data?.type === 'requestHeight') sendHeight('parent-request');
    if (data?.type === 'ping') {
      try {
        window.parent.postMessage({ type: 'pong', source: APP_NAME }, PARENT_ORIGIN);
      } catch {
        /* ignore */
      }
    }
  });

  // Delayed sends catch late-loading content (fonts, charts, images).
  setTimeout(() => sendHeight('delayed-500'), 500);
  setTimeout(() => sendHeight('delayed-1500'), 1500);

  log('embed initialised', { parentOrigin: PARENT_ORIGIN });
}
