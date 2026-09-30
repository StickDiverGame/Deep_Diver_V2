// Bühlmann ZHL-16C with gradient factors. Tracks every inert gas (nitrogen + helium);
// only oxygen is ignored for decompression.
const HT_N2 = [5, 8, 12.5, 18.5, 27, 38.3, 54.3, 77, 109, 146, 187, 239, 305, 390, 498, 635];
const A_N2 = [1.1696, 1.0, 0.8618, 0.7562, 0.62, 0.5043, 0.441, 0.4, 0.375, 0.35, 0.3295, 0.3065, 0.2835, 0.261, 0.248, 0.2327];
const B_N2 = [0.5578, 0.6514, 0.7222, 0.7825, 0.8126, 0.8434, 0.8693, 0.891, 0.9092, 0.9222, 0.9319, 0.9403, 0.9477, 0.9544, 0.9602, 0.9653];
const HT_HE = [1.88, 3.02, 4.72, 6.99, 10.21, 14.48, 20.53, 29.11, 41.2, 55.19, 70.69, 90.34, 115.29, 147.42, 188.24, 240.03];
const A_HE = [1.6189, 1.383, 1.1919, 1.0458, 0.922, 0.8205, 0.7305, 0.6502, 0.595, 0.5545, 0.5333, 0.5189, 0.5181, 0.5176, 0.5172, 0.5119];
const B_HE = [0.477, 0.5747, 0.6527, 0.7223, 0.7582, 0.7957, 0.8279, 0.8553, 0.8757, 0.8903, 0.8997, 0.9073, 0.9122, 0.9171, 0.9217, 0.9267];
const SURFACE = 1.01325;
const WATER_VAPOR = 0.0627;

export const GF_LOW = 0.3;
export const GF_HIGH = 0.85;

export interface Gas {
  o2: number;
  he: number;
}

export interface Deco {
  tissues: number[]; // nitrogen
  he?: number[]; // helium
  firstStop: number; // deepest stop depth seen this dive (m), anchors GF low
}

const amb = (depth: number) => SURFACE + Math.max(0, depth) / 10;
const heOf = (d: Deco) => (d.he ??= HT_N2.map(() => 0));
const copy = (d: Deco, firstStop = d.firstStop): Deco => ({
  tissues: [...d.tissues],
  he: [...heOf(d)],
  firstStop,
});

export function freshDeco(): Deco {
  const p = (SURFACE - WATER_VAPOR) * 0.79;
  return { tissues: HT_N2.map(() => p), he: HT_N2.map(() => 0), firstStop: 0 };
}

export function loadTissues(d: Deco, depth: number, gas: Gas, dtSec: number) {
  const pAlv = amb(depth) - WATER_VAPOR;
  const fHe = Math.max(0, gas.he);
  const fN2 = Math.max(0, 1 - gas.o2 - fHe);
  const m = dtSec / 60;
  const he = heOf(d);
  for (let i = 0; i < HT_N2.length; i++) {
    d.tissues[i]! += (pAlv * fN2 - d.tissues[i]!) * (1 - Math.pow(2, -m / HT_N2[i]!));
    he[i]! += (pAlv * fHe - he[i]!) * (1 - Math.pow(2, -m / HT_HE[i]!));
  }
}

function rawCeiling(d: Deco, gf: number) {
  const he = heOf(d);
  let worst = 0;
  for (let i = 0; i < HT_N2.length; i++) {
    const pn = d.tissues[i]!;
    const ph = he[i]!;
    const p = pn + ph;
    if (p <= 0) continue;
    const a = (A_N2[i]! * pn + A_HE[i]! * ph) / p;
    const b = (B_N2[i]! * pn + B_HE[i]! * ph) / p;
    const tol = (p - a * gf) / (gf / b + 1 - gf);
    worst = Math.max(worst, tol);
  }
  return Math.max(0, (worst - SURFACE) * 10);
}

/** Current ceiling in metres, with GF interpolated from GF low (first stop) to GF high (surface). */
export function ceiling(d: Deco) {
  const low = rawCeiling(d, GF_LOW);
  const stop = Math.ceil(low / 3) * 3;
  if (stop > d.firstStop) d.firstStop = stop;
  if (d.firstStop <= 0) return rawCeiling(d, GF_HIGH);
  let c = low;
  for (let k = 0; k < 4; k++) {
    const gf = GF_HIGH + (GF_LOW - GF_HIGH) * Math.min(1, c / d.firstStop);
    c = rawCeiling(d, gf);
  }
  return c;
}

/** Next 3 m stop depth, or 0 when a direct ascent is allowed. */
export function stopDepth(d: Deco) {
  return Math.ceil(ceiling(d) / 3) * 3;
}

/** Seconds needed at `depth` before the ceiling clears the next shallower stop. */
export function stopTime(d: Deco, depth: number, gas: Gas) {
  const sim = copy(d);
  const target = depth - 3;
  let t = 0;
  while (ceiling(sim) > target && t < 3600) {
    loadTissues(sim, depth, gas, 10);
    t += 10;
  }
  return t;
}

/** No-decompression time in minutes at `depth` (capped at 99). */
export function ndt(d: Deco, depth: number, gas: Gas) {
  const sim = copy(d, 0);
  let t = 0;
  while (t < 99 * 60 && ceiling(sim) <= 0) {
    loadTissues(sim, depth, gas, 30);
    t += 30;
  }
  return Math.floor(t / 60);
}

/** Time to surface in minutes: 10 m/min ascent plus every stop, picking the best gas at each depth. */
export function tts(d: Deco, depth: number, gases: Gas[]) {
  const sim = copy(d);
  const air: Gas = { o2: 0.21, he: 0 };
  const best = (z: number) =>
    gases
      .filter((g) => g.o2 * (z / 10 + 1) <= 1.6)
      .sort((a, b) => b.o2 - a.o2 || a.he - b.he)[0] ?? air;
  let z = depth;
  let t = 0;
  let guard = 0;
  while (z > 0 && guard++ < 2000) {
    const next = Math.max(0, z - 1);
    if (ceiling(sim) > next) {
      loadTissues(sim, z, best(z), 30);
      t += 30;
    } else {
      loadTissues(sim, z, best(z), 6);
      t += 6;
      z = next;
    }
  }
  return Math.ceil(t / 60);
}
