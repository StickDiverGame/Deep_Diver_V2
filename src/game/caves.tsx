// Flooded caves in the far (right) wall, opened by the 170 m dive.
// World units: x across (1 unit = 2 m), d = depth in metres.

/** Left edge of the far beach; the world ends at CAVE_WORLD. */
export const R_BEACH = 352;
export const CAVE_WORLD = 360;

/** The far wall rising from the 200 m bottom to the far beach (mirrors the first beach). */
export const FAR_WALL: [number, number][] = [
  [274, 200],
  [280, 170],
  [286, 140],
  [292, 110],
  [298, 80],
  [306, 60],
  [316, 40],
  [326, 20],
  [R_BEACH - 9, 11.6],
  [R_BEACH - 2, 3.2],
  [R_BEACH + 1.4, 1.2],
];

export type CaveId = "c20" | "c40" | "c60" | "c80" | "hall" | "dry";

interface Tunnel {
  id: CaveId;
  pts: [number, number][];
  hh: number;
}

const END = CAVE_WORLD + 1;

export const TUNNELS: Tunnel[] = [
  // 20 m: zigzags down and up, then climbs into the dry chamber
  { id: "c20", hh: 1.2, pts: [[324, 20], [330, 21.5], [334, 26], [338, 21], [342, 26], [345.5, 21], [348, 15]] },
  // 40 m: long tunnel to the end of the world; the cave reel lies inside
  { id: "c40", hh: 1.3, pts: [[314, 40], [322, 41], [332, 42.5], [345, 41], [END, 42]] },
  // 60 m and 80 m both open into the stalactite hall
  { id: "c60", hh: 1.3, pts: [[304, 60], [312, 61], [320.5, 65.5]] },
  { id: "c80", hh: 1.3, pts: [[296, 80], [304, 79.5], [314, 76], [320.5, 72.5]] },
];

/** Big flooded hall linking the 60 m and 80 m caves. */
export const HALL = { x0: 320, x1: END, d0: 63.5, d1: 75 };
/** Dry chamber at the top of the 20 m cave: air above WATER. */
export const DRY = { x0: 347, x1: END, d0: 9, d1: 15.5, water: 11 };

export const CAVE_REEL = { x: 340, d: 41.8 };

function centre(t: Tunnel, x: number): number | null {
  for (let i = 1; i < t.pts.length; i++) {
    const [x0, d0] = t.pts[i - 1]!;
    const [x1, d1] = t.pts[i]!;
    if (x >= x0 && x <= x1) return d0 + ((d1 - d0) * (x - x0)) / (x1 - x0);
  }
  return null;
}

/** Roof and floor of the cave space at this point, so guidelines stay inside the rock. */
export function caveBounds(x: number, d: number, force = false): { roof: number; floor: number } | null {
  const slack = 1;
  if (x >= DRY.x0 && x <= DRY.x1 && d >= DRY.water - slack && d <= DRY.d1 + slack) {
    return { roof: DRY.water, floor: DRY.d1 - 0.15 };
  }
  if (x >= HALL.x0 && x <= HALL.x1 && d >= HALL.d0 - slack && d <= HALL.d1 + slack) {
    // stalactites and stalagmites are solid: squeeze the free gap between them
    let roof = HALL.d0 + 0.15;
    let floor = HALL.d1 - 0.15;
    for (const s of SPIKES) {
      const dx = Math.abs(x - s.x);
      if (dx > s.w) continue;
      const reach = s.len * (1 - dx / s.w);
      if (s.up) roof = Math.max(roof, HALL.d0 + reach + 0.15);
      else floor = Math.min(floor, HALL.d1 - reach - 0.15);
    }
    return floor > roof ? { roof, floor } : { roof: (roof + floor) / 2, floor: (roof + floor) / 2 };
  }
  let best: { roof: number; floor: number } | null = null;
  let bestGap = Infinity;
  for (const t of TUNNELS) {
    const c = centre(t, x);
    if (c === null) continue;
    const gap = Math.abs(d - c);
    if ((force || gap < t.hh + 1.5) && gap < bestGap) {
      bestGap = gap;
      best = { roof: c - t.hh + 0.15, floor: c + t.hh - 0.15 };
    }
  }
  return best;
}

