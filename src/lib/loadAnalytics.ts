/**
 * Loads Google Analytics 4 only when a real Measurement ID is configured
 * (VITE_GA_MEASUREMENT_ID). Previously the app shipped a hardcoded
 * "G-XXXXXXXXXX" placeholder in index.html, so every conversion event fired
 * by src/lib/analytics.ts was silently discarded in production.
 */
export const loadAnalytics = () => {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) {
    if (import.meta.env.DEV) {
      console.info(
        "[analytics] VITE_GA_MEASUREMENT_ID is not set — GA4 will not load and conversion events will be no-ops."
      );
    }
    return;
  }

  for (const href of ["https://www.googletagmanager.com", "https://www.google-analytics.com"]) {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = href;
    document.head.appendChild(link);
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: any[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, {
    page_title: document.title,
    page_location: window.location.href,
    send_page_view: true,
  });
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: any[]) => void;
  }
}
