"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import { useStore } from "@/components/storefront/store-provider";
import {
  canUseStoreMotion,
  CART_ADDED_EVENT,
  loadFlip,
  loadGsap,
  prefersCompactMotion,
  prefersLowDataMotion,
  SHARED_PRODUCT_KEY,
  type CartAddedDetail,
} from "@/lib/storefront-motion";

type SharedProductTransfer = {
  slug: string;
  src: string;
  timestamp: number;
  borderRadius: string;
  rect: { left: number; top: number; width: number; height: number };
};

type ToastState = { productId: string; nonce: number } | null;

function rememberSharedProduct(anchor: HTMLAnchorElement) {
  const slug = anchor.dataset.sharedProduct;
  const frame = anchor.querySelector<HTMLElement>("[data-shared-product-frame]") ?? anchor;
  const image = frame.querySelector<HTMLImageElement>("img");
  if (!slug || !image) return null;

  const rect = frame.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;

  const transfer: SharedProductTransfer = {
    slug,
    src: image.currentSrc || image.src,
    timestamp: Date.now(),
    borderRadius: window.getComputedStyle(frame).borderRadius,
    rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
  };
  window.sessionStorage.setItem(SHARED_PRODUCT_KEY, JSON.stringify(transfer));
  return transfer;
}

function createImmediateSharedOverlay(transfer: SharedProductTransfer) {
  document.querySelector<HTMLImageElement>("[data-shared-product-overlay]")?.remove();

  const overlay = document.createElement("img");
  overlay.src = transfer.src;
  overlay.alt = "";
  overlay.dataset.sharedProductOverlay = "true";
  Object.assign(overlay.style, {
    position: "fixed",
    left: `${transfer.rect.left}px`,
    top: `${transfer.rect.top}px`,
    width: `${transfer.rect.width}px`,
    height: `${transfer.rect.height}px`,
    objectFit: "cover",
    pointerEvents: "none",
    borderRadius: transfer.borderRadius,
    boxSizing: "border-box",
    zIndex: "90",
    willChange: "transform",
  });
  document.body.appendChild(overlay);

  window.setTimeout(() => {
    if (overlay.isConnected && !document.querySelector(`[data-shared-product-target="${CSS.escape(transfer.slug)}"]`)) {
      overlay.remove();
    }
  }, 1_200);
}

function readSharedProduct(pathname: string) {
  const raw = window.sessionStorage.getItem(SHARED_PRODUCT_KEY);
  window.sessionStorage.removeItem(SHARED_PRODUCT_KEY);
  if (!raw) return null;

  try {
    const transfer = JSON.parse(raw) as SharedProductTransfer;
    const slug = pathname.startsWith("/product/") ? decodeURIComponent(pathname.slice(9)) : "";
    return transfer.slug === slug && Date.now() - transfer.timestamp < 3_000 ? transfer : null;
  } catch {
    return null;
  }
}

