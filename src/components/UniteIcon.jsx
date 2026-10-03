/* Unite brand mark (logo pack): app icon with ~22% rounded corners. Empty alt when the word "unite" sits next to it. */
// Small sizes use a crisp variant (same figures and colours, without the soft fade, glow and shadow that blur at
// ~36px) plus a hairline edge so the tile stays defined on the dark header. `full` keeps the original artwork.
export const UniteIcon = ({ className = "h-9 w-9", alt = "", full = false }) => (
  <img src={full ? "/icons/unite-icon.svg" : "/icons/unite-icon-small.svg"} alt={alt} width="36" height="36" draggable="false"
    className={`${className} shrink-0 rounded-[22%] ${full ? "" : "ring-1 ring-white/15"}`} />
);
