"use client";

import { useEffect } from "react";

export default function AppLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Detect if running in webview and add class for styling
    const isWebView = /Android|iPhone|iPad|Mac/i.test(navigator.userAgent) && 
                     getComputedStyle(document.documentElement).getPropertyValue('--is-webview') !== '';
    if (isWebView || (window as any).cordova || (window as any).Capacitor) {
      document.documentElement.classList.add("is-webview");
    }

    // Disable elastic scroll for webview (iOS)
    if (navigator.userAgent.includes('WebKit')) {
      document.body.style.overscrollBehavior = 'none';
    }

    // Prevent pull-to-refresh on Android
    const preventPullRefresh = (e: TouchEvent) => {
      if ((e.touches as any).length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchmove", preventPullRefresh, { passive: false });

    // Prevent browser context menus (allow on input fields)
    const preventContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!["INPUT", "TEXTAREA"].includes(target.tagName)) {
        e.preventDefault();
      }
    };
    document.addEventListener("contextmenu", preventContextMenu);

    // Disable pull-to-refresh
    let lastY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      lastY = e.touches[0].clientY;
    };
    document.addEventListener("touchstart", handleTouchStart);

    const handleTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      if (currentY > lastY && window.scrollY === 0) {
        e.preventDefault();
      }
    };
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    // Cleanup
    return () => {
      document.removeEventListener("touchmove", preventPullRefresh);
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  return (
    <div className="flex min-h-[100dvh] w-full justify-center bg-[#eef7ff] p-0">
      <div
        className="relative z-10 min-h-[100dvh] w-full max-w-[390px] overflow-x-hidden bg-[#f5faff] md:shadow-[0_0_0_1px_rgba(0,143,239,0.08),0_18px_60px_rgba(0,16,64,0.10)]"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`
          ::-webkit-scrollbar { display: none; }
        `}</style>
        {children}
      </div>
    </div>
  );
}
