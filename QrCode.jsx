import qrcode from "qrcode-generator";

/* Crisp SVG QR code (loaded on demand, only where a QR is shown). */
export default function QrCode({ value, size = 132 }) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount(), q = 2; // quiet zone in modules
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
  return (
    <svg viewBox={`0 0 ${n + q * 2} ${n + q * 2}`} width={size} height={size} role="img" aria-label={`QR code for ${value}`} shapeRendering="crispEdges" className="block rounded-lg bg-white">
      <path d={d} fill="#0a192f" />
    </svg>
  );
}
