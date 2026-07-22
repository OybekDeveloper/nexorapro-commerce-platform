"use client";

import { ExternalLink, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useStore, type StoreLocale } from "@/components/storefront/store-provider";
import type { StoreProductVideo } from "@/lib/storefront-data";
import { canUseStoreMotion, loadGsap, prefersCompactMotion, prefersLowDataMotion } from "@/lib/storefront-motion";

const copy = {
  UZ: { video: "videosi", media: "Rasmiy media · portfolio namoyishi", pause: "Videoni pauza qilish", play: "Videoni ijro etish", mute: "Video ovozini o‘chirish", unmute: "Video ovozini yoqish", source: "Manba" },
  RU: { video: "видео", media: "Официальные медиа · демонстрация портфолио", pause: "Приостановить видео", play: "Воспроизвести видео", mute: "Выключить звук", unmute: "Включить звук", source: "Источник" },
  EN: { video: "video", media: "Official media · portfolio showcase", pause: "Pause video", play: "Play video", mute: "Mute video", unmute: "Unmute video", source: "Source" },
} satisfies Record<StoreLocale, Record<string, string>>;

export function ProductVideoShowcase({ media, productName }: { media: StoreProductVideo; productName: string }) {
  const { locale } = useStore();
  const labels = copy[locale];
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);
  const hasAnimatedRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const section = sectionRef.current;
    const video = videoRef.current;
    if (!section || !video) return;

    const stage = section.querySelector<HTMLElement>("[data-video-stage]");
    const copy = section.querySelector<HTMLElement>("[data-video-copy]");
    const compact = prefersCompactMotion();
    const allowAutoMotion = canUseStoreMotion() && !prefersLowDataMotion();

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;

      if (!entry.isIntersecting) {
        video.pause();
        return;
      }

      if (allowAutoMotion && !hasAnimatedRef.current && stage) {
        hasAnimatedRef.current = true;
        void loadGsap().then((gsap) => {
          gsap.fromTo(stage, {
            autoAlpha: 0.68,
            y: compact ? 18 : 30,
            scale: compact ? 0.985 : 0.975,
          }, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: compact ? 0.58 : 0.72,
            ease: "power4.out",
            clearProps: "transform,opacity,visibility,willChange",
          });
          if (copy) {
            gsap.fromTo(copy, { autoAlpha: 0, y: 14 }, {
              autoAlpha: 1,
              y: 0,
              duration: compact ? 0.42 : 0.54,
              delay: 0.06,
              ease: "power3.out",
              clearProps: "transform,opacity,visibility,willChange",
            });
          }
        }).catch(() => undefined);
      }

      if (allowAutoMotion && !compact && !userPausedRef.current) {
        void video.play().catch(() => undefined);
      }
    }, { threshold: 0.45, rootMargin: "0px 0px -5% 0px" });

    observer.observe(section);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [media.src]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      userPausedRef.current = false;
      void video.play().catch(() => undefined);
    } else {
      userPausedRef.current = true;
      video.pause();
    }
  };

  const toggleMuted = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  return (
    <section ref={sectionRef} aria-label={`${productName} ${labels.video}`} className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
      <div data-video-stage className="relative overflow-hidden rounded-[2rem] bg-[#07110f] text-white shadow-[0_30px_90px_rgba(7,17,15,0.22)]">
        <div className="relative aspect-video min-h-[300px] sm:min-h-0">
          <video
            ref={videoRef}
            src={media.src}
            poster={media.poster}
            muted
            loop
            playsInline
            preload="none"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            className="absolute inset-0 size-full object-cover"
            aria-label={`${productName}: ${media.title}`}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-black/15" />

          <div data-video-copy className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-8 lg:p-10">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#72e4ce]">{media.eyebrow}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">{media.title}</h2>
              <p className="mt-3 text-sm text-white/65">{labels.media}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={togglePlayback} className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label={playing ? labels.pause : labels.play}>
                {playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
              </button>
              <button type="button" onClick={toggleMuted} className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label={muted ? labels.unmute : labels.mute}>
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
              </button>
              <a href={media.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-black/35 px-4 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                {labels.source} <ExternalLink className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
