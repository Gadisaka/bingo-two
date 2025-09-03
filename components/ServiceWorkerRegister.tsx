"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        // Optionally, force update
        if (reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
      } catch (e) {
        // noop
      }
    };

    register();
  }, []);

  return null;
}
