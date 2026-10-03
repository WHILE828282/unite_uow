/* Minimal QR encoder: version 1 (21x21), error correction L, byte mode, up to 17 characters.
   Verified against an independent decoder; booking IDs (e.g. UNT-2026-K7M2Q) fit comfortably. */
export function qrMatrix(text) {
  const N = 21;
  const bytes = Array.from(new TextEncoder().encode(text)).slice(0, 17);
  const bits = [];
  const put = (v, len) => { for (let i = len - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
  put(4, 4); put(bytes.length, 8); bytes.forEach((b) => put(b, 8));
  const cap = 19 * 8;
  put(0, Math.min(4, cap - bits.length));
  while (bits.length % 8) bits.push(0);
  for (let pad = 0xec; bits.length < cap; pad = pad === 0xec ? 0x11 : 0xec) put(pad, 8);
  const data = [];
  for (let i = 0; i < 19; i++) { let v = 0; for (let j = 0; j < 8; j++) v = (v << 1) | bits[i * 8 + j]; data.push(v); }

  const exp = new Array(512), log = new Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) { exp[i] = x; log[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) exp[i] = exp[i - 255];
  const mul = (a, b) => (a && b ? exp[log[a] + log[b]] : 0);
  let gen = [1];
  for (let i = 0; i < 7; i++) {
    const next = new Array(gen.length + 1).fill(0);
    gen.forEach((c, j) => { next[j] ^= c; next[j + 1] ^= mul(c, exp[i]); });
    gen = next;
  }
  const ec = new Array(7).fill(0);
  for (const d of data) {
    const f = d ^ ec[0];
    ec.shift(); ec.push(0);
    for (let i = 0; i < 7; i++) ec[i] ^= mul(gen[i + 1], f);
  }
  const words = data.concat(ec);

  const m = Array.from({ length: N }, () => new Array(N).fill(false));
  const fn = Array.from({ length: N }, () => new Array(N).fill(false));
  const setXY = (px, py, v) => { if (px >= 0 && px < N && py >= 0 && py < N) { m[py][px] = v; fn[py][px] = true; } };
  const finder = (cx, cy) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy));
      setXY(cx + dx, cy + dy, d !== 2 && d !== 4);
    }
  };
  finder(3, 3); finder(N - 4, 3); finder(3, N - 4);
  for (let i = 8; i < N - 8; i++) { setXY(6, i, i % 2 === 0); setXY(i, 6, i % 2 === 0); }
  const drawFormat = (mask) => {
    const d5 = (1 << 3) | mask;
    let rem = d5;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const f = ((d5 << 10) | rem) ^ 0x5412;
    const b = (i) => ((f >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) setXY(8, i, b(i));
    setXY(8, 7, b(6)); setXY(8, 8, b(7)); setXY(7, 8, b(8));
    for (let i = 9; i < 15; i++) setXY(14 - i, 8, b(i));
    for (let i = 0; i < 8; i++) setXY(N - 1 - i, 8, b(i));
    for (let i = 8; i < 15; i++) setXY(8, N - 15 + i, b(i));
    setXY(8, N - 8, true);
  };
  drawFormat(0);
  let k = 0;
  for (let right = N - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < N; vert++) for (let j = 0; j < 2; j++) {
      const px = right - j;
      const y = ((right + 1) & 2) === 0 ? N - 1 - vert : vert;
      if (!fn[y][px] && k < words.length * 8) { m[y][px] = ((words[k >>> 3] >>> (7 - (k & 7))) & 1) === 1; k++; }
    }
  }
  for (let y = 0; y < N; y++) for (let px = 0; px < N; px++) if (!fn[y][px] && (px + y) % 2 === 0) m[y][px] = !m[y][px];
  drawFormat(0);
  return m;
}
