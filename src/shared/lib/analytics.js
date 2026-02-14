const ENDPOINT = "/api/event";

export function track(event, props) {
  if (!event) return;

  const payload = { event };
  if (props && typeof props === "object") {
    payload.props = props;
  }

  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
    } else {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Analytics should never break the app
  }
}

export const Analytics = { track };
