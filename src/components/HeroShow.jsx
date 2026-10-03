import { useEffect, useState } from "react";

/* Full-bleed photo backdrop for the hero: real team photos cross-fade every few seconds with a slow zoom.
   Reduced motion: one still photo. */
const PHOTOS = ["/teams/football-card.webp", "/teams/basketball-card.webp", "/teams/music-dance-card.webp", "/teams/track-swimming-card.webp", "/teams/tech-esports-card.webp"];

export default function HeroShow({ fade }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % PHOTOS.length), 6000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#0a1222]" aria-hidden="true">
      {PHOTOS.map((src, k) => (
        <img key={k === i ? `${src}-on` : src} src={src} alt="" decoding="async" loading={k === 0 ? "eager" : "lazy"} draggable={false}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ${k === i ? "u-ken opacity-100" : "opacity-0"}`} />
      ))}
      <div className="absolute inset-0 bg-gradient-to-r from-[#070d1a]/90 via-[#070d1a]/60 to-[#070d1a]/20" />
      <div className="absolute inset-x-0 bottom-0 h-28" style={{ background: `linear-gradient(to bottom, transparent, ${fade})` }} />
    </div>
  );
}
