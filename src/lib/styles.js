// Tiles behind emoji/logos when there's no photo: one calm ink tone for every category.
export const INK = "from-slate-800 to-slate-900";
export const GRADIENTS = new Proxy({}, { get: () => INK });

/* Installed iPhone app uses the black-translucent status bar (white text over the page): a graphite strip the height of
   the status bar keeps it readable over the light header. Zero height everywhere else. */
// Light header: iOS draws the status text white, so it needs something dark behind it. A soft dark glass that fades into
// the header (no hard band); the header's own blur shows through its lower part.
export const STATUS_BAR_STRIP = { backgroundImage: "linear-gradient(rgba(14,15,19,0.9) 0, rgba(14,15,19,0.78) calc(var(--sat) * 0.6), rgba(14,15,19,0) calc(var(--sat) + 10px))" };

export const glassDark = { background: "rgba(0,0,0,0.78)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)" };
export const overlayStyle = { background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" };
export const glassChip = { background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" };

export const CSS = `
@keyframes uFade{from{opacity:0}to{opacity:1}}
@keyframes uUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes uPop{0%{transform:scale(.4);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
@keyframes uSpin{to{transform:rotate(360deg)}}
@keyframes uPing{0%{box-shadow:0 0 0 0 rgba(245,158,11,.6)}100%{box-shadow:0 0 0 8px rgba(245,158,11,0)}}
.u-fade{animation:uFade .2s ease-out both}
.u-up{animation:uUp .28s cubic-bezier(.2,.8,.2,1) both}
.u-pop{animation:uPop .45s cubic-bezier(.2,.8,.2,1) both}
.u-spin{animation:uSpin .8s linear infinite}
.u-ping{animation:uPing 1.4s ease-out infinite}
.u-card{transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease}
@media (hover:hover) and (pointer:fine){.u-card:hover{transform:translateY(-2px);box-shadow:0 1px 2px rgba(15,23,42,.04),0 12px 28px -12px rgba(15,23,42,.18);border-color:#cbd5e1}}
.u-btn{transition:all .2s cubic-bezier(.2,.8,.2,1)}
.u-btn:not(:disabled):active{transform:scale(.95)}
@keyframes uSlide{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
@keyframes uDraw{to{stroke-dashoffset:0}}
.u-slide{animation:uSlide .3s ease-out both}
.u-ring{stroke-dasharray:151;stroke-dashoffset:151;animation:uDraw .6s ease-out forwards}
.u-tick{stroke-dasharray:40;stroke-dashoffset:40;animation:uDraw .4s .5s ease-out forwards}
.u-rise{animation:uUp .45s cubic-bezier(.2,.8,.2,1) backwards}
@keyframes uTab{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.u-tab{animation:uTab .3s cubic-bezier(.2,.8,.2,1) backwards}
@media (prefers-reduced-motion:reduce){.u-tab,.u-rise,.u-up{animation:none}}
`;
