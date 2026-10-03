import qrcode from "qrcode-generator";

/* QR matrix (true = dark module) for any short text: booking IDs and signed ticket codes
   (e.g. U1.UNT-2026-K7M2Q.Ab3dEf9GhJkL). The version grows with the text; error correction M. */
export function qrMatrix(text) {
  const q = qrcode(0, "M");
  q.addData(String(text));
  q.make();
  const n = q.getModuleCount();
  return Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) => q.isDark(y, x)));
}