export function StorefrontMotionShell({ children }: { children: React.ReactNode }) {
  const { products } = useStore();
  const pathname = usePathname();
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  const navigatingRef = useRef(false);
  const firstRenderRef = useRef(true);
  const toastTimerRef = useRef<number | null>(null);
  const [toast, setToast] = useState<ToastState>(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || pathname.startsWith("/admin") || !canUseStoreMotion()) return;

    const transfer = readSharedProduct(pathname);
    const sharedTarget = transfer
      ? wrapper.querySelector<HTMLElement>(`[data-shared-product-target="${CSS.escape(transfer.slug)}"]`)
      : null;
    const sharedImage = sharedTarget?.querySelector<HTMLImageElement>("img") ?? null;
    if (!transfer || !sharedTarget || !sharedImage) return;

    const targetRect = sharedTarget.getBoundingClientRect();
    if (!targetRect.width || !targetRect.height) return;

    let cancelled = false;
    const compact = prefersCompactMotion();
    const existingOverlay = document.querySelector<HTMLImageElement>("[data-shared-product-overlay]");
    const overlay = existingOverlay ?? document.createElement("img");
    let failSafeTimer: number | null = null;

    const finish = () => {
      if (failSafeTimer) window.clearTimeout(failSafeTimer);
      sharedImage.style.removeProperty("opacity");
      overlay.remove();
    };

    sharedImage.style.opacity = "0";
    overlay.src = transfer.src;
    overlay.alt = "";
    overlay.dataset.sharedProductOverlay = "true";
    Object.assign(overlay.style, {
      position: "fixed",
      left: existingOverlay ? overlay.style.left : `${transfer.rect.left}px`,
      top: existingOverlay ? overlay.style.top : `${transfer.rect.top}px`,
      width: existingOverlay ? overlay.style.width : `${transfer.rect.width}px`,
      height: existingOverlay ? overlay.style.height : `${transfer.rect.height}px`,
      objectFit: "cover",
      pointerEvents: "none",
      borderRadius: transfer.borderRadius || "1.5rem",
      boxSizing: "border-box",
      zIndex: "90",
      contain: "layout paint",
      willChange: "transform,width,height,border-radius",
    });
    if (!existingOverlay) document.body.appendChild(overlay);
    failSafeTimer = window.setTimeout(finish, 1_000);

    void loadFlip().then(({ gsap, Flip }) => {
      if (cancelled) return;
      gsap.killTweensOf(overlay);
      Flip.fit(overlay, sharedTarget, {
        scale: false,
        simple: true,
        duration: compact ? 0.42 : 0.5,
        ease: "power4.out",
        borderRadius: window.getComputedStyle(sharedTarget).borderRadius,
        overwrite: true,
        onComplete: finish,
      });
    }).catch(finish);

    return () => {
      cancelled = true;
      finish();
    };
  }, [pathname]);

  useEffect(() => {
    navigatingRef.current = false;
    const wrapper = wrapperRef.current;
    const page = wrapper?.querySelector<HTMLElement>("main#main-content");
    if (!wrapper || !page || pathname.startsWith("/admin") || !canUseStoreMotion()) return;

    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    const animatedTargets = new Set<HTMLElement>();

    // The first paint is already server-rendered and visible. Running entrance
    // animations on initial load only delays the LCP (hero image), so the page
    // and hero flourishes are reserved for client-side navigations.
    const firstRender = firstRenderRef.current;
    firstRenderRef.current = false;

    void loadGsap().then((gsap) => {
      if (cancelled) return;
      const compact = prefersCompactMotion();

      if (!firstRender) {
        gsap.killTweensOf(page);
        gsap.fromTo(page, {
          autoAlpha: 0.92,
          x: compact ? 10 : 16,
        }, {
          autoAlpha: 1,
          x: 0,
          duration: compact ? 0.26 : 0.32,
          ease: "power3.out",
          clearProps: "transform,opacity,visibility,willChange",
        });

        const hero = page.querySelector<HTMLElement>("[data-motion-hero]");
        if (hero) {
          const heroItems = Array.from(hero.querySelectorAll<HTMLElement>("[data-motion-hero-item]"));
          const heroMedia = hero.querySelector<HTMLElement>("[data-motion-hero-media]");
          animatedTargets.add(hero);
          heroItems.forEach((item) => animatedTargets.add(item));
          if (heroMedia) animatedTargets.add(heroMedia);

          gsap.fromTo(heroItems, { autoAlpha: 0, y: compact ? 10 : 14 }, {
            autoAlpha: 1,
            y: 0,
            duration: compact ? 0.32 : 0.4,
            stagger: compact ? 0.025 : 0.04,
            ease: "power3.out",
            clearProps: "transform,opacity,visibility,willChange",
          });
          if (heroMedia) {
            gsap.fromTo(heroMedia, { y: compact ? 10 : 14, scale: 1.012 }, {
              y: 0,
              scale: 1,
              duration: compact ? 0.38 : 0.46,
              delay: 0.025,
              ease: "power3.out",
              clearProps: "transform,willChange",
            });
          }
        }
      }

      if (prefersLowDataMotion()) return;

      const revealTargets = Array.from(page.querySelectorAll<HTMLElement>("[data-motion-reveal]"))
        .filter((target) => !target.closest("[data-motion-hero]") && !target.querySelector("img"));
      revealTargets.forEach((target) => animatedTargets.add(target));

      const reveal = (target: HTMLElement, index = 0) => {
        if (target.dataset.motionPlayed === "true") return;
        target.dataset.motionPlayed = "true";
        gsap.fromTo(target, { autoAlpha: 0, y: compact ? 10 : 16 }, {
          autoAlpha: 1,
          y: 0,
          duration: compact ? 0.3 : 0.38,
          delay: Math.min(index % 3, 2) * (compact ? 0.018 : 0.03),
          ease: "power3.out",
          clearProps: "transform,opacity,visibility,willChange",
        });
      };

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
          if (!entry.isIntersecting) return;
          const target = entry.target as HTMLElement;
          reveal(target, index);
          observer?.unobserve(target);
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

      revealTargets.forEach((target) => observer?.observe(target));
    }).catch(() => {
      // Motion is progressive enhancement; navigation and content remain usable.
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
      void loadGsap().then((gsap) => {
        gsap.killTweensOf(page);
        animatedTargets.forEach((target) => gsap.killTweensOf(target));
      });
    };
  }, [pathname]);

  useEffect(() => {
    navigatingRef.current = false;

    const flipWarmTimer = window.setTimeout(() => {
      if (document.querySelector("[data-shared-product]")) void loadFlip().catch(() => undefined);
    }, 250);

    const warmDestination = (event: PointerEvent) => {
      const target = event.target as Element | null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (anchor.dataset.sharedProduct) void loadFlip().catch(() => undefined);
      router.prefetch(`${url.pathname}${url.search}`);
    };

    const onNavigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as Element | null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download") || anchor.dataset.noPageTransition === "true") return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const sameDocument = url.pathname === window.location.pathname && url.search === window.location.search;
      if (sameDocument) return;
      if (!canUseStoreMotion() || navigatingRef.current) return;

      const sharedTransfer = rememberSharedProduct(anchor);
      if (sharedTransfer) createImmediateSharedOverlay(sharedTransfer);
      event.preventDefault();
      navigatingRef.current = true;

      const destination = `${url.pathname}${url.search}${url.hash}`;
      const page = wrapperRef.current?.querySelector<HTMLElement>("main#main-content");
      router.push(destination);
      if (!page) {
        return;
      }

      void loadGsap().then((gsap) => {
        gsap.killTweensOf(page);
        gsap.to(page, {
          autoAlpha: 0.94,
          x: prefersCompactMotion() ? -8 : -12,
          duration: prefersCompactMotion() ? 0.1 : 0.14,
          ease: "power2.in",
          overwrite: true,
        });
      }).catch(() => undefined);
    };

    document.addEventListener("pointerdown", warmDestination, true);
    document.addEventListener("click", onNavigate, true);
    return () => {
      window.clearTimeout(flipWarmTimer);
      document.removeEventListener("pointerdown", warmDestination, true);
      document.removeEventListener("click", onNavigate, true);
    };
  }, [pathname, router]);

  useEffect(() => {
    const onCartAdded = (event: Event) => {
      const detail = (event as CustomEvent<CartAddedDetail>).detail;
      if (!detail?.productId) return;
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      setToast({ productId: detail.productId, nonce: Date.now() });
      toastTimerRef.current = window.setTimeout(() => setToast(null), 2_800);
    };

    window.addEventListener(CART_ADDED_EVENT, onCartAdded);
    return () => {
      window.removeEventListener(CART_ADDED_EVENT, onCartAdded);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const element = toastRef.current;
    if (!toast || !element || !canUseStoreMotion()) return;
    void loadGsap().then((gsap) => {
      gsap.killTweensOf(element);
      gsap.fromTo(element, { autoAlpha: 0, y: prefersCompactMotion() ? 10 : 16, scale: 0.97 }, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: prefersCompactMotion() ? 0.26 : 0.34,
        ease: "back.out(1.8)",
        clearProps: "transform,opacity,visibility,willChange",
      });
    });
  }, [toast]);

  const toastProduct = toast
    ? products.find((product) => product.id === toast.productId)
    : null;

  return (
    <div ref={wrapperRef} className="contents">
      {children}
      {toastProduct && (
        <div ref={toastRef} role="status" aria-live="polite" className="fixed inset-x-4 bottom-4 z-[85] mx-auto max-w-sm rounded-2xl border border-brand/20 bg-white p-3 shadow-[0_18px_55px_rgba(0,0,0,0.18)] sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-24 sm:mx-0 sm:w-[360px] sm:bg-white/95 sm:backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
              <Image src={toastProduct.image} alt="" fill sizes="56px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand"><Check className="size-3.5" />Savatga qo‘shildi</p>
              <p className="mt-1 truncate text-sm font-semibold text-[#1d1d1f]">{toastProduct.name}</p>
            </div>
            <Link href="/cart" className="inline-flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-brand text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2" aria-label="Savatni ochish">
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
