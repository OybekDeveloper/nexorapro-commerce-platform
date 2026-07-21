export const CART_ADDED_EVENT = "nexora:cart-added";
export const SHARED_PRODUCT_KEY = "nexora:shared-product";

export type CartAddedDetail = {
  productId: string;
  quantity: number;
};

type GsapInstance = (typeof import("gsap"))["gsap"];
type FlipInstance = (typeof import("gsap/Flip"))["Flip"];

const importGsap = () => import("gsap").then((module) => module.gsap);
// Imported lazily on first use so the GSAP chunk never competes with the
// critical render path (hero image LCP) during initial page load.
let gsapPromise: Promise<GsapInstance> | null = null;
let flipPromise: Promise<{ gsap: GsapInstance; Flip: FlipInstance }> | null = null;

export function loadGsap() {
  gsapPromise ??= importGsap();
  return gsapPromise;
}

export function loadFlip() {
  flipPromise ??= Promise.all([loadGsap(), import("gsap/Flip")]).then(([gsap, module]) => {
    gsap.registerPlugin(module.Flip);
    return { gsap, Flip: module.Flip };
  });
  return flipPromise;
}

export function canUseStoreMotion() {
  return typeof window !== "undefined"
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function prefersLowDataMotion() {
  if (typeof navigator === "undefined") return false;
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean };
  }).connection;
  return connection?.saveData === true;
}

export function prefersCompactMotion() {
  return typeof window !== "undefined"
    && window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
}

export async function animateAddButton(element: HTMLElement) {
  if (!canUseStoreMotion()) return;
  const gsap = await loadGsap();
  gsap.killTweensOf(element);
  gsap.timeline({ defaults: { overwrite: "auto" } })
    .to(element, { scale: 0.9, duration: 0.08, ease: "power2.in" })
    .to(element, { scale: 1.06, duration: 0.18, ease: "back.out(2.8)" })
    .to(element, { scale: 1, duration: 0.2, ease: "power2.out", clearProps: "transform,willChange" });
}
