// Set by bin/diffly.js when it serves a page with a diff already loaded
// (see injectDiffIntoHtml in bin/lib.js). Consumed once on mount in App.tsx.
export {};

declare global {
  interface Window {
    __DIFFLY_PRELOADED_DIFF__?: string;
  }
}