/** Which cave space (if any) contains this point. */
export function caveAt(x: number, d: number): CaveId | null {
  if (x >= DRY.x0 && x <= DRY.x1 && d >= DRY.water && d <= DRY.d1) return "dry";
  if (x >= HALL.x0 && x <= HALL.x1 && d >= HALL.d0 && d <= HALL.d1) {
    // stalagmites / stalactites are solid
    if (!spikeHit(x, d)) return "hall";
  }
  for (const t of TUNNELS) {
    const c = centre(t, x);
    if (c !== null && Math.abs(d - c) < t.hh) return t.id;
  }
  return null;
}

/** Deterministic stalactites (from the roof) and stalagmites (from the floor). */
export const SPIKES = Array.from({ length: 14 }, (_, i) => {
  const x = HALL.x0 + 3 + i * 2.8 + ((i * 7) % 3) * 0.4;
  const up = i % 2 === 0;
  const len = 2.6 + ((i * 5) % 4) * 0.9;
  return { x, up, len, w: 0.7 + ((i * 3) % 3) * 0.2 };
}).filter((s) => s.x < HALL.x1 - 1);

function spikeHit(x: number, d: number) {
  for (const s of SPIKES) {
    const dx = Math.abs(x - s.x);
    if (dx > s.w) continue;
    const reach = s.len * (1 - dx / s.w);
    if (s.up ? d < HALL.d0 + reach : d > HALL.d1 - reach) return true;
  }
  return false;
}

/** Cave spaces painted over the rock. */
export function CaveArt({ light }: { light: { x: number; d: number } | null }) {
  const tube = (t: Tunnel) => {
    const top = t.pts.map(([x, d]) => `${x} ${d - t.hh}`);
    const bot = [...t.pts].reverse().map(([x, d]) => `${x} ${d + t.hh}`);
    return `M ${top.join(" L ")} L ${bot.join(" L ")} Z`;
  };
  const all = (
    <g>
      {TUNNELS.map((t) => (
        <path key={t.id} d={tube(t)} fill="var(--color-sea-deep)" />
      ))}
      <rect x={HALL.x0} y={HALL.d0} width={HALL.x1 - HALL.x0} height={HALL.d1 - HALL.d0} rx={1.5} fill="var(--color-sea-deep)" />
      {SPIKES.map((s, i) => (
        <path
          key={i}
          d={
            s.up
              ? `M ${s.x - s.w} ${HALL.d0} L ${s.x} ${HALL.d0 + s.len} L ${s.x + s.w} ${HALL.d0} Z`
              : `M ${s.x - s.w} ${HALL.d1} L ${s.x} ${HALL.d1 - s.len} L ${s.x + s.w} ${HALL.d1} Z`
          }
          fill="var(--color-sand-dark)"
        />
      ))}
      {/* dry chamber: air pocket above the water line */}
      <rect x={DRY.x0} y={DRY.d0} width={DRY.x1 - DRY.x0} height={DRY.d1 - DRY.d0} rx={1.2} fill="var(--color-sea-deep)" />
      <rect x={DRY.x0} y={DRY.d0} width={DRY.x1 - DRY.x0} height={DRY.water - DRY.d0} rx={1} fill="var(--color-sky-low)" opacity={0.35} />
      <line x1={DRY.x0} y1={DRY.water} x2={DRY.x1} y2={DRY.water} stroke="var(--color-foam)" strokeWidth={0.08} opacity={0.7} />
    </g>
  );
  // only the entrances are visible from outside; the interior shows in the torch beam
  return (
    <g>
      <defs>
        <clipPath id="cave-entrances">
          {TUNNELS.map((t) => (
            <rect key={t.id} x={t.pts[0]![0] - 1} y={t.pts[0]![1] - 4} width={3} height={8} />
          ))}
        </clipPath>
        {light && (
          <clipPath id="cave-torch">
            <circle cx={light.x} cy={light.d} r={5} />
          </clipPath>
        )}
      </defs>
      <g clipPath="url(#cave-entrances)">{all}</g>
      {light && <g clipPath="url(#cave-torch)">{all}</g>}
    </g>
  );
}
