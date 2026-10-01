import { useEffect, useRef, useState } from "react";
import { DiverAnim, ManifoldArt, ValveArt, type AnimSpec, type Extra } from "./DiverAnim";
import { GEAR_NAMES, GearIcon, HUNT_GEAR, TECH_GEAR, type GearKind } from "./gear";
import { CAVE_REEL, CAVE_WORLD, CaveArt, DRY, FAR_WALL, HALL, R_BEACH, SPIKES, TUNNELS, caveAt, caveBounds, type CaveId } from "./caves";
import { StageArt, W1, W2, W3, W4, WallDecor, WreckArt, type Span } from "./tech";
import { ceiling, freshDeco, loadTissues, maxAscentRate, ndt, stopDepth, stopTime, tts, type Deco } from "./buhlmann";
import {
  bcdPuzzle,
  breathOptions,
  earPuzzle,
  finsPuzzle,
  maskPuzzle,
  regPuzzle,
  shuffle,
  swimPuzzle,
  tankPuzzle,
  twinsetPuzzle,
  manifoldPuzzle,
  longhosePuzzle,
  stageLeavePuzzle,
  stageCarryPuzzle,
  type Puzzle,
  type PuzzleOption,
} from "./puzzles";

type Phase =
  | "beach"
  | "swimTrain"
  | "swimLaps"
  | "breathTrain"
  | "earTrain"
  | "diveBasic"
  | "findMask"
  | "maskTrain"
  | "findFins"
  | "finsTrain"
  | "finDives"
  | "findKey"
  | "locker"
  | "bcdTrain"
  | "regTrain"
  | "tankTrain"
  | "findDepthGauge"
  | "findPressureGauge"
  | "deepDives"
  | "gearHunt"
  | "findTank2"
  | "deep40"
  | "findTank3"
  | "sportech"
  | "findTwinset"
  | "twinsetTrain"
  | "manifoldTrain"
  | "longhoseTrain"
  | "findTechGear"
  | "dpvTrain"
  | "wrecks"
  | "liftBag"
  | "trimixTrain"
  | "stageTrain"
  | "stageTrain2"
  | "deepWreck"
  | "allDone"
  | "dive170"
  | "wreck4"
  | "caves"
  | "finished"
  | "complete";

type Tag = "wall" | "beach" | "line" | "w1" | "w2" | "w2deep" | "w3" | "w4" | "bag";
interface Knot {
  id: number;
  x: number;
  d: number;
  tag: Tag;
  wreck?: Tag;
}
interface Seg {
  id: number;
  a: number;
  b: number;
  hidden?: boolean;
}
interface Staged {
  x: number;
  d: number;
  seg: number;
  slot: number;
  tank: Tank;
}

const BEACH_END = 6;
const START_WORLD = 34;
/** World width once the 170 m dive opens the far side of the ocean. */
const ABYSS_WORLD = CAVE_WORLD;
const VIEW_H = 15;
const SURFACE_MARGIN = 3;
const REQUIRED = 4;

interface WorldObject {
  kind: "mask" | "fins" | "key" | "locker" | GearKind;
  x: number;
  depth: number;
}

interface Modal {
  type: "anim" | "breath" | "dpv" | "trimix";
  dpvHit?: string[];
  mixDepth?: number;
  mixO2?: number;
  mixHe?: number;
  puzzle?: Puzzle;
  options: PuzzleOption[];
  wrongId?: string | undefined;
  wrongAt?: number | undefined;
  okAt?: number | undefined;
  inhaleAt?: number | undefined;
  /** Practice run opened from a badge: doesn't touch game progress. */
  practice?: boolean;
  prog?: number;
}

interface Tank {
  bar: number;
  o2: number;
  size: number;
  he?: number;
  empty?: boolean;
}

interface Stop {
  kind: "deco" | "safety";
  lo: number;
  hi: number;
  need: number;
  left: number;
}

interface ScubaDive {
  start: number;
  max: number;
  maxAt: number;
  stopSecs: number;
  decoSecs: number;
  stopStart: number | null;
  barAtStop: number | null;
  deco?: boolean;
  gases?: number[];
  /** rolling one-minute depth window used to police the ascent rate */
  win?: { t: number; d: number }[];
  ascBad?: boolean;
}

interface State {
  phase: Phase;
  worldW: number;
  x: number;
  depth: number;
  facing: 1 | -1;
  inWater: boolean;
  progress: number;
  laps: number;
  touchedLeft: boolean;
  touchedRight: boolean;
  dives: number;
  breaths: number;
  breathHeldAt: number | null;
  breathLocked: boolean;
  diveActive: boolean;
  diveStart: number;
  diveMax: number;
  pendingExhale: boolean;
  hasMask: boolean;
  hasFins: boolean;
  hasKey: boolean;
  hasKit: boolean;
  object: WorldObject | null;
  objects: WorldObject[];
  badges: string[];
  badge: { text: string; at: number } | null;
  failAt: number;
  save: number;
  modal: Modal | null;
  // scuba stage
  clock: number;
  ff: boolean;
  hasDepthGauge: boolean;
  hasPressureGauge: boolean;
  hasTimer: boolean;
  capDescent: boolean;
  capAscent: boolean;
  stopBadge: boolean;
  items: GearKind[];
  tanks: Tank[];
  active: number;
  holdTank: { i: number; at: number } | null;
  nitrox: number;
  timerMs: number;
  surfaceSince: number | null;
  sdive: ScubaDive | null;
  stop: Stop | null;
  dsmbLine: number | null;
  dsmbX: number;
  hasComputer: boolean;
  comp: { ndt: number; tts: number; ceil: number; at: number };
  sand: { x: number; y: number; at: number }[];
  cheat: boolean;
  cheated: boolean;
  deco: Deco;
  hover: string | null;
  twinset: boolean;
  anyO2: boolean;
  torch: { lvl: number; on: boolean; auto: boolean; used: number; flooded: boolean };
  dpv: { lvl: number; on: boolean; used: number; flooded: boolean };
  knots: Knot[];
  segs: Seg[];
  seq: number;
  reel: { last: number; used: number } | null;
  reelUsed: number;
  reelCap: number;
  staged: Staged[];
  pickups: WorldObject[];
  tanksIssued: number;
  trimix: boolean;
  sacBase: number;
  reel2Pending: boolean;
  counts: Record<string, number>;
  log: LogEntry[];
  cur: { n: number; start: number; samples: [number, number][]; max: number } | null;
  logOpen: boolean;
  cave: { reel: boolean; dry: boolean; through: boolean; inside: CaveId | null; enter: CaveId | null };
  explore: boolean;
  reel4Taken: boolean;
}

const TRAIN_PHASES: Phase[] = [
  "swimTrain",
  "breathTrain",
  "earTrain",
  "maskTrain",
  "finsTrain",
  "bcdTrain",
  "regTrain",
  "tankTrain",
  "twinsetTrain",
  "manifoldTrain",
  "longhoseTrain",
  "dpvTrain",
  "trimixTrain",
  "stageTrain",
  "stageTrain2",
];

/** Qualifying dives needed per stage. */
function need(p: Phase) {
  if (p === "deep40") return 2;
  if (p === "sportech") return 1;
  return REQUIRED;
}

const DIVE_PHASES: Phase[] = [
  "diveBasic",
  "findMask",
  "maskTrain",
  "findFins",
  "finsTrain",
  "finDives",
  "findKey",
  "locker",
  "bcdTrain",
  "regTrain",
  "tankTrain",
  "findDepthGauge",
  "findPressureGauge",
  "deepDives",
  "gearHunt",
  "findTank2",
  "deep40",
  "findTank3",
  "sportech",
  "findTwinset",
  "twinsetTrain",
  "manifoldTrain",
  "longhoseTrain",
  "findTechGear",
  "dpvTrain",
  "wrecks",
  "liftBag",
  "trimixTrain",
  "stageTrain",
  "stageTrain2",
  "deepWreck",
  "allDone",
  "dive170",
  "wreck4",
  "finished",
  "complete",
];

const LIMITS: Partial<Record<Phase, { min: number; max: number; durMin: number }>> = {
  deepDives: { min: 15, max: 20, durMin: 40 },
  gearHunt: { min: 0, max: 30, durMin: 18 },
  findTank2: { min: 0, max: 33, durMin: 10 },
  deep40: { min: 38, max: 42, durMin: 25 },
  sportech: { min: 45, max: 50, durMin: 30 },
};

function puzzleFor(phase: Phase): Puzzle | null {
  switch (phase) {
    case "swimTrain":
      return swimPuzzle;
    case "earTrain":
      return earPuzzle;
    case "maskTrain":
      return maskPuzzle;
    case "finsTrain":
      return finsPuzzle;
    case "bcdTrain":
      return bcdPuzzle;
    case "regTrain":
      return regPuzzle;
    case "tankTrain":
      return tankPuzzle;
    case "twinsetTrain":
      return twinsetPuzzle;
    case "manifoldTrain":
      return manifoldPuzzle;
    case "longhoseTrain":
      return longhosePuzzle;
    case "stageTrain":
      return stageLeavePuzzle;
    case "stageTrain2":
      return stageCarryPuzzle;
    default:
      return null;
  }
}

function initial(): State {
  return {
    phase: "beach",
    worldW: START_WORLD,
    x: 3,
    depth: 0,
    facing: 1,
    inWater: false,
    progress: 0,
    laps: 0,
    touchedLeft: false,
    touchedRight: false,
    dives: 0,
    breaths: 0,
    breathHeldAt: null,
    breathLocked: false,
    diveActive: false,
    diveStart: 0,
    diveMax: 0,
    pendingExhale: false,
    hasMask: false,
    hasFins: false,
    hasKey: false,
    hasKit: false,
    object: null,
    objects: [],
    badges: [],
    badge: null,
    failAt: 0,
    save: 3,
    modal: null,
    clock: 0,
    ff: false,
    hasDepthGauge: false,
    hasPressureGauge: false,
    hasTimer: false,
    capDescent: false,
    capAscent: false,
    stopBadge: false,
    items: [],
    tanks: [{ bar: 200, o2: 0.21, size: 12, he: 0 }],
    active: 0,
    holdTank: null,
    nitrox: 0.32,
    timerMs: 0,
    surfaceSince: null,
    sdive: null,
    stop: null,
    dsmbLine: null,
    dsmbX: 0,
    hasComputer: false,
    comp: { ndt: 99, tts: 0, ceil: 0, at: 0 },
    sand: [],
    cheat: false,
    cheated: false,
    hover: null,
    deco: freshDeco(),
    twinset: false,
    anyO2: false,
    torch: { lvl: 0, on: false, auto: true, used: 0, flooded: false },
    dpv: { lvl: 0, on: false, used: 0, flooded: false },
    knots: [],
    segs: [],
    seq: 1,
    reel: null,
    reelUsed: 0,
    reelCap: 80,
    staged: [],
    pickups: [],
    tanksIssued: 0,
    trimix: false,
    sacBase: 16,
    reel2Pending: false,
    counts: {},
    log: [],
    cur: null,
    logOpen: false,
    cave: { reel: false, dry: false, through: false, inside: null, enter: null },
    explore: false,
    reel4Taken: false,
  };
}

function BED(worldW: number): [number, number][] {
  if (worldW >= ABYSS_WORLD)
    return [
      [BEACH_END - 1.4, 1.2],
      [BEACH_END + 2, 3.2],
      [BEACH_END + 9, 11.6],
      [START_WORLD, 13],
      [START_WORLD + 6, 34],
      [START_WORLD + 12, 44],
      [START_WORLD + 24, 52],
      [START_WORLD + 30, 60],
      [START_WORLD + 36, 80],
      [START_WORLD + 44, 105],
      [START_WORLD + 52, 135],
      [START_WORLD * 6 + 10, 160],
      [START_WORLD * 6 + 20, 200],
      ...FAR_WALL,
    ];
  if (worldW >= START_WORLD * 6)
    return [
      [BEACH_END - 1.4, 1.2],
      [BEACH_END + 2, 3.2],
      [BEACH_END + 9, 11.6],
      [START_WORLD, 13],
      [START_WORLD + 6, 34],
      [START_WORLD + 12, 44],
      [START_WORLD + 24, 52],
      [START_WORLD + 30, 60],
      [START_WORLD + 36, 80],
      [START_WORLD + 44, 105],
      [START_WORLD + 52, 135],
      [START_WORLD + 68, 150],
      [START_WORLD + 90, 165],
      [START_WORLD + 115, 180],
      [START_WORLD + 140, 195],
      [worldW + 10, 215],
    ];
  if (worldW >= ABYSS_WORLD)
    return [
      [BEACH_END - 1.4, 1.2],
      [BEACH_END + 2, 3.2],
      [BEACH_END + 9, 11.6],
      [START_WORLD, 13],
      [START_WORLD + 6, 34],
      [START_WORLD + 12, 44],
      [START_WORLD + 24, 52],
      [START_WORLD + 30, 60],
      [START_WORLD + 36, 80],
      [START_WORLD + 44, 105],
      [START_WORLD + 52, 135],
      [START_WORLD * 6 + 10, 160],
      [START_WORLD * 6 + 20, 200],
      [worldW + 10, 200],
    ];
  if (worldW >= START_WORLD * 3)
    return [
      [BEACH_END - 1.4, 1.2],
      [BEACH_END + 2, 3.2],
      [BEACH_END + 9, 11.6],
      [START_WORLD, 13],
      [START_WORLD + 6, 34],
      [START_WORLD + 12, 44],
      [START_WORLD + 24, 52],
      [START_WORLD + 30, 60],
      [START_WORLD + 36, 80],
      [START_WORLD + 44, 105],
      [START_WORLD + 52, 135],
      [worldW + 10, 160],
    ];
  return [
    [BEACH_END - 1.4, 1.2],
    [BEACH_END + 2, 3.2],
    [BEACH_END + 9, 11.6],
    [START_WORLD, 13],
    [START_WORLD + 6, 34],
    [START_WORLD + 12, 44],
    [START_WORLD + 24, 52],
    [worldW + 10, worldW > START_WORLD * 2 ? 85 : 55],
  ];
}

/** Seabed depth (m) under x — the sandy wall is solid. */
function bedDepth(x: number, worldW: number) {
  const pts = BED(worldW);
  if (x <= pts[0]![0]) return 0;
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i]!;
    const [x0, y0] = pts[i - 1]!;
    if (x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return pts[pts.length - 1]![1];
}

/** Open water or a flooded cave: somewhere the diver can be. */
function free(x: number, d: number, worldW: number) {
  if (d <= bedDepth(x, worldW) - 0.3) return true;
  return worldW >= ABYSS_WORLD && caveAt(x, d) !== null;
}

/** Is the far beach open? */
function farBeach(worldW: number) {
  return worldW >= ABYSS_WORLD;
}

/** Line distance in metres (1 world unit across = 2 m). */
function dist(ax: number, ad: number, bx: number, bd: number) {
  return Math.hypot((ax - bx) * 2, ad - bd);
}

function segDist(px: number, pd: number, ax: number, ad: number, bx: number, bd: number) {
  const ux = (bx - ax) * 2;
  const ud = bd - ad;
  const L = ux * ux + ud * ud || 1;
  const t = Math.max(0, Math.min(1, (((px - ax) * 2) * ux + (pd - ad) * ud) / L));
  return dist(px, pd, ax + (ux / 2) * t, ad + ud * t);
}

/** A line between two points that bends over the sandy wall instead of cutting through it. */
function bent(ax: number, ad: number, bx: number, bd: number, worldW: number): [number, number][] {
  const caves = worldW >= ABYSS_WORLD;
  const endsInCave = caves && (caveAt(ax, ad) !== null || caveAt(bx, bd) !== null);
  const n = Math.max(2, Math.ceil(Math.abs(bx - ax) * (endsInCave ? 10 : 3)));
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = ax + (bx - ax) * t;
    const d = ad + (bd - ad) * t;
    if (i === 0 || i === n) {
      pts.push([x, d]);
      continue;
    }
    // inside (or just outside) a cave the line is squeezed between roof and floor
    const b = caves ? caveBounds(x, d, endsInCave) : null;
    if (b) {
      pts.push([x, Math.max(b.roof, Math.min(b.floor, d))]);
      continue;
    }
    pts.push([x, Math.min(d, bedDepth(x, worldW) - 0.08)]);
  }
  return pts;
}

function lineLen(ax: number, ad: number, bx: number, bd: number, worldW: number) {
  const p = bent(ax, ad, bx, bd, worldW);
  let L = 0;
  for (let i = 1; i < p.length; i++) L += dist(p[i - 1]![0], p[i - 1]![1], p[i]![0], p[i]![1]);
  return L;
}

const ptsStr = (p: [number, number][]) => p.map(([x, y]) => `${x},${y}`).join(" ");

function mixLabel(t: { o2: number; he?: number }) {
  const o = Math.round(t.o2 * 100);
  const h = Math.round((t.he ?? 0) * 100);
  if (h > 0) return `${o}/${h}`;
  if (o === 21) return "Air";
  return `EAN${o}`;
}

interface LogEntry {
  n: number;
  dur: number;
  max: number;
  samples: [number, number][];
  gas: string;
  failed: boolean;
}

function LogCard({ e }: { e: LogEntry }) {
  const W = 200;
  const H = 70;
  const maxD = Math.max(5, e.max * 1.1);
  const pts = e.samples.map(([t, d]) => `${(t / Math.max(1, e.dur)) * W},${(d / maxD) * H}`).join(" ");
  return (
    <div className="rounded-2xl bg-foam/10 p-3 ring-1 ring-foam/20">
      <div className="flex items-baseline justify-between text-foam">
        <span className="font-display text-lg font-bold">#{e.n}</span>
        <span className="text-xs text-foam/70">
          {e.max.toFixed(1)} m · {fmt(e.dur * 1000)} · {e.gas}
          {e.failed ? " · aborted" : ""}
        </span>
      </div>
      <svg viewBox={`0 -2 ${W} ${H + 4}`} className="mt-2 h-20 w-full" preserveAspectRatio="none">
        <line x1={0} y1={0} x2={W} y2={0} stroke="var(--color-foam)" strokeWidth={0.5} opacity={0.4} />
        <polyline
          points={`0,0 ${pts}`}
          fill="none"
          stroke={e.failed ? "var(--color-alert)" : "var(--color-badge)"}
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function DiveDetail({ e, onBack }: { e: LogEntry; onBack: () => void }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <button type="button" onClick={onBack} className="self-start rounded-full bg-foam/15 px-4 py-1.5 text-sm font-semibold text-foam">
        ← Dives
      </button>
      <LogCard e={e} />
      <div className="flex-1 overflow-y-auto rounded-2xl bg-foam/10 p-3 ring-1 ring-foam/20">
        <table className="w-full text-left font-mono text-sm text-foam">
          <thead>
            <tr className="text-foam/60">
              <th className="py-1">Time</th>
              <th className="py-1">Seconds</th>
              <th className="py-1">Depth (m)</th>
            </tr>
          </thead>
          <tbody>
            {e.samples.map(([t, d], i) => (
              <tr key={i} className="border-t border-foam/10">
                <td className="py-0.5">{fmt(t * 1000)}</td>
                <td className="py-0.5">{t.toFixed(1)}</td>
                <td className="py-0.5">{d.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const MAP_MIN_Z = 1;
const MAP_MAX_Z = 12;

function WorldMap({ s }: { s: State }) {
  const W = s.worldW;
  const maxD = Math.max(20, ...BED(W).filter(([x]) => x <= W + 1).map(([, d]) => d)) + 5;
  const sx = 1; // true 1:1 world coordinates, so game artwork can be drawn straight in
  const bed: string[] = [];
  for (let x = 0; x <= W; x += 0.5) bed.push(`${x * sx},${bedDepth(x, W)}`);
  const caves = W >= CAVE_WORLD;
  const kn = new Map(s.knots.map((k) => [k.id, k]));
  const wrecks = [W1, W2, W3, W4].filter((w) => w.x0 < W);

  const box = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [cur, setCur] = useState<{ px: number; py: number; mx: number; md: number } | null>(null);
  const [grab, setGrab] = useState(false);
  const view = useRef({ zoom: 1, off: { x: 0, y: 0 } });
  view.current = { zoom, off };
  // zoomed in: swap the chart symbols for the real game artwork
  const detail = zoom >= 2.5;

  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  const zoomAt = (px: number, py: number, next: number) => {
    const { zoom: z, off: o } = view.current;
    const n = Math.min(MAP_MAX_Z, Math.max(MAP_MIN_Z, next));
    if (n === z) return;
    const k = n / z;
    setZoom(n);
    setOff({ x: px - (px - o.x) * k, y: py - (py - o.y) * k });
  };

  const wheelRef = useRef((_e: WheelEvent) => {});
  wheelRef.current = (e: WheelEvent) => {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
    zoomAt(e.clientX - r.left, e.clientY - r.top, view.current.zoom * Math.exp(-dy * 0.0018));
  };

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelRef.current(e);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const readout = (clientX: number, clientY: number) => {
    const el = box.current;
    const svg = svgRef.current;
    if (!el || !svg) return;
    const r = el.getBoundingClientRect();
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    setCur({ px: clientX - r.left, py: clientY - r.top, mx: p.x, md: p.y });
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d) {
      setOff({ x: d.ox + (e.clientX - d.px), y: d.oy + (e.clientY - d.py) });
    }
    readout(e.clientX, e.clientY);
  };

  const centreZoom = (mult: number) => {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    zoomAt(r.width / 2, r.height / 2, view.current.zoom * mult);
  };

  const btn = "rounded-lg bg-sea-deep/70 px-2.5 py-1 font-display text-sm font-bold text-foam ring-1 ring-foam/25 hover:bg-sea-deep";

  return (
    <div
      ref={box}
      className={`relative h-full w-full touch-none overflow-hidden rounded-xl ${grab ? "cursor-grabbing" : zoom > 1 ? "cursor-grab" : "cursor-crosshair"}`}
      onPointerDown={(e) => {
        drag.current = { px: e.clientX, py: e.clientY, ox: off.x, oy: off.y };
        setGrab(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={onMove}
      onPointerUp={() => {
        drag.current = null;
        setGrab(false);
      }}
      onPointerLeave={() => {
        drag.current = null;
        setGrab(false);
        setCur(null);
      }}
    >
      <div
        className="h-full w-full origin-top-left"
        style={{ transform: `translate(${off.x}px, ${off.y}px) scale(${zoom})` }}
      >
        <svg ref={svgRef} viewBox={`-4 -6 ${W * sx + 8} ${maxD + 10}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="mapWater" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-sea-shallow)" stopOpacity={0.55} />
              <stop offset="35%" stopColor="var(--color-sea-mid)" stopOpacity={0.6} />
              <stop offset="100%" stopColor="var(--color-sea-deep)" stopOpacity={0.95} />
            </linearGradient>
          </defs>
          <rect x={0} y={0} width={W * sx} height={maxD} fill="url(#mapWater)" />
          <line x1={0} y1={0} x2={W * sx} y2={0} stroke="var(--color-foam)" strokeWidth={0.4} />
          {/* depth contours */}
          {[10, 20, 30, 40, 60, 80, 100, 150, 200].filter((d) => d < maxD).map((d) => (
            <g key={d}>
              <line x1={0} y1={d} x2={W * sx} y2={d} stroke="var(--color-foam)" strokeWidth={0.12} opacity={0.22} strokeDasharray="2 2" />
              <text x={0.6} y={d - 0.6} fontSize={2.2} fill="var(--color-foam)" opacity={0.6}>{d} m</text>
            </g>
          ))}
          {/* distance ruler along the surface */}
          {Array.from({ length: Math.floor(W / 25) + 1 }).map((_, i) => {
            const x = i * 25;
            return (
              <g key={`t${x}`}>
                <line x1={x * sx} y1={-1.4} x2={x * sx} y2={0} stroke="var(--color-foam)" strokeWidth={0.15} opacity={0.5} />
                <text x={x * sx} y={-2.2} fontSize={2.2} textAnchor="middle" fill="var(--color-foam)" opacity={0.6}>{x}</text>
              </g>
            );
          })}
          <polygon points={`0,${maxD} ${bed.join(" ")} ${W * sx},${maxD}`} fill="var(--color-sand)" opacity={0.9} />
          <polyline points={bed.join(" ")} fill="none" stroke="var(--color-sand-dark)" strokeWidth={0.25} />
          {caves && (
            detail ? (
              <g>
                {TUNNELS.map((t) => (
                  <path key={t.id} d={`M ${t.pts.map(([x, d]) => `${x} ${d - t.hh}`).join(" L ")} L ${[...t.pts].reverse().map(([x, d]) => `${x} ${d + t.hh}`).join(" L ")} Z`} fill="var(--color-sea-deep)" />
                ))}
                <rect x={HALL.x0} y={HALL.d0} width={Math.min(HALL.x1, W) - HALL.x0} height={HALL.d1 - HALL.d0} rx={1.5} fill="var(--color-sea-deep)" />
                {SPIKES.map((sp, i) => (
                  <path
                    key={i}
                    d={sp.up
                      ? `M ${sp.x - sp.w} ${HALL.d0} L ${sp.x} ${HALL.d0 + sp.len} L ${sp.x + sp.w} ${HALL.d0} Z`
                      : `M ${sp.x - sp.w} ${HALL.d1} L ${sp.x} ${HALL.d1 - sp.len} L ${sp.x + sp.w} ${HALL.d1} Z`}
                    fill="var(--color-sand-dark)"
                  />
                ))}
                <rect x={DRY.x0} y={DRY.d0} width={Math.min(DRY.x1, W) - DRY.x0} height={DRY.d1 - DRY.d0} rx={1.2} fill="var(--color-sea-deep)" />
                <rect x={DRY.x0} y={DRY.d0} width={Math.min(DRY.x1, W) - DRY.x0} height={DRY.water - DRY.d0} rx={1} fill="var(--color-sky-low)" opacity={0.4} />
                <text x={(DRY.x0 + Math.min(DRY.x1, W)) / 2} y={DRY.d0 - 1} fontSize={2} textAnchor="middle" fill="var(--color-foam)" opacity={0.75}>Dry Chamber</text>
                <text x={HALL.x0 + 4} y={HALL.d0 - 1} fontSize={2} fill="var(--color-foam)" opacity={0.75}>Stalactite Hall</text>
              </g>
            ) : (
              <g fill="var(--color-sea-deep)" stroke="none">
                {TUNNELS.map((t) => (
                  <polyline key={t.id} points={t.pts.map(([x, d]) => `${x * sx},${d}`).join(" ")} fill="none" stroke="var(--color-sea-deep)" strokeWidth={t.hh * 2.4} strokeLinejoin="round" />
                ))}
                <rect x={HALL.x0 * sx} y={HALL.d0} width={(Math.min(HALL.x1, W) - HALL.x0) * sx} height={HALL.d1 - HALL.d0} />
                <rect x={DRY.x0 * sx} y={DRY.d0} width={(Math.min(DRY.x1, W) - DRY.x0) * sx} height={DRY.d1 - DRY.d0} />
              </g>
            )
          )}
          {caves && TUNNELS.map((t) => (
            <g key={`e${t.id}`}>
              <circle cx={t.pts[0]![0]} cy={t.pts[0]![1]} r={0.9} fill="none" stroke="var(--color-sun)" strokeWidth={0.2} />
              <text x={t.pts[0]![0] - 1.6} y={t.pts[0]![1] - 1.4} fontSize={2} textAnchor="end" fill="var(--color-sun)" opacity={0.85}>
                {Math.round(t.pts[0]![1])} m
              </text>
            </g>
          ))}
          {wrecks.map((w, i) => {
            const x1 = Math.min(w.x1, W);
            const d = bedDepth((w.x0 + x1) / 2, W);
            return (
              <g key={i}>
                {detail ? (
                  <WreckArt span={{ ...w, x1 }} bed={(x) => bedDepth(x, W)} />
                ) : (
                  <rect x={w.x0 * sx} y={d - w.h} width={(x1 - w.x0) * sx} height={w.h} fill="var(--color-sand-dark)" opacity={0.9} />
                )}
                <text x={((w.x0 + x1) / 2) * sx} y={d - w.h - 1.2} fontSize={2.2} textAnchor="middle" fill="var(--color-foam)" opacity={0.8}>
                  Wreck {i + 1} · {Math.round(d)} m
                </text>
              </g>
            );
          })}
          {s.segs.filter((g) => !g.hidden).map((g) => {
            const a = kn.get(g.a);
            const b = kn.get(g.b);
            if (!a || !b) return null;
            return <line key={g.id} x1={a.x * sx} y1={a.d} x2={b.x * sx} y2={b.d} stroke="var(--color-sun)" strokeWidth={0.3} opacity={0.9} />;
          })}
          {s.knots.map((k) => (
            <circle key={k.id} cx={k.x * sx} cy={k.d} r={0.5} fill="var(--color-foam)" />
          ))}
          {s.staged.map((t, i) => (
            <g key={i}>
              <rect x={t.x * sx - 0.5} y={t.d - 1.6} width={1} height={3.2} rx={0.5} fill="var(--color-badge)" />
              <rect x={t.x * sx - 0.18} y={t.d - 2.1} width={0.36} height={0.6} fill="var(--color-gear)" />
              {detail && (
                <text x={t.x * sx + 1} y={t.d} fontSize={1.8} fill="var(--color-foam)" opacity={0.85}>
                  {Math.round(t.tank.o2 * 100)}%
                </text>
              )}
            </g>
          ))}
          {s.pickups.map((o, i) => (
            <circle key={i} cx={o.x * sx} cy={o.depth} r={0.9} fill="var(--color-badge)" opacity={0.9} />
          ))}
          <g>
            <circle cx={s.x * sx} cy={Math.max(-2, s.depth)} r={1.1} fill="var(--color-alert)" stroke="var(--color-foam)" strokeWidth={0.3} />
            <line
              x1={s.x * sx}
              y1={Math.max(-2, s.depth)}
              x2={s.x * sx + s.facing * 2.4}
              y2={Math.max(-2, s.depth)}
              stroke="var(--color-alert)"
              strokeWidth={0.3}
            />
          </g>
        </svg>

      </div>
      {cur && (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md bg-sea-deep/80 px-2 py-1 text-[11px] font-semibold text-foam/90 ring-1 ring-foam/20"
          style={{ left: cur.px + 12, top: cur.py + 12 }}
        >
          {Math.round(cur.mx)} m across · {Math.max(0, cur.md).toFixed(1)} m deep
        </div>
      )}
      <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5">
        <span className="rounded-lg bg-sea-deep/60 px-2 py-1 text-[11px] font-semibold text-foam/70">{zoom.toFixed(1)}×</span>
        <button type="button" className={btn} onClick={() => centreZoom(1 / 1.5)}>−</button>
        <button type="button" className={btn} onClick={() => centreZoom(1.5)}>+</button>
        <button
          type="button"
          className={btn}
          onClick={() => {
            setZoom(1);
            setOff({ x: 0, y: 0 });
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function Logbook({ s, onClose }: { s: State; onClose: () => void }) {
  const [tab, setTab] = useState<"dives" | "map">("dives");
  const [sel, setSel] = useState<number | null>(null);
  const picked = sel === null ? null : s.log.find((e) => e.n === sel) ?? null;
  const tabCls = (on: boolean) =>
    `rounded-full px-5 py-2 font-display font-bold ${on ? "bg-foam text-sea-deep" : "bg-foam/15 text-foam"}`;
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center bg-sea-deep/90 p-6 backdrop-blur-sm">
      <div className="flex w-full max-w-5xl items-center justify-between gap-3">
        <div className="font-display text-3xl font-black text-foam">Logbook</div>
        <div className="flex gap-2">
          <button type="button" className={tabCls(tab === "dives")} onClick={() => setTab("dives")}>Dives</button>
          <button type="button" className={tabCls(tab === "map")} onClick={() => setTab("map")}>Map</button>
        </div>
        <button type="button" onClick={onClose} className="rounded-full bg-foam/15 px-5 py-2 text-sm font-semibold text-foam">✕</button>
      </div>
      <div className="mt-4 min-h-0 w-full max-w-5xl flex-1 pb-6">
        {tab === "map" ? (
          <div className="h-full rounded-2xl bg-foam/5 p-3 ring-1 ring-foam/20">
            <WorldMap s={s} />
          </div>
        ) : picked ? (
          <DiveDetail e={picked} onBack={() => setSel(null)} />
        ) : (
          <div className="grid h-full grid-cols-1 content-start gap-3 overflow-y-auto sm:grid-cols-2">
            {[...s.log].reverse().map((e) => (
              <button key={e.n} type="button" onClick={() => setSel(e.n)} className="text-left transition-transform hover:scale-[1.02]">
                <LogCard e={e} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const base = (t: Tag | undefined) => (t === "w2deep" ? "w2" : t);
const TORCH = [null, { depth: 60, min: 60 }, { depth: 100, min: 120 }, { depth: 250, min: 180 }];
const DPV = [null, { depth: 60, min: 60 }, { depth: 100, min: 120 }, { depth: 250, min: 180 }];

/** All cylinders set to 0 L: breath-hold diving only. */
function noAir(s: { tanks: { size: number }[] }) {
  return s.tanks.every((t) => t.size <= 0);
}

const HINTS: Partial<Record<Phase, string>> = {
  beach: "Press Down to wade into the water.",
  swimTrain: "Tap Train and pick the flutter kick with breast stroke, four times.",
  swimLaps: "Swim at the surface to the far left, then the far right edge. Four laps.",
  breathTrain: "Tap Train, click inhale, wait 30-45 seconds, click exhale. Four times.",
  earTrain: "Tap Train and pick the nose pinch that inflates the eardrum. Four times.",
  diveBasic: "Inhale, dive to about twice your height (3-4 m), stay 30-45 s, surface, exhale. Four dives.",
  findMask: "A glowing object sits at 3-4 m. Swim to it within 45 seconds.",
  maskTrain: "Tap Train: hand holding the mask while exhaling through the nose.",
  findFins: "Find the glowing object at 3-4 m.",
  finsTrain: "Tap Train: flutter kick with no hands.",
  finDives: "Four dives to 3-4 m, each under 45 s.",
  findKey: "The key is at about 9-10 m.",
  locker: "The map doubled. Swim to the locker in the new area.",
  bcdTrain: "Tap Train: inflator on the jacket.",
  regTrain: "Tap Train: regulator in the mouth, breathing bubbles.",
  tankTrain: "Tap Train: opening the cylinder valve.",
  findDepthGauge: "Something is waiting at about 12 m in the new area.",
  findPressureGauge: "Something is waiting at about 13-14 m.",
  deepDives: "Four dives to 15-20 m: descend under 20 m/min, ascend under 10 m/min, 3 min safety stop at 3-5 m with 50+ bar.",
  gearHunt: "Five items lie at 20-30 m. Max 30 m, 18 min to the safety stop.",
  findTank2: "A second cylinder is at 30 m. Max 33 m, under 10 min to the safety stop.",
  deep40: "The dive computer is at 40 m. Then two dives to 38-42 m that need a deco stop, switching between both gases (click and hold a gauge).",
  findTank3: "A third cylinder waits near 40 m.",
  sportech: "One dive to 45-50 m with at least one mandatory deco stop.",
  findTwinset: "A twinset lies at 40-45 m.",
  twinsetTrain: "Tap Train: twin cylinders with an isolation manifold and a long hose.",
  manifoldTrain: "Tap Train: two valves joined by a crossbar with a centre isolator.",
  longhoseTrain: "Tap Train: long hose down the right hip, across the chest, around the neck to the mouth.",
  findTechGear: "Six items lie at 45-50 m: compass, torch, 80 m reel, DPV, lift bag, tech fins.",
  dpvTrain: "Tap Train: click the left and right arrows only. Four passes.",
  wrecks: "A small wreck sits at 30-35 m. Click the reel near it, swim out paying line, and click the reel again at the big wreck (45 m+). Cut to stop.",
  liftBag: "On the big wreck: click the reel, rise 1-5 m, click the lift bag.",
  trimixTrain: "Tap Train: pick O2 and He so ppO2 is 0.18-1.4 bar and ppN2 at most 4 bar at the shown depth. Four times.",
  stageTrain: "Tap Train: the cylinder clipped to a line.",
  stageTrain2: "Tap Train: the cylinder clipped along the diver's front.",
  deepWreck: "Tie the reel on the big wreck at 70-80 m, follow it down and tie off on the third wreck (100-130 m).",
  allDone: "A second reel waits at 40-45 m. Pick it up.",
  dive170: "Make one dive to 170 m or deeper and surface safely, doing all deco stops.",
  wreck4: "Tie the reel on the third wreck, follow the wall down to 200 m and tie off on the fourth wreck along the bottom.",
  caves: "A 100 m reel now lies on the third wreck (100-130 m): collect it for extra line. Flooded caves open in the far wall at 20, 40, 60 and 80 m. Tie a reel outside, keep it running and use the torch. Find the cave reel in the 40 m cave, surface in the dry chamber at the top of the 20 m cave, and swim through the deep caves: in at 60 m, out at 80 m (or the other way). Entering along a visible line is fine; losing sight of any line in the torch beam = fail. Brushing cave walls stirs silt. No gas is used in the dry chamber.",
  finished: "All current steps are done.",
  complete: "All current steps are done.",
};

function fmt(ms: number) {
  const t = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

export function DiveGame() {
  const g = useRef<State>(initial());
  // Fill any fields missing from older saved state (e.g. after a live code update)
  {
    const fresh = initial() as unknown as Record<string, unknown>;
    const cur = g.current as unknown as Record<string, unknown>;
    for (const k of Object.keys(fresh)) if (cur[k] === undefined) cur[k] = fresh[k];
    for (const t of g.current.tanks) {
      if (t.size === undefined) t.size = 12;
      if (t.he === undefined) t.he = 0;
    }
  }
  const keys = useRef<Record<string, boolean>>({});
  const [, setTick] = useState(0);
  const [viewW, setViewW] = useState(26);

  // older sessions that already finished the long hose move on to the tech stage
  useEffect(() => {
    if (g.current.worldW === START_WORLD * 8) g.current.worldW = ABYSS_WORLD;
    if (g.current.phase === "complete") {
      g.current.worldW = START_WORLD * 3;
      setPhase("findTechGear");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const resize = () => {
      const ratio = window.innerWidth / Math.max(window.innerHeight, 1);
      setViewW(Math.max(16, Math.min(46, VIEW_H * ratio)));
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)
      ) {
        e.preventDefault();
      }
      keys.current[e.key] = true;
      const st = g.current;
      if (!st.inWater && (e.key === "ArrowDown" || e.key === "s")) enterWater();
      if (
        st.inWater &&
        (e.key === "ArrowUp" || e.key === "w") &&
        st.depth < 0.5 &&
        (st.x <= BEACH_END + 0.8 || (farBeach(st.worldW) && st.x >= R_BEACH - 0.8))
      ) {
        exitWater();
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
    };

    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  function enterWater() {
    const s = g.current;
    s.inWater = true;
    s.x = farBeach(s.worldW) && s.x >= R_BEACH ? R_BEACH - 1.2 : BEACH_END + 1.2;
    s.depth = 0;
    s.save = s.x;
    s.tanks = s.tanks.map((t) => ({ ...t, bar: 200 }));
    s.active = Math.max(0, s.tanks.findIndex((t) => t.size > 0));
    // all line is rewound and replenished on the beach
    s.timerMs = 0;
    s.sdive = null;
    s.stop = null;
    s.dsmbLine = null;
    s.surfaceSince = s.clock;
    s.reel = null;
    s.reelUsed = 0;
    refillSlots();
    if (s.phase === "beach") setPhase("swimTrain");
  }

  function exitWater() {
    const s = g.current;
    s.inWater = false;
    s.depth = 0;
    s.x = farBeach(s.worldW) && s.x > s.worldW / 2 ? Math.max(s.x, R_BEACH + 0.2) : Math.min(s.x, BEACH_END - 0.2);
    s.save = s.x;
    s.reel = null;
    s.torch = { ...s.torch, on: false, auto: true, used: 0, flooded: false };
    s.dpv = { ...s.dpv, on: false, used: 0, flooded: false };
    refillSlots();
    if (s.reel2Pending) {
      s.reel2Pending = false;
      const x = 48 + Math.random() * 6;
      s.pickups = [...s.pickups, { kind: "reel2", x, depth: Math.min(40 + Math.random() * 5, bedDepth(x, s.worldW) - 0.8) }];
    }
    s.diveActive = false;
    s.diveMax = 0;
    s.breathHeldAt = null;
    s.pendingExhale = false;
    s.tanks = s.tanks.map((t) => ({ ...t, bar: 200 }));
    s.deco = freshDeco();
    s.timerMs = 0;
    s.sdive = null;
    s.stop = null;
    s.dsmbLine = null;
  }

  /** Samples the dive profile; every dive since the very first goes into the logbook. */
  function recordLog() {
    const s = g.current;
    const under = s.inWater && s.depth > 0.3;
    if (under) {
      if (!s.cur) s.cur = { n: s.log.length + 1, start: s.clock, samples: [[0, s.depth]], max: s.depth };
      const c = s.cur;
      c.max = Math.max(c.max, s.depth);
      const t = (s.clock - c.start) / 1000;
      const lastT = c.samples[c.samples.length - 1]![0];
      if (t - lastT >= 2) {
        c.samples.push([t, s.depth]);
        if (c.samples.length > 400) c.samples = c.samples.filter((_, i) => i % 2 === 0);
      }
    } else if (s.cur) {
      closeLog(false);
    }
  }

  function closeLog(failed: boolean) {
    const s = g.current;
    const c = s.cur;
    s.cur = null;
    if (!c) return;
    const dur = (s.clock - c.start) / 1000;
    if (dur < 3) return;
    const tank = s.tanks[s.active];
    s.log = [
      ...s.log,
      {
        n: s.log.length + 1,
        dur,
        max: c.max,
        samples: [...c.samples, [dur, 0]],
        gas: s.hasKit && !noAir(s) && tank ? mixLabel(tank) : "Breath hold",
        failed,
      },
    ];
  }

  function fail() {
    const s = g.current;
    if (s.explore) return;
    closeLog(true);
    s.failAt = Date.now();
    s.x = s.save;
    s.depth = 0;
    s.diveActive = false;
    s.diveMax = 0;
    s.breathHeldAt = null;
    s.pendingExhale = false;
    s.modal = null;
    s.sdive = null;
    s.stop = null;
    s.dsmbLine = null;
    s.reel = null;
    s.dpv.on = false;
    s.timerMs = 0;
    s.tanks = s.tanks.map((t) => ({ ...t, bar: 200 }));
    s.deco = freshDeco();
  }

  function award(text: string) {
    const s = g.current;
    s.badges = [...s.badges, text];
    s.badge = { text, at: Date.now() };
  }

  /** Item badge; re-acquiring the same item numbers it ("DSMB 2"). */
  function awardItem(name: string) {
    const s = g.current;
    const had = s.counts[name] ?? (s.badges.includes(name) ? 1 : 0);
    const n = had + 1;
    s.counts[name] = n;
    const text = n > 1 ? `${name} ${n}` : name;
    const old = had > 1 ? `${name} ${had}` : name;
    const i = s.badges.indexOf(old);
    if (had > 0 && i >= 0) s.badges = s.badges.map((b, j) => (j === i ? text : b));
    else s.badges = [...s.badges, text];
    s.badge = { text, at: Date.now() };
  }

  /** Empty front slots (staged or lost cylinders) are refilled at the beach: 20 cylinders, 30 once Trimix is earned. */
  function refillSlots() {
    const s = g.current;
    const cap = s.trimix ? 30 : 20;
    for (let i = 1; i < s.tanks.length; i++) {
      const t = s.tanks[i]!;
      if (t.empty && s.tanksIssued < cap) {
        s.tanks[i] = { bar: 200, o2: t.o2, he: t.he ?? 0, size: t.size };
        s.tanksIssued += 1;
        awardItem("Cylinder");
      }
    }
  }

  function spawnTech() {
    const s = g.current;
    s.objects = TECH_GEAR.filter((k) => !s.items.includes(k)).map((kind, i) => {
      const x = 55 + i * 1.3 + Math.random() * 0.8;
      return { kind, x, depth: Math.min(45 + Math.random() * 5, bedDepth(x, s.worldW) - 0.8) };
    });
  }

  function spawnPickup(kind: GearKind) {
    const s = g.current;
    let x: number;
    let d: number;
    if (kind === "liftbag") {
      x = 40 + Math.random() * 50;
      d = 10 + Math.random() * 30;
    } else if (kind === "torch3" || kind === "dpv3") {
      x = START_WORLD + 30 + Math.random() * 14;
      d = 60 + Math.random() * 20;
    } else {
      x = 55 + Math.random() * 7;
      d = 45 + Math.random() * 5;
    }
    s.pickups = [...s.pickups, { kind, x, depth: Math.min(d, bedDepth(x, s.worldW) - 0.8) }];
  }

  function spawn(kind: WorldObject["kind"]) {
    const s = g.current;
    const depth =
      kind === "key"
        ? 9.4
        : kind === "locker"
          ? 4
          : kind === "depthGauge"
            ? 12
            : kind === "pressureGauge"
              ? 13.5
              : kind === "tank2"
                ? 30
                : kind === "computer" || kind === "tank3"
                  ? 40
                  : kind === "twinset"
                    ? 43
                    : kind === "dsmb"
                      ? 12
                      : 3.5;
    const x =
      kind === "locker"
        ? s.worldW - 8
        : ["tank3", "twinset"].includes(kind)
          ? START_WORLD + 16 + Math.random() * (s.worldW - START_WORLD - 20)
        : ["depthGauge", "pressureGauge", "tank2", "computer", "dsmb"].includes(kind)
          ? START_WORLD + 13 + Math.random() * (s.worldW - START_WORLD - 17)
          : BEACH_END + 8 + Math.random() * (s.worldW - BEACH_END - 16);
    s.object = { kind, x, depth: Math.min(depth, bedDepth(x, s.worldW) - 0.8) };
  }

  function spawnHunt() {
    const s = g.current;
    s.objects = HUNT_GEAR.filter((k) => !s.items.includes(k)).map((kind, i) => ({
      kind,
      x: START_WORLD + 3 + i * ((s.worldW - START_WORLD - 6) / HUNT_GEAR.length) + Math.random() * 2,
      depth: 20 + Math.random() * 10,
    })).map((o) => ({ ...o, depth: Math.min(o.depth, bedDepth(o.x, s.worldW) - 0.8) }));
  }

  function setPhase(p: Phase) {
    const s = g.current;
    s.phase = p;
    s.progress = 0;
    s.modal = null;
    s.save = s.x;
    s.object = null;
    s.objects = [];
    if (p === "findMask") spawn("mask");
    if (p === "findFins") spawn("fins");
    if (p === "findKey") spawn("key");
    if (p === "locker") spawn("locker");
    if (p === "findDepthGauge") spawn("depthGauge");
    if (p === "findPressureGauge") spawn("pressureGauge");
    if (p === "findTank2") spawn("tank2");
    if (p === "gearHunt") spawnHunt();
    if (p === "deep40") spawn("computer");
    if (p === "findTank3") spawn("tank3");
    if (p === "findTwinset") spawn("twinset");
    if (p === "findTechGear") spawnTech();
  }

  function finishTraining() {
    const s = g.current;
    switch (s.phase) {
      case "swimTrain":
        setPhase("swimLaps");
        break;
      case "breathTrain":
        setPhase("earTrain");
        break;
      case "earTrain":
        setPhase("diveBasic");
        break;
      case "maskTrain":
        award("Mask Clearing");
        setPhase("findFins");
        break;
      case "finsTrain":
        award("Finning");
        setPhase("finDives");
        break;
      case "bcdTrain":
        award("Buoyancy Compensator");
        setPhase("regTrain");
        break;
      case "regTrain":
        award("Regulator");
        setPhase("tankTrain");
        break;
      case "tankTrain":
        award("Cylinder");
        setPhase("findDepthGauge");
        break;
      case "twinsetTrain":
        award("Twinset");
        s.anyO2 = true;
        setPhase("manifoldTrain");
        break;
      case "manifoldTrain":
        award("Isolation Manifold");
        setPhase("longhoseTrain");
        break;
      case "longhoseTrain":
        award("Long Hose");
        s.worldW = START_WORLD * 3;
        setPhase("findTechGear");
        break;
      case "dpvTrain":
        award("DPV Diver");
        setPhase("wrecks");
        break;
      case "trimixTrain":
        award("Trimix");
        s.trimix = true;
        s.sacBase = 15;
        setPhase("stageTrain");
        break;
      case "stageTrain":
        setPhase("stageTrain2");
        break;
      case "stageTrain2":
        award("Stage");
        // the ocean doubles in size and opens down to 200 m
        s.worldW = START_WORLD * 6;
        if (!s.pickups.some((o) => o.kind === "torch3")) spawnPickup("torch3");
        if (!s.pickups.some((o) => o.kind === "dpv3")) spawnPickup("dpv3");
        setPhase("deepWreck");
        break;
      default:
        break;
    }
  }

  function maxDepth(s: State) {
    if (!DIVE_PHASES.includes(s.phase)) return 0.6;
    if (s.badges.includes("Stage")) return 200;
    if (s.trimix) return 150;
    switch (s.phase) {
      case "findTechGear":
      case "dpvTrain":
      case "wrecks":
      case "liftBag":
      case "trimixTrain":
        return 52;
      case "findDepthGauge":
        return 14;
      case "findPressureGauge":
        return 16;
      case "deepDives":
        return 22;
      case "gearHunt":
        return 32;
      case "findTank2":
        return 34;
      case "deep40":
      case "findTank3":
        return 42;
      case "findTwinset":
        return 46;
      case "sportech":
      case "twinsetTrain":
      case "manifoldTrain":
      case "longhoseTrain":
        return 52;
      case "complete":
        return s.twinset ? 52 : 42;
      default:
        break;
    }
    if (s.phase === "findKey" || ["locker", "bcdTrain", "regTrain", "tankTrain"].includes(s.phase))
      return 10.6;
    return 4;
  }

  function endDive(now: number) {
    const s = g.current;
    const start = s.breathLocked ? s.diveStart : (s.breathHeldAt ?? s.diveStart);
    const secs = (now - start) / 1000;
    const deep = s.diveMax;
    s.diveActive = false;

    if (s.phase === "diveBasic") {
      if (secs > 45) {
        fail();
        return;
      }
      if (deep >= 3 && secs >= 30) {
        s.dives += 1;
        s.save = s.x;
        if (s.dives >= REQUIRED) {
          s.breathLocked = true;
          award("Breath Hold");
          s.dives = 0;
          setPhase("findMask");
        }
      }
    } else if (s.phase === "finDives") {
      if (secs > 45) {
        fail();
        return;
      }
      if (deep >= 3) {
        s.dives += 1;
        s.save = s.x;
        if (s.dives >= REQUIRED) {
          s.dives = 0;
          setPhase("findKey");
        }
      }
    } else if (secs > 45) {
      fail();
      return;
    }
    s.diveMax = 0;
    s.breathHeldAt = null;
    s.pendingExhale = false;
  }

  // ---------- scuba ----------

  function sac(depth: number) {
    // litres per minute: 16 at surface, +16 per 10 m
    return g.current.sacBase * (1 + Math.max(0, depth) / 10);
  }

  function evalScubaDive() {
    const s = g.current;
    const d = s.sdive;
    s.sdive = null;
    s.stop = null;
    if (!d) return;
    if (s.phase === "dive170" && d.max >= 170) {
      unlockAbyss();
      return;
    }
    const lim = LIMITS[s.phase];
    if (!lim) return;

    const descMin = Math.max(0.01, (d.maxAt - d.start) / 60000);
    const durMin = ((d.stopStart ?? s.clock) - d.start) / 60000;
    const needStop = d.max > 9;
    const bad =
      d.max > lim.max ||
      durMin > lim.durMin ||
      d.max / descMin > 20 ||
      !!d.ascBad ||
      (needStop && d.stopSecs < 180) ||
      (needStop && (d.barAtStop ?? 200) < 50);

    if (bad) {
      fail();
      return;
    }
    if (d.max < lim.min) return;
    if ((s.phase === "deep40" || s.phase === "sportech") && !d.deco) return;
    if (s.phase === "deep40" && (d.gases?.length ?? 0) < 2) return;
    creditDive();
  }

  /** The successful 170 m dive: the ocean widens to a vertical far wall and wreck 4 lies on the 200 m bottom. */
  function unlockAbyss() {
    const s = g.current;
    s.save = s.x;
    s.worldW = ABYSS_WORLD;
    if (!s.cave.reel && !s.pickups.some((o) => o.kind === "reel3"))
      s.pickups = [...s.pickups, { kind: "reel3", x: CAVE_REEL.x, depth: CAVE_REEL.d }];
    award("Abyss Diver");
    setPhase("wreck4");
  }

  /** After the Abyss Wreck badge a 100 m reel lies on the third wreck. */
  function spawnReel4() {
    const s = g.current;
    if (s.reel4Taken || s.pickups.some((o) => o.kind === "reel4")) return;
    const x = (W3.x0 + W3.x1) / 2;
    s.pickups = [...s.pickups, { kind: "reel4", x, depth: bedDepth(x, s.worldW) - W3.h - 0.6 }];
  }



  /** Is any laid line (or the running reel) within the torch beam? */
  function lineInLight() {
    const s = g.current;
    if (s.reel) return true;
    const R = 5;
    for (const sg of s.segs) {
      if (sg.hidden) continue;
      const a = knot(sg.a);
      const b = knot(sg.b);
      if (!a || !b) continue;
      const vx = b.x - a.x, vd = b.d - a.d;
      const L = vx * vx + vd * vd || 1;
      const t = Math.max(0, Math.min(1, ((s.x - a.x) * vx + (s.depth - a.d) * vd) / L));
      if (Math.hypot(a.x + t * vx - s.x, a.d + t * vd - s.depth) < R) return true;
    }
    return false;
  }

  /** Cave penetration: a running reel is required; tracks the Cave-1 goals. Returns true on failure. */
  function caveStep() {
    const s = g.current;
    const inside = s.worldW >= ABYSS_WORLD && s.depth > bedDepth(s.x, s.worldW) - 0.3 ? caveAt(s.x, s.depth) : null;
    const was = s.cave.inside;
    s.cave.inside = inside;
    const tl = TORCH[s.torch.lvl];
    const lit = s.torch.on || (!!tl && s.torch.auto && !s.torch.flooded && s.torch.used < tl.min);
    if (inside && !(lit && lineInLight())) {
      s.cave.inside = null;
      s.cave.enter = null;
      fail();
      return true;
    }
    if (!was && inside) s.cave.enter = inside;
    if (was && !inside) {
      if ((was === "c60" && s.cave.enter === "c80") || (was === "c80" && s.cave.enter === "c60")) s.cave.through = true;
      s.cave.enter = null;
    }
    if (inside === "dry" && s.depth < DRY.water + 0.6) s.cave.dry = true;
    checkCave1();
    return false;
  }

  function checkCave1() {
    const s = g.current;
    if (s.cave.reel && s.cave.dry && s.cave.through && !s.badges.includes("Cave-1")) {
      award("Cave-1");
      if (s.phase === "caves") setPhase("finished");
    }
  }

  function creditDive() {
    const s = g.current;
    s.dives += 1;
    s.save = s.x;
    if (s.phase === "deepDives" && s.dives >= REQUIRED) {
      s.dives = 0;
      s.capDescent = true;
      s.capAscent = true;
      s.stopBadge = true;
      s.hasTimer = true;
      award("Descent Rate");
      award("Ascent Rate");
      award("Safety Stop");
      setPhase("gearHunt");
    } else if (s.phase === "deep40" && s.dives >= need("deep40")) {
      s.dives = 0;
      award("Deep Diver");
      setPhase("findTank3");
    } else if (s.phase === "sportech" && s.dives >= need("sportech")) {
      s.dives = 0;
      award("SporTechnical Diver");
      setPhase("findTwinset");
    }
  }

  function scubaStep(dtG: number) {
    const s = g.current;
    const submerged = s.depth > 0.3;

    // air
    const tank = s.tanks[s.active]!;
    // decompression tracks every inert gas (nitrogen + helium), never oxygen
    const gas = { o2: tank.o2, he: tank.he ?? 0 };

    // tissue loading + ceiling (Bühlmann ZHL-16C N2 + He, GF 30/85)
    loadTissues(s.deco, s.inWater ? s.depth : 0, gas, dtG);
    if (s.depth < ceiling(s.deco) - 0.5) {
      fail();
      return;
    }
    if (s.hasComputer && performance.now() - s.comp.at > 500) {
      const gases = s.tanks.filter((t) => t.size > 0 && !t.empty).map((t) => ({ o2: t.o2, he: t.he ?? 0 }));
      const c = ceiling(s.deco);
      s.comp = {
        at: performance.now(),
        ceil: c > 0 ? Math.ceil(c / 3) * 3 : 0,
        ndt: c > 0 ? 0 : ndt(s.deco, Math.max(s.depth, 1), gas),
        tts: tts(s.deco, s.depth, gases),
      };
    }
    // the DSMB is recovered at the surface
    if (s.depth < 0.3) {
      s.dsmbLine = null;
    }
    if (s.inWater && s.cave.inside !== "dry" && !s.explore) {
      tank.bar = Math.max(0, tank.bar - (dtG * sac(s.depth)) / 60 / Math.max(1, tank.size));
      if (tank.bar <= 0) {
        fail();
        return;
      }
    }

    // oxygen toxicity / hypoxia
    if (s.trimix) {
      const pp = tank.o2 * (s.depth / 10 + 1);
      if (s.depth > 1 && (pp < 0.18 || pp > 1.9)) {
        fail();
        return;
      }
    } else if (tank.o2 * (s.depth / 10) > 1.6) {
      fail();
      return;
    }

    // tank switch by click-and-hold
    if (
      s.holdTank &&
      s.clock - s.holdTank.at > 600 &&
      s.tanks[s.holdTank.i]!.size > 0 &&
      !s.tanks[s.holdTank.i]!.empty
    ) {
      s.active = s.holdTank.i;
      s.holdTank = null;
    }

    // dive timer
    if (submerged) {
      s.timerMs += dtG * 1000;
      s.surfaceSince = null;
      if (!s.sdive) {
        s.sdive = {
          start: s.clock,
          max: s.depth,
          maxAt: s.clock,
          stopSecs: 0,
          decoSecs: 0,
          stopStart: null,
          barAtStop: null,
        };
      }
    } else {
      if (s.surfaceSince === null) s.surfaceSince = s.clock;
      if (s.clock - s.surfaceSince > 600000) s.timerMs = 0;
      if (s.sdive) evalScubaDive();
    }

    const d = s.sdive;
    if (!d) return;

    if (s.depth > d.max) {
      d.max = s.depth;
      d.maxAt = s.clock;
    }
    if (ceiling(s.deco) > 0) d.deco = true;
    d.gases = d.gases ?? [];
    if (!d.gases.includes(s.active)) d.gases.push(s.active);

    // rolling one-minute ascent-rate check against the depth-scaled limit
    d.win = d.win ?? [];
    d.win.push({ t: s.clock, d: s.depth });
    while (d.win.length > 1 && s.clock - d.win[0]!.t > 60000) d.win.shift();
    const oldest = d.win[0]!;
    const span = (s.clock - oldest.t) / 60000;
    if (span >= 0.15) {
      const rate = (oldest.d - s.depth) / span;
      if (rate > maxAscentRate(s.depth) + 0.5) d.ascBad = true;
    }

    if (s.depth >= 3 && s.depth <= 5) {
      d.stopSecs += dtG;
      if (d.stopStart === null) d.stopStart = s.clock;
      d.barAtStop = d.barAtStop === null ? tank.bar : Math.min(d.barAtStop, tank.bar);
    }
    if (s.depth >= 5 && s.depth <= 7) d.decoSecs += dtG;

    // automatic stop clocks once the badge is earned (Bühlmann ZHL-16C + GF)
    if (s.stopBadge && !s.stop) {
      const sd = stopDepth(s.deco);
      if (sd >= 3 && Math.abs(s.depth - sd) <= 0.5) {
        const t = stopTime(s.deco, sd, gas);
        if (t > 0) s.stop = { kind: "deco", lo: sd - 0.5, hi: sd + 0.5, need: t, left: t };
      } else if (sd < 3 && d.max > 9 && s.depth <= 5 && s.depth >= 3 && d.stopSecs < 180) {
        s.stop = { kind: "safety", lo: 3, hi: 5, need: 180, left: 180 };
      }
    }
    if (s.stop) {
      s.stop.left -= dtG;
      if (s.stop.left <= 0) s.stop = null;
    }
  }

  function step(dt: number) {
    const s = g.current;
    const now = Date.now();
    if (s.modal) {
      if (s.modal.type === "breath" && s.modal.inhaleAt && now - s.modal.inhaleAt > 45000) {
        if (s.modal.practice) s.modal.inhaleAt = undefined;
        else fail();
      }
      return;
    }

    const ffActive = s.ff && s.hasKit && s.inWater;
    const dtG = dt * (ffActive ? 20 : 1);
    s.clock += dtG * 1000;

    const k = keys.current;
    const left = k["ArrowLeft"] || k["a"];
    const right = k["ArrowRight"] || k["d"];
    const downKey = k["ArrowDown"] || k["s"];
    const upKey = k["ArrowUp"] || k["w"];

    if (!s.inWater) {
      const walk = 3.2 * dt;
      if (left) {
        s.x -= walk;
        s.facing = -1;
      }
      if (right) {
        s.x += walk;
        s.facing = 1;
      }
      if (farBeach(s.worldW) && s.x > s.worldW / 2) s.x = Math.max(R_BEACH + 0.2, Math.min(s.worldW - 0.8, s.x));
      else s.x = Math.max(0.8, Math.min(BEACH_END - 0.2, s.x));
      return;
    }

    const speed =
      (s.items.includes("techFins") ? 6.2 : s.hasFins ? 5.2 : 3) * dtG * (s.dpv.on ? 2.5 : 1);
    let vDown = (s.hasKit && !noAir(s) ? 0.5 : s.hasFins ? 2.1 : 1.2) * dtG;
    let vUp = vDown;
    if (s.capDescent) vDown = Math.min(vDown, (20 / 60) * dtG);
    // allowed ascent rate scales with depth: 10 m/min from 20 m up, depth/2 when deeper
    if (s.capAscent) vUp = Math.min(vUp, (maxAscentRate(s.depth) / 60) * dtG);

    if (upKey && s.depth < 0.5 && (s.x <= BEACH_END + 0.8 || (farBeach(s.worldW) && s.x >= R_BEACH - 0.8))) {
      exitWater();
      return;
    }

    const prevX = s.x;
    const prevD = s.depth;
    if (left) {
      s.x -= speed;
      s.facing = -1;
    }
    if (right) {
      s.x += speed;
      s.facing = 1;
    }
    s.x = Math.max(BEACH_END + 0.3, Math.min((farBeach(s.worldW) ? R_BEACH : s.worldW) - 0.3, s.x));
    // sandy wall is solid: can't swim sideways into it (flooded caves are open)
    if (!free(s.x, s.depth, s.worldW)) s.x = prevX;

    const atStop = s.stop;
    if (downKey) s.depth += vDown;
    if (upKey) s.depth -= vUp;
    if (!downKey && !upKey && s.depth > 0 && !atStop) {
      if (s.hasKit && !noAir(s)) {
        // scuba gear: neutral buoyancy — holds depth when no keys are pressed
      } else {
        // freediver: buoyancy fades with depth; neutral at ~4x diver height
        const neutral = 6.8;
        const buoyancy = Math.max(-0.5, Math.min(1, (neutral - s.depth) / neutral));
        s.depth -= vUp * 0.35 * buoyancy;
      }
    }
    if (atStop) {
      // the stop ceiling only blocks ascent: the diver may always swim deeper
      s.depth = Math.max(s.depth, atStop.lo);
      // dropping out of the stop window below clears it; tissues resume on-gassing
      if (s.depth > atStop.hi + 0.5) s.stop = null;
    }

    s.depth = Math.max(0, s.depth);
    const bed = bedDepth(s.x, s.worldW) - 0.3;
    if (!free(s.x, s.depth, s.worldW)) {
      if (free(s.x, prevD, s.worldW)) s.depth = prevD;
      else if (s.depth > bed && caveAt(s.x, s.depth) === null) s.depth = bed;
    }
    if (caveStep()) return;
    if (s.dsmbLine !== null) {
      s.depth = Math.min(s.depth, s.dsmbLine);
      s.dsmbX = s.x;
    }
    // reel line can't run out (length follows the line bending over the wall)
    if (s.reel) {
      const k = knot(s.reel.last);
      if (k && s.reel.used + lineLen(k.x, k.d, s.x, s.depth, s.worldW) > reelCap()) {
        s.x = prevX;
        s.depth = prevD;
      }
    }
    // torch + DPV batteries and depth ratings
    const tl = TORCH[s.torch.lvl];
    if (tl) {
      if (s.depth > tl.depth) s.torch.flooded = true;
      const usable = !s.torch.flooded && s.torch.used < tl.min;
      if (s.torch.auto) s.torch.on = usable && (1 - s.depth / 150 < 0.5 || !!s.cave.inside);
      if (!usable) s.torch.on = false;
      if (s.torch.on) s.torch.used += dtG / 60;
    }
    const dl = DPV[s.dpv.lvl];
    if (dl) {
      if (s.depth > dl.depth) s.dpv.flooded = true;
      if (s.dpv.flooded || s.dpv.used >= dl.min) s.dpv.on = false;
      if (s.dpv.on) s.dpv.used += dtG / 60;
    }
    // sand cloud when close to the wall and moving
    if (!s.cave.inside && s.depth > 0.6 && bed - s.depth < 0.7 && (left || right || downKey) && Math.random() < 0.5) {
      s.sand.push({ x: s.x + (Math.random() - 0.5) * 1.5, y: bed + 0.2, at: now });
    }
    // silt cloud when brushing a cave wall
    if (s.cave.inside && (left || right || downKey || upKey)) {
      const touch = [[0.7, 0], [-0.7, 0], [0, 0.7], [0, -0.7]].some(([ox, od]) => !free(s.x + ox!, s.depth + od!, s.worldW));
      if (touch && Math.random() < 0.6) s.sand.push({ x: s.x + (Math.random() - 0.5) * 1.2, y: s.depth + 0.8, at: now });
    }
    s.sand = s.sand.filter((p) => now - p.at < 6000);

    // Surface swim laps
    if (s.phase === "swimLaps" && s.depth < 0.5) {
      if (s.x <= BEACH_END + 0.6) s.touchedLeft = true;
      if (s.x >= s.worldW - 0.8) s.touchedRight = true;
      if (s.touchedLeft && s.touchedRight) {
        s.touchedLeft = false;
        s.touchedRight = false;
        s.laps += 1;
        s.save = s.x;
        if (s.laps >= REQUIRED) {
          award("Surface Swimmer");
          setPhase("breathTrain");
        }
      }
    }

    recordLog();

    // Depth limits
    if (s.depth > maxDepth(s)) {
      fail();
      return;
    }

    if (s.hasKit && !noAir(s)) {
      scubaStep(dtG);
      if (!s.inWater) return;
    } else {
      // Breath hold ceiling anywhere
      if (s.breathHeldAt && now - s.breathHeldAt > 45000) {
        fail();
        return;
      }

      // Dive tracking
      if (!s.diveActive && s.depth > 0.8) {
        s.diveActive = true;
        s.diveStart = now;
        s.diveMax = 0;
      }
      if (s.diveActive) {
        s.diveMax = Math.max(s.diveMax, s.depth);
        const start = s.breathLocked ? s.diveStart : (s.breathHeldAt ?? s.diveStart);
        if (now - start > 45000) {
          fail();
          return;
        }
        if (s.depth < 0.12) {
          if (!s.breathLocked) {
            if (s.breathHeldAt) {
              s.pendingExhale = true;
              s.diveActive = false;
            } else {
              s.diveActive = false;
              s.diveMax = 0;
            }
          } else {
            endDive(now);
          }
        }
      }
    }

    // Object pickup (single objects)
    if (s.object) {
      const o = s.object;
      if (Math.abs(s.x - o.x) < 1.3 && Math.abs(s.depth - o.depth) < 1.2) {
        const okTime =
          s.hasKit ||
          (now - (s.breathLocked ? s.diveStart : (s.breathHeldAt ?? s.diveStart))) / 1000 <= 45;
        if (okTime) collect(o);
      }
    }

    // Hunt objects
    if (s.objects.length) {
      const hit = s.objects.findIndex(
        (o) => Math.abs(s.x - o.x) < 1.4 && Math.abs(s.depth - o.depth) < 1.4,
      );
      if (hit >= 0) collectHunt(s.objects[hit]!);
    }

    // respawned pickups
    const ph = s.pickups.findIndex((o) => Math.abs(s.x - o.x) < 1.4 && Math.abs(s.depth - o.depth) < 1.4);
    if (ph >= 0) collectPickup(s.pickups[ph]!);
  }

  function collectHunt(o: WorldObject) {
    const s = g.current;
    s.objects = s.objects.filter((x) => x !== o);
    s.items = [...s.items, o.kind as GearKind];
    s.save = s.x;
    awardItem(GEAR_NAMES[o.kind as GearKind]);
    if (o.kind === "torch") s.torch.lvl = Math.max(1, s.torch.lvl);
    if (o.kind === "dpv") s.dpv.lvl = Math.max(1, s.dpv.lvl);
    if (s.phase === "gearHunt" && HUNT_GEAR.every((k) => s.items.includes(k))) setPhase("findTank2");
    if (s.phase === "findTechGear" && TECH_GEAR.every((k) => s.items.includes(k))) {
      spawnPickup("torch2");
      spawnPickup("dpv2");
      setPhase("dpvTrain");
    }
  }

  function collectPickup(o: WorldObject) {
    const s = g.current;
    s.pickups = s.pickups.filter((x) => x !== o);
    const k = o.kind as GearKind;
    if (k === "torch2") s.torch.lvl = 2;
    if (k === "dpv2") s.dpv.lvl = 2;
    if (k === "torch3") s.torch.lvl = 3;
    if (k === "dpv3") s.dpv.lvl = 3;
    if (k === "reel2") {
      s.reelCap = 160;
      if (s.phase === "allDone") setPhase("dive170");
    }
    if (k === "reel3") {
      s.reelCap += 80;
      s.cave.reel = true;
      checkCave1();
    }
    if (k === "reel4") {
      s.reelCap += 100;
      s.reel4Taken = true;
    }
    if (k === "liftbag" && !s.items.includes("liftbag")) s.items = [...s.items, "liftbag"];
    if (k === "dsmb" && !s.items.includes("dsmb")) s.items = [...s.items, "dsmb"];
    awardItem(GEAR_NAMES[k]);
  }

  function collect(o: WorldObject) {
    const s = g.current;
    {
      {
          s.object = null;
          s.save = s.x;
          if (o.kind === "mask") {
            s.hasMask = true;
            award("Mask Found");
            setPhase("maskTrain");
          } else if (o.kind === "fins") {
            s.hasFins = true;
            award("Fins Found");
            setPhase("finsTrain");
          } else if (o.kind === "key") {
            s.hasKey = true;
            s.worldW = START_WORLD * 2;
            award("Key Found");
            setPhase("locker");
          } else if (o.kind === "locker") {
            s.hasKit = true;
            award("Locker Opened");
            setPhase("bcdTrain");
          } else if (o.kind === "depthGauge") {
            s.hasDepthGauge = true;
            award("Depth Gauge");
            setPhase("findPressureGauge");
          } else if (o.kind === "pressureGauge") {
            s.hasPressureGauge = true;
            award("Pressure Gauge");
            setPhase("deepDives");
          } else if (o.kind === "tank2") {
            s.tanks = [...s.tanks, { bar: 200, o2: s.nitrox, size: 12, he: 0 }];
            s.tanksIssued += 1;
            award("Second Cylinder");
            setPhase("deep40");
          } else if (o.kind === "tank3") {
            s.tanks = [...s.tanks, { bar: 200, o2: 0.5, size: 7, he: 0 }];
            s.tanksIssued += 1;
            award("Third Cylinder");
            setPhase("sportech");
          } else if (o.kind === "twinset") {
            s.twinset = true;
            s.tanks[0]!.size = Math.max(5, s.tanks[0]!.size);
            award("Twinset Found");
            setPhase("twinsetTrain");
          } else if (o.kind === "computer") {
            s.hasComputer = true;
            award("Dive Computer");
          } else if (o.kind === "dsmb") {
            s.items = [...s.items, "dsmb"];
            awardItem("DSMB");
          }
      }
    }
  }

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05);
      last = t;
      step(dt);
      setTick((v) => v + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- UI actions ---
  function openTraining() {
    const s = g.current;
    if (s.phase === "breathTrain") {
      s.modal = { type: "breath", options: breathOptions };
      return;
    }
    if (s.phase === "dpvTrain") {
      s.modal = { type: "dpv", options: [], dpvHit: [] };
      return;
    }
    if (s.phase === "trimixTrain") {
      s.modal = newMix();
      return;
    }
    const p = puzzleFor(s.phase);
    if (p) s.modal = { type: "anim", puzzle: p, options: shuffle(p.options) };
  }

  /** Which practice mini-game a badge opens (numbered item badges share their base name). */
  function practiceFor(badge: string): Modal | null {
    const name = badge.replace(/ \d+$/, "");
    const map: Record<string, Puzzle> = {
      "Surface Swimmer": swimPuzzle,
      "Mask Found": maskPuzzle,
      "Mask Clearing": maskPuzzle,
      "Fins Found": finsPuzzle,
      Finning: finsPuzzle,
      "Buoyancy Compensator": bcdPuzzle,
      Regulator: regPuzzle,
      Cylinder: tankPuzzle,
      "Twinset Found": twinsetPuzzle,
      Twinset: twinsetPuzzle,
      "Isolation Manifold": manifoldPuzzle,
      "Long Hose": longhosePuzzle,
      Stage: stageCarryPuzzle,
    };
    if (name === "Breath Hold") return { type: "breath", options: breathOptions, practice: true, prog: 0 };
    if (name === "DPV Diver") return { type: "dpv", options: [], dpvHit: [], practice: true, prog: 0 };
    if (name === "Trimix") return { ...newMix(), practice: true, prog: 0 };
    const p = map[name];
    return p ? { type: "anim", puzzle: p, options: shuffle(p.options), practice: true, prog: 0 } : null;
  }

  function openPractice(badge: string) {
    const m = practiceFor(badge);
    if (m) g.current.modal = m;
  }

  function pickOption(opt: PuzzleOption) {
    const s = g.current;
    if (!s.modal) return;
    if (opt.correct && s.modal.practice) {
      const prog = (s.modal.prog ?? 0) + 1;
      const p = s.modal.puzzle!;
      if (prog >= REQUIRED) s.modal = null;
      else s.modal = { type: "anim", puzzle: p, options: shuffle(p.options), okAt: Date.now(), practice: true, prog };
      return;
    }
    if (opt.correct) {
      s.progress += 1;
      s.modal.okAt = Date.now();
      if (s.progress >= REQUIRED) {
        finishTraining();
      } else {
        const p = s.modal.puzzle!;
        s.modal = { type: "anim", puzzle: p, options: shuffle(p.options), okAt: Date.now() };
      }
    } else {
      s.modal.wrongId = opt.id;
      s.modal.wrongAt = Date.now();
    }
  }

  function breathClick(id: string) {
    const s = g.current;
    const m = s.modal;
    if (!m) return;
    const now = Date.now();
    if (id === "inhale") {
      m.inhaleAt = now;
      return;
    }
    if (!m.inhaleAt) return;
    const secs = (now - m.inhaleAt) / 1000;
    m.inhaleAt = undefined;
    if (m.practice) {
      if (secs >= 30 && secs <= 45) {
        m.prog = (m.prog ?? 0) + 1;
        if (m.prog >= REQUIRED) s.modal = null;
      }
      return;
    }
    if (secs > 45) {
      fail();
      return;
    }
    if (secs >= 30) {
      s.breaths += 1;
      if (s.breaths >= REQUIRED) {
        s.breaths = 0;
        finishTraining();
      }
    }
  }

  function inhale() {
    const s = g.current;
    if (s.depth < 0.4 && !s.breathLocked) s.breathHeldAt = Date.now();
  }

  function exhale() {
    const s = g.current;
    if (s.breathLocked) return;
    if (s.pendingExhale) {
      endDive(Date.now());
      return;
    }
    s.breathHeldAt = null;
  }

  function deployDsmb() {
    const s = g.current;
    // the DSMB is not tied to anything: too little line and it drags the diver up
    if (s.depth > lineAvail()) {
      fail();
      return;
    }
    s.dsmbLine = s.depth;
    s.dsmbX = s.x;
  }

  // ---------- reel lines ----------
  function knot(id: number) {
    return g.current.knots.find((k) => k.id === id);
  }

  /** Every reel plus the finger spool form one shared pool of line. */
  function lineTotal() {
    const s = g.current;
    return (s.items.includes("spool") ? 20 : 0) + (s.items.includes("reel") ? s.reelCap : 0);
  }

  function reelCap() {
    const s = g.current;
    // reels are spent first, the finger spool last; cut and deployed line stays gone for the dive
    return Math.max(0, lineTotal() - s.reelUsed - (s.dsmbLine ?? 0));
  }

  /** Line still on the drums: the pool minus everything the running reel holds. */
  function lineAvail() {
    const s = g.current;
    if (!s.reel) return reelCap();
    const k = knot(s.reel.last);
    const run = s.reel.used + (k ? lineLen(k.x, k.d, s.x, s.depth, s.worldW) : 0);
    return Math.max(0, reelCap() - run);
  }


  function nearWreck(w: Span, x: number, d: number, bed: (x: number) => number) {
    return x >= w.x0 - 0.4 && x <= w.x1 + 0.4 && d >= bed(x) - w.h - 1.5;
  }

  /** Are two tags joined through tied lines (plus the line being reeled)? */
  function connected(a: Tag, b: Tag) {
    const s = g.current;
    const start = s.knots.filter((k) => base(k.tag) === a).map((k) => k.id);
    const seen = new Set(start);
    const stack = [...start];
    while (stack.length) {
      const id = stack.pop()!;
      const k = knot(id);
      if (k && base(k.tag) === b) return true;
      for (const sg of s.segs) {
        const o = sg.a === id ? sg.b : sg.b === id ? sg.a : null;
        if (o !== null && !seen.has(o)) {
          seen.add(o);
          stack.push(o);
        }
      }
    }
    return false;
  }

  function reelFrom(tag: Tag) {
    const s = g.current;
    return !!s.reel && reelConnected(tag);
  }

  function reelConnected(tag: Tag) {
    const s = g.current;
    if (!s.reel) return false;
    const k = knot(s.reel.last);
    if (!k) return false;
    if (base(k.tag) === tag) return true;
    // walk from the reel's last knot
    const seen = new Set([k.id]);
    const stack = [k.id];
    while (stack.length) {
      const id = stack.pop()!;
      const kk = knot(id);
      if (kk && base(kk.tag) === tag) return true;
      for (const sg of s.segs) {
        const o = sg.a === id ? sg.b : sg.b === id ? sg.a : null;
        if (o !== null && !seen.has(o)) {
          seen.add(o);
          stack.push(o);
        }
      }
    }
    return false;
  }

  function wreck2Visible() {
    return reelFrom("w1") || connected("w1", "w2");
  }

  function wreck4Visible() {
    const s = g.current;
    return s.worldW >= ABYSS_WORLD && (reelFrom("w3") || connected("w3", "w4"));
  }

  function wreck3Visible() {
    const s = g.current;
    const k = s.reel ? knot(s.reel.last) : null;
    return (k?.tag === "w2deep" || (!!s.reel && reelConnected("w2deep"))) || connected("w2", "w3");
  }

  function nearSeg(x: number, d: number, range = 1.5) {
    const s = g.current;
    let best: Seg | null = null;
    let bd = range;
    for (const sg of s.segs) {
      if (sg.hidden) continue;
      const a = knot(sg.a);
      const b = knot(sg.b);
      if (!a || !b) continue;
      const pts = bent(a.x, a.d, b.x, b.d, s.worldW);
      for (let i = 1; i < pts.length; i++) {
        const dd = segDist(x, d, pts[i - 1]![0], pts[i - 1]![1], pts[i]![0], pts[i]![1]);
        if (dd < bd) {
          bd = dd;
          best = sg;
        }
      }
    }
    return best;
  }

  /** Legal tie point here: wall, wreck or another line. */
  function tieTag(): Tag | null {
    const s = g.current;
    const bed = (x: number) => bedDepth(x, s.worldW);
    if (s.worldW >= START_WORLD * 3) {
      if (nearWreck(W4, s.x, s.depth, bed) && wreck4Visible()) return "w4";
      if (nearWreck(W3, s.x, s.depth, bed) && wreck3Visible()) return "w3";
      if (nearWreck(W2, s.x, s.depth, bed) && wreck2Visible())
        return s.depth >= 70 && s.depth <= 80 ? "w2deep" : "w2";
      if (nearWreck(W1, s.x, s.depth, bed)) return "w1";
    }
    if (nearSeg(s.x, s.depth)) return "line";
    if ((s.x <= BEACH_END + 2 || (farBeach(s.worldW) && s.x >= R_BEACH - 2)) && s.depth < 2) return "beach";
    if (bed(s.x) - s.depth < 1.5) return "wall";
    return null;
  }

  function addKnot(tag: Tag, wreck?: Tag) {
    const s = g.current;
    const k: Knot = { id: s.seq++, x: s.x, d: s.depth, tag, ...(wreck ? { wreck } : {}) };
    s.knots = [...s.knots, k];
    if (tag === "line") {
      const sg = nearSeg(s.x, s.depth);
      if (sg) s.segs = [...s.segs, { id: s.seq++, a: k.id, b: sg.a, hidden: true }];
    }
    return k;
  }

  function reelClick() {
    const s = g.current;
    if (!s.items.includes("reel") || !s.inWater) return;
    const tag = tieTag();
    if (!tag) return;
    if (!s.reel) {
      const k = addKnot(tag);
      s.reel = { last: k.id, used: 0 };
      return;
    }
    const prev = knot(s.reel.last)!;
    const len = lineLen(prev.x, prev.d, s.x, s.depth, s.worldW);
    if (len < 0.5) return;
    const hadW2 = connected("w1", "w2");
    const hadW3 = connected("w2", "w3");
    const hadW4 = connected("w3", "w4");
    const k = addKnot(tag);
    s.segs = [...s.segs, { id: s.seq++, a: prev.id, b: k.id }];
    s.reel.used += len;
    s.reel.last = k.id;
    if (!hadW2 && connected("w1", "w2") && s.phase === "wrecks") {
      award("Wreck Line");
      setPhase("liftBag");
    }
    if (!hadW3 && connected("w2", "w3") && s.phase === "deepWreck") {
      award("Deep Wreck");
      s.reel2Pending = true;
      setPhase("allDone");
    }
    if (!hadW4 && connected("w3", "w4") && s.phase === "wreck4") {
      award("Abyss Wreck");
      spawnReel4();
      setPhase("caves");
    }
    if (s.trimix && connected("w1", "beach") && !s.badges.includes("Shore Line")) award("Shore Line");
  }

  function deployBag() {
    const s = g.current;
    if (!s.items.includes("liftbag") || !s.reel) return;
    const prev = knot(s.reel.last)!;
    const w = base(prev.tag);
    if (w !== "w1" && w !== "w2" && w !== "w3" && w !== "w4") return;
    const rise = prev.d - s.depth;
    if (rise < 1 || rise > 5) return;
    const onWreck = s.knots.filter((k) => k.tag === "bag" && k.wreck === w).length;
    if (onWreck >= (s.trimix ? 3 : 1)) return;
    // the bag rises straight up from the tie-off to the surface, or until the line runs out
    const left = Math.max(0, reelCap() - s.reel.used);
    const top = Math.max(0, prev.d - left);
    const len = prev.d - top;
    const k = addKnot("bag", w);
    k.x = prev.x;
    k.d = top;
    s.segs = [...s.segs, { id: s.seq++, a: prev.id, b: k.id }];
    s.reel.used += len;
    // the reel stays tied to the anchor knot, so the running line still comes off the wreck
    s.items = s.items.filter((i) => i !== "liftbag");
    spawnPickup("liftbag");
    if (s.phase === "liftBag" && w === "w2") {
      award("Lift Bag Tied");
      setPhase("trimixTrain");
    }
  }

  /** Drop orphaned knots; lost lift bags respawn somewhere in the water. */
  function prune() {
    const s = g.current;
    const keep = new Set<number>();
    for (const sg of s.segs) {
      keep.add(sg.a);
      keep.add(sg.b);
    }
    if (s.reel) keep.add(s.reel.last);
    const lostBags = s.knots.filter((k) => !keep.has(k.id) && k.tag === "bag").length;
    s.knots = s.knots.filter((k) => keep.has(k.id));
    // hidden links whose partner vanished
    s.segs = s.segs.filter((sg) => !sg.hidden || s.segs.some((o) => !o.hidden && (o.a === sg.a || o.b === sg.a)));
    for (let i = 0; i < lostBags; i++) {
      if (!s.items.includes("liftbag") && !s.pickups.some((p) => p.kind === "liftbag")) spawnPickup("liftbag");
    }
  }

  function cutLine() {
    const s = g.current;
    if (s.reel) {
      // aborted run: the loose dashed line vanishes, only tied-off segments stay spent
      s.reelUsed += s.reel.used;
      s.reel = null;
      prune();
      return;
    }
    if (s.dsmbLine === null) {
      const sg = nearSeg(s.x, s.depth);
      if (!sg) return;
      // line vanishes back to the knots in both directions; anything clipped to it is lost
      s.segs = s.segs.filter((x) => x.id !== sg.id);
      s.staged = s.staged.filter((st) => st.seg !== sg.id);
      prune();
      return;
    }
    // DSMB floats away with the line paid out: that length is gone for the rest of the dive
    s.reelUsed += s.dsmbLine;
    s.dsmbLine = null;
    s.items = s.items.filter((k) => k !== "dsmb");
    if (!s.object) spawn("dsmb");
    else s.pickups = [...s.pickups, { kind: "dsmb", x: START_WORLD + 14 + Math.random() * 16, depth: 12 }];
  }

  // ---------- staging ----------
  function stageTank(i: number) {
    const s = g.current;
    const t = s.tanks[i];
    const sg = nearSeg(s.x, s.depth, 2);
    if (!t || t.empty || t.size <= 0 || !sg) return;
    s.staged = [...s.staged, { x: s.x, d: s.depth, seg: sg.id, slot: i, tank: { ...t } }];
    s.tanks[i] = { ...t, empty: true };
    if (s.active === i) s.active = 0;
  }

  function collectStaged(st: Staged) {
    const s = g.current;
    if (dist(st.x, st.d, s.x, s.depth) > 3) return;
    const slot = s.tanks.findIndex((t, i) => i > 0 && t.empty);
    if (slot < 0) return;
    s.tanks[slot] = { ...st.tank, empty: false };
    s.staged = s.staged.filter((x) => x !== st);
  }

  function toggleTorch() {
    const s = g.current;
    s.torch.auto = false;
    s.torch.on = !s.torch.on;
  }

  function toggleDpv() {
    const s = g.current;
    if (!s.badges.includes("DPV Diver") || s.dpv.flooded) return;
    s.dpv.on = !s.dpv.on;
  }

  // ---------- mini-games ----------
  function dpvClick(dir: string) {
    const s = g.current;
    const m = s.modal;
    if (!m) return;
    if (dir === "up" || dir === "down") {
      m.wrongId = dir;
      m.wrongAt = Date.now();
      m.dpvHit = [];
      return;
    }
    const hit = [...new Set([...(m.dpvHit ?? []), dir])];
    m.dpvHit = hit;
    if (hit.includes("left") && hit.includes("right")) {
      m.okAt = Date.now();
      m.dpvHit = [];
      if (m.practice) {
        m.prog = (m.prog ?? 0) + 1;
        if (m.prog >= REQUIRED) s.modal = null;
        return;
      }
      s.progress += 1;
      if (s.progress >= REQUIRED) finishTraining();
    }
  }

  function newMix(): Modal {
    return { type: "trimix", options: [], mixDepth: 60 + Math.floor(Math.random() * 61), mixO2: 21, mixHe: 0 };
  }

  function trimixCommit() {
    const s = g.current;
    const m = s.modal;
    if (!m || m.mixDepth === undefined) return;
    const amb = m.mixDepth / 10 + 1;
    const o2 = (m.mixO2 ?? 21) / 100;
    const n2 = (100 - (m.mixO2 ?? 21) - (m.mixHe ?? 0)) / 100;
    const ok = o2 * amb >= 0.18 && o2 * amb <= 1.4 && n2 * amb <= 4;
    if (!ok) {
      m.wrongId = "tank";
      m.wrongAt = Date.now();
      return;
    }
    if (m.practice) {
      const prog = (m.prog ?? 0) + 1;
      if (prog >= REQUIRED) s.modal = null;
      else s.modal = { ...newMix(), okAt: Date.now(), mixO2: m.mixO2 ?? 21, mixHe: m.mixHe ?? 0, practice: true, prog };
      return;
    }
    s.progress += 1;
    if (s.progress >= REQUIRED) finishTraining();
    else s.modal = { ...newMix(), okAt: Date.now(), mixO2: m.mixO2 ?? 21, mixHe: m.mixHe ?? 0 };
  }

  function skipStep() {
    const s = g.current;
    s.cheated = true;
    s.modal = null;
    const p = s.phase;
    if (p === "beach") return enterWater();
    if (TRAIN_PHASES.includes(p)) return finishTraining();
    if (p === "swimLaps") {
      award("Surface Swimmer");
      return setPhase("breathTrain");
    }
    if (p === "diveBasic") {
      s.breathLocked = true;
      award("Breath Hold");
      return setPhase("findMask");
    }
    if (p === "finDives") return setPhase("findKey");
    if (p === "deepDives" || p === "deep40" || p === "sportech") {
      s.dives = need(p) - 1;
      if (p === "deep40" && !s.hasComputer) {
        s.hasComputer = true;
        award("Dive Computer");
      }
      return creditDive();
    }
    const mk = (tag: Tag, x: number, wreck?: Tag) => {
      const k: Knot = { id: s.seq++, x, d: bedDepth(x, s.worldW) - 1, tag, ...(wreck ? { wreck } : {}) };
      s.knots = [...s.knots, k];
      return k;
    };
    if (p === "wrecks") {
      const a = mk("w1", 39.8);
      const b = mk("w2", 48.5);
      s.segs = [...s.segs, { id: s.seq++, a: a.id, b: b.id }];
      award("Wreck Line");
      return setPhase("liftBag");
    }
    if (p === "liftBag") {
      const a = mk("w2", 50);
      const b = mk("bag", 50, "w2");
      b.d = a.d - 3;
      s.segs = [...s.segs, { id: s.seq++, a: a.id, b: b.id }];
      s.items = s.items.filter((i) => i !== "liftbag");
      spawnPickup("liftbag");
      award("Lift Bag Tied");
      return setPhase("trimixTrain");
    }
    if (p === "deepWreck") {
      const a = mk("w2deep", 69);
      const b = mk("w3", 78);
      s.segs = [...s.segs, { id: s.seq++, a: a.id, b: b.id }];
      award("Deep Wreck");
      s.reel2Pending = true;
      return setPhase("allDone");
    }
    if (p === "allDone") {
      const r = s.pickups.find((o) => o.kind === "reel2");
      if (r) collectPickup(r);
      else {
        s.reelCap = 160;
        setPhase("dive170");
      }
      return;
    }
    if (p === "dive170") return unlockAbyss();
    if (p === "wreck4") {
      const a = mk("w3", 80);
      const b = mk("w4", W4.x0 + 2);
      s.segs = [...s.segs, { id: s.seq++, a: a.id, b: b.id }];
      award("Abyss Wreck");
      spawnReel4();
      return setPhase("caves");
    }
    if (p === "caves") {
      const r = s.pickups.find((o) => o.kind === "reel3");
      if (r) collectPickup(r);
      s.cave.reel = s.cave.dry = s.cave.through = true;
      return checkCave1();
    }
    if (p === "gearHunt" || p === "findTechGear") {
      const first = s.objects[0];
      if (first) collectHunt(first);
      return;
    }
    if (s.object) collect(s.object);
  }

  // --- render ---
  const s = g.current;
  const now = Date.now();
  const camX = Math.max(0, Math.min(s.worldW - viewW, s.x - viewW / 2));
  const camY = Math.max(-SURFACE_MARGIN, s.depth - VIEW_H * 0.45);
  const fuzzy = s.depth > 0.6 && !s.hasMask;
  const submerged = s.depth > 0.4;
  const trainAvailable =
    s.inWater && s.depth < 0.6 && TRAIN_PHASES.includes(s.phase) && !s.modal;
  const breathButtons =
    s.inWater &&
    !s.breathLocked &&
    !s.modal &&
    ["earTrain", "diveBasic"].includes(s.phase);
  const canDeploy =
    s.hasKit &&
    s.inWater &&
    s.dsmbLine === null &&
    ["dsmb", "spool", "knife"].every((k) => s.items.includes(k as GearKind));

  const extras: Extra[] = [];
  if (s.hasMask) extras.push("mask");
  if (s.hasFins) extras.push(s.items.includes("techFins") ? "techFins" : "fins");
  if (s.hasKit) {
    extras.push("vest");
    if (!noAir(s)) extras.push("reg");
    if ((s.tanks[0]?.size ?? 0) > 0) {
      if (s.twinset) extras.push("twin", "manifold", "iso", "longhose");
      else extras.push("tank");
    }
    if ((s.tanks[1]?.size ?? 0) > 0 && !s.tanks[1]?.empty) extras.push("tank2");
    if ((s.tanks[2]?.size ?? 0) > 0 && !s.tanks[2]?.empty) extras.push("tank3");
  }
  if (submerged && s.breathHeldAt) extras.push("puff");
  const diverSpec: AnimSpec = {
    legs: !s.inWater ? "still" : s.progress > 0 || s.phase !== "swimTrain" ? "flutter" : "bicycle",
    arms: !s.inWater ? "still" : s.hasFins ? "still" : "breast",
    extra: extras,
  };

  const bedFn = (x: number) => bedDepth(x, s.worldW);
  const deepWorld = s.worldW >= START_WORLD * 3;
  const logbookUnlocked = s.badges.includes("SporTechnical Diver");
  const nearLine = s.inWater && s.badges.includes("Stage") && !!nearSeg(s.x, s.depth, 2);
  const reelKnot = s.reel ? knot(s.reel.last) : null;
  // shared pool under the hood, but shown as two separate counters
  const lineLeftM = lineAvail();
  const spoolCapM = s.items.includes("spool") ? 20 : 0;
  // reels pay out first, the finger spool is the last reserve
  const spoolLeftM = Math.max(0, Math.min(spoolCapM, lineLeftM));
  const reelLeftM = Math.max(0, lineLeftM - spoolCapM);

  const torchPct = TORCH[s.torch.lvl] ? Math.max(0, 1 - s.torch.used / TORCH[s.torch.lvl]!.min) * 100 : 0;
  const dpvPct = DPV[s.dpv.lvl] ? Math.max(0, 1 - s.dpv.used / DPV[s.dpv.lvl]!.min) * 100 : 0;
  const light = s.cave.inside ? 1 : Math.min(1, s.depth / 150);
  const sx = ((s.x - camX) / viewW) * 100;
  const sy = ((s.depth - camY) / VIEW_H) * 100;
  const curTank = s.tanks[s.active];
  const ppO2 = (curTank?.o2 ?? 0.21) * (s.depth / 10 + 1);
  const ppN2 = (1 - (curTank?.o2 ?? 0.21) - (curTank?.he ?? 0)) * (s.depth / 10 + 1);
  // breathing gas density (g/L): only shown once Trimix blending is unlocked
  const gasDens =
    (s.depth / 10 + 1) *
    ((curTank?.o2 ?? 0.21) * 1.429 +
      (1 - (curTank?.o2 ?? 0.21) - (curTank?.he ?? 0)) * 1.25 +
      (curTank?.he ?? 0) * 0.179);


  const bedLine = `M ${BED(s.worldW).map(([x, y]) => `${x} ${y}`).join(" L ")}`;
  const seabed = `${bedLine} L ${s.worldW + 10} 240 L -10 240 Z`;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-sea-deep font-body select-none">
      <svg
        viewBox={`${camX} ${camY} ${viewW} ${VIEW_H}`}
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-sky)" />
            <stop offset="100%" stopColor="var(--color-sky-low)" />
          </linearGradient>
          <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-sea-shallow)" />
            <stop offset="45%" stopColor="var(--color-sea-mid)" />
            <stop offset="100%" stopColor="var(--color-sea-deep)" />
          </linearGradient>
          <linearGradient id="bedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-sand)" />
            <stop offset="18%" stopColor="var(--color-sand-dark)" />
            <stop offset="55%" stopColor="var(--color-rock)" />
            <stop offset="100%" stopColor="var(--color-rock-dark)" />
          </linearGradient>
          <filter id="blurScene">
            <feGaussianBlur stdDeviation="0.09" />
          </filter>
        </defs>

        <rect x={-10} y={-SURFACE_MARGIN - 1} width={s.worldW + 20} height={SURFACE_MARGIN + 1} fill="url(#skyGrad)" />
        <circle cx={camX + viewW * 0.16} cy={-2} r={0.9} fill="var(--color-sun)" />
        {s.cheated &&
          Array.from({ length: Math.ceil(s.worldW / 7) }).map((_, i) => (
            <text
              key={i}
              x={3 + i * 7}
              y={-2.4 + ((i * 53) % 3) * 0.7}
              fontSize={0.7}
              fontWeight={900}
              fill="var(--color-alert)"
              transform={`rotate(${((i * 37) % 20) - 10}, ${3 + i * 7}, -2)`}
            >
              CHEATER
            </text>
          ))}

        <g filter={fuzzy ? "url(#blurScene)" : undefined}>
          <rect x={-10} y={0} width={s.worldW + 20} height={240} fill="url(#seaGrad)" />
          {/* beach */}
          <path
            d={`M -10 ${-SURFACE_MARGIN} L ${BEACH_END + 1.4} ${-SURFACE_MARGIN} L ${BEACH_END + 1.4} 0 L ${BEACH_END - 1.4} 1.2 L -10 1.2 Z`}
            fill="var(--color-sand)"
          />
          <rect x={-10} y={-0.35} width={BEACH_END + 1.2} height={0.35} fill="var(--color-sand-dark)" opacity={0.5} />
          {/* seabed: sand crust over silt and bedrock */}
          <path d={seabed} fill="url(#bedGrad)" opacity={0.95} />
          <path d={bedLine} stroke="var(--color-sand)" strokeWidth={0.55} fill="none" opacity={0.75} />
          <path d={bedLine} stroke="var(--color-silt)" strokeWidth={0.18} fill="none" opacity={0.6} />
          {/* rock ledges and boulders stepping down the wall */}
          {Array.from({ length: Math.ceil(s.worldW / 11) }).map((_, i) => {
            const bx = 6 + i * 11 + ((i * 29) % 5) * 0.8;
            if (bx > s.worldW) return null;
            const by = bedDepth(bx, s.worldW);
            const w = 1.4 + ((i * 17) % 4) * 0.5;
            return (
              <path
                key={`rk${i}`}
                d={`M ${bx - w} ${by + 0.3} Q ${bx - w * 0.6} ${by - 0.9} ${bx} ${by - 0.75} Q ${bx + w * 0.7} ${by - 1} ${bx + w} ${by + 0.3} Z`}
                fill={i % 2 ? "var(--color-rock)" : "var(--color-rock-dark)"}
                opacity={0.5}
              />
            );
          })}
          {/* pebble and shell scatter on the sand */}
          {Array.from({ length: 90 }).map((_, i) => {
            const px = 4 + i * 2.1 + ((i * 31) % 7) * 0.3;
            if (px > s.worldW) return null;
            const py = bedDepth(px, s.worldW) - 0.08;
            return (
              <ellipse
                key={`pb${i}`}
                cx={px}
                cy={py}
                rx={0.1 + ((i * 13) % 3) * 0.05}
                ry={0.05 + ((i * 7) % 3) * 0.02}
                fill={i % 3 === 0 ? "var(--color-foam)" : "var(--color-rock)"}
                opacity={0.4}
              />
            );
          })}
          {/* shallow reef: fans, branching coral and kelp */}
          {Array.from({ length: 40 }).map((_, i) => {
            const cx = 10 + i * 4.3;
            const cy = 6 + ((i * 37) % 5) * 0.9;
            const v = (i * 7) % 3;
            return (
              <g key={i} transform={`translate(${cx}, ${cy})`} opacity={0.7}>
                {v === 0 && (
                  <g stroke="var(--color-coral-pink)" strokeWidth={0.1} fill="none" strokeLinecap="round">
                    <path d="M 0 0 L 0 -0.5" />
                    <path d="M 0 -0.5 q -0.6 -0.4 -0.75 -1.1 M 0 -0.5 q 0.6 -0.38 0.72 -1.05 M 0 -0.5 q -0.05 -0.7 0.04 -1.25" />
                    <path d="M -0.45 -1.1 q 0.45 -0.22 0.9 -0.02" strokeWidth={0.05} />
                  </g>
                )}
                {v === 1 && (
                  <g stroke="var(--color-gear)" strokeWidth={0.14} fill="none" strokeLinecap="round">
                    <path d="M 0 0 q 0.3 -1 0.9 -1.4 M 0 0 q -0.4 -0.9 -1 -1.2 M 0 0 q 0.05 -0.8 -0.1 -1.5" />
                    <ellipse cx={0} cy={0.05} rx={0.6} ry={0.14} fill="var(--color-sand)" stroke="none" opacity={0.5} />
                  </g>
                )}
                {v === 2 && (
                  <g stroke="var(--color-kelp)" strokeWidth={0.1} fill="none" strokeLinecap="round">
                    <path d="M 0 0 Q -0.4 -1.1 -0.15 -2.1" />
                    <path d="M 0.2 0 Q 0.55 -0.9 0.3 -1.7" strokeWidth={0.08} />
                    <ellipse cx={-0.3} cy={-0.35} rx={0.5} ry={0.3} fill="var(--color-coral-violet)" stroke="none" opacity={0.4} />
                  </g>
                )}
              </g>
            );
          })}

          {/* the wall: corals, anchors, skeletons */}
          <WallDecor from={START_WORLD + 1} to={s.worldW} bed={bedFn} />
          {deepWorld && <WreckArt span={W1} bed={bedFn} />}
          {deepWorld && wreck2Visible() && <WreckArt span={W2} bed={bedFn} />}
          {deepWorld && wreck3Visible() && <WreckArt span={W3} bed={bedFn} />}
          {wreck4Visible() && <WreckArt span={W4} bed={bedFn} />}
          {/* flooded caves + the far beach */}
          {farBeach(s.worldW) && (
            <>
              <CaveArt light={s.cave.inside && s.torch.on ? { x: s.x, d: s.depth } : null} />
              <path
                d={`M ${s.worldW + 10} ${-SURFACE_MARGIN} L ${R_BEACH - 1.4} ${-SURFACE_MARGIN} L ${R_BEACH - 1.4} 0 L ${R_BEACH + 1.4} 1.2 L ${s.worldW + 10} 1.2 Z`}
                fill="var(--color-sand)"
              />
              <rect x={R_BEACH - 1.2} y={-0.35} width={s.worldW - R_BEACH + 12} height={0.35} fill="var(--color-sand-dark)" opacity={0.5} />
            </>
          )}

          {/* tied lines, knots, lift bags */}
          {s.segs.map((sg) => {
            if (sg.hidden) return null;
            const a = knot(sg.a);
            const b = knot(sg.b);
            if (!a || !b) return null;
            return (
              <polyline
                key={sg.id}
                points={ptsStr(bent(a.x, a.d, b.x, b.d, s.worldW))}
                stroke="var(--color-foam)"
                strokeWidth={0.06}
                fill="none"
              />
            );
          })}
          {reelKnot && (
            <polyline
              points={ptsStr(bent(reelKnot.x, reelKnot.d, s.x, s.depth - 0.2, s.worldW))}
              stroke="var(--color-foam)"
              strokeWidth={0.06}
              strokeDasharray="0.3 0.15"
              fill="none"
            />
          )}
          {s.knots.map((k) =>
            k.tag === "bag" ? (
              <g key={k.id} transform={`translate(${k.x}, ${k.d - 0.9}) scale(0.9)`}>
                <GearIcon kind="liftbag" />
              </g>
            ) : (
              <circle key={k.id} cx={k.x} cy={k.d} r={0.14} fill="var(--color-badge)" />
            ),
          )}
          {s.staged.map((st, i) => (
            <g key={i} onClick={() => collectStaged(st)} style={{ cursor: "pointer" }}>
              <g transform={`translate(${st.x}, ${st.d + 0.5}) rotate(90) scale(0.7)`}>
                <GearIcon kind="tank2" />
              </g>
              <text
                x={st.x}
                y={st.d + 1.55}
                textAnchor="middle"
                fontSize={0.3}
                fontWeight={700}
                fill="var(--color-foam)"
              >
                {Math.round(st.tank.bar)} bar · {mixLabel(st.tank)}
              </text>
            </g>
          ))}
          {s.pickups.map((o, i) => (
            <g key={`p${i}`} transform={`translate(${o.x}, ${o.depth})`}>
              <circle r={1.1} fill="var(--color-foam)" opacity={0.25} className="anim-glow" />
              <GearIcon kind={o.kind as GearKind} />
            </g>
          ))}

          {/* sand clouds */}
          {s.sand.map((p, i) => {
            const age = (now - p.at) / 1000;
            return (
              <circle
                key={i}
                cx={p.x}
                cy={p.y - 0.8 + age * 0.13}
                r={0.25 + age * 0.12}
                fill="var(--color-sand)"
                opacity={Math.max(0, 0.55 - age * 0.09)}
              />
            );
          })}

          {/* deployed ascent line */}
          {s.dsmbLine !== null && (
            <g>
              <line
                x1={s.x}
                y1={s.depth - 0.2}
                x2={s.x}
                y2={0}
                stroke="var(--color-alert)"
                strokeWidth={0.08}
              />
              <g transform={`translate(${s.x}, -0.9) scale(0.9)`}>
                <GearIcon kind="dsmb" />
              </g>
            </g>
          )}

          {/* surface marker once the DSMB is owned */}
          {s.items.includes("dsmb") && s.inWater && s.depth < 0.4 && (
            <g transform={`translate(${s.x + 0.9}, -0.7) scale(0.7)`}>
              <GearIcon kind="dsmb" />
            </g>
          )}

          {/* world object */}
          {s.object && (
            <g transform={`translate(${s.object.x}, ${s.object.depth})`}>
              <circle r={1.1} fill="var(--color-foam)" opacity={0.3} className="anim-glow" />
              {s.object.kind === "locker" ? (
                <rect x={-0.9} y={-1.4} width={1.8} height={2.4} rx={0.2} fill="var(--color-gear)" />
              ) : s.object.kind === "key" ? (
                <path
                  d="M -0.5 0 a 0.35 0.35 0 1 1 0.7 0 L 0.8 0 L 0.8 0.3 L 0.55 0.3 L 0.55 0"
                  fill="var(--color-badge)"
                />
              ) : s.object.kind === "mask" ? (
                <rect x={-0.6} y={-0.3} width={1.2} height={0.6} rx={0.2} fill="var(--color-sea-shallow)" />
              ) : s.object.kind === "fins" ? (
                <>
                  <ellipse cx={-0.35} cy={0} rx={0.22} ry={0.6} fill="var(--color-gear)" />
                  <ellipse cx={0.35} cy={0} rx={0.22} ry={0.6} fill="var(--color-gear)" />
                </>
              ) : (
                <GearIcon kind={s.object.kind as GearKind} />
              )}
            </g>
          )}

          {/* hunt objects */}
          {s.objects.map((o) => {
            const big = s.hover === o.kind;
            return (
              <g
                key={o.kind}
                transform={`translate(${o.x}, ${o.depth}) scale(${big ? 2 : 1})`}
                onMouseEnter={() => {
                  g.current.hover = o.kind;
                }}
                onMouseLeave={() => {
                  g.current.hover = null;
                }}
                style={{ cursor: "pointer" }}
              >
                <circle r={1.1} fill="var(--color-foam)" opacity={0.25} className="anim-glow" />
                <GearIcon kind={o.kind as GearKind} />
                {big && (
                  <text
                    y={1.6}
                    textAnchor="middle"
                    fontSize={0.5}
                    fill="var(--color-foam)"
                  >
                    {GEAR_NAMES[o.kind as GearKind]}
                  </text>
                )}
              </g>
            );
          })}

          {/* diver */}
          <g
            transform={`translate(${s.x}, ${s.depth - (s.inWater ? 0.55 : 1.7)}) scale(${s.facing}, 1)`}
          >
            <g transform="translate(-0.57, 0)">
              <DiverAnim spec={diverSpec} size={1.7} horizontal={s.inWater} />
            </g>
            {s.dpv.on && s.inWater && (
              <g transform="translate(1.15, 0.82) scale(-0.55, 0.55)">
                <GearIcon kind={s.dpv.lvl >= 3 ? "dpv3" : s.dpv.lvl >= 2 ? "dpv2" : "dpv"} />
              </g>
            )}
          </g>
        </g>
      </svg>

      {/* depth darkening */}
      <div
        className="pointer-events-none absolute inset-0 bg-sea-deep transition-opacity duration-300"
        style={
          s.torch.on
            ? {
                opacity: light,
                backgroundColor: "transparent",
                backgroundImage: `radial-gradient(circle at ${sx}% ${sy}%, transparent 0, transparent 8vmin, var(--color-sea-deep) 20vmin)`,
              }
            : { opacity: light }
        }
      />

      {/* badges */}
      <div className="absolute left-4 top-4 flex max-w-[60vw] flex-wrap gap-2">
        {s.badges.map((b) => {
          const can = !!practiceFor(b);
          return (
            <button
              key={b}
              type="button"
              disabled={!can}
              onClick={() => openPractice(b)}
              className={`rounded-full bg-badge/90 px-3 py-1 text-xs font-semibold text-sea-deep shadow-lg ${
                can ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"
              }`}
            >
              {b}
            </button>
          );
        })}
      </div>

      {/* cheat mode + explore mode */}
      <div className="absolute left-1/2 top-3 flex -translate-x-1/2 items-center gap-2">
        <button
          type="button"
          onClick={() => {
            g.current.cheat = !g.current.cheat;
            if (g.current.cheat) g.current.cheated = true;
          }}
          className="rounded-full bg-alert/80 px-4 py-1 text-xs font-bold text-foam"
        >
          Cheat
        </button>
        {s.badges.includes("Abyss Wreck") && (
          <button
            type="button"
            onClick={() => {
              g.current.explore = !g.current.explore;
            }}
            className={
              s.explore
                ? "rounded-full bg-badge px-4 py-1 text-xs font-bold text-sea-deep ring-2 ring-foam/70"
                : "rounded-full bg-badge/40 px-4 py-1 text-xs font-bold text-foam"
            }
          >
            {s.explore ? "Explore: ON" : "Explore"}
          </button>
        )}
      </div>
      {s.cheat && (
        <div className="absolute left-1/2 top-12 w-[min(90vw,28rem)] -translate-x-1/2 rounded-2xl bg-sea-deep/90 p-4 text-sm text-foam shadow-2xl ring-1 ring-alert/60">
          <p>{HINTS[s.phase] ?? "Keep exploring."}</p>
          <button
            type="button"
            onClick={skipStep}
            className="mt-3 rounded-full bg-alert px-4 py-1.5 text-xs font-bold text-foam"
          >
            Skip next step
          </button>
        </div>
      )}

      {/* gauges */}
      {(s.hasDepthGauge || s.hasPressureGauge || s.hasTimer) && (
        <div className="absolute right-4 top-4 flex items-start gap-3">
          {s.hasDepthGauge && (
            <div className="rounded-2xl bg-sea-deep/80 px-4 py-2 text-center shadow-xl ring-1 ring-foam/20">
              <div className="font-display text-2xl font-bold text-foam">
                {s.depth.toFixed(1)}
              </div>
              <div className="text-[10px] tracking-widest text-foam/60">M</div>
            </div>
          )}
          {s.hasTimer && (
            <div className="rounded-2xl bg-sea-deep/80 px-4 py-2 text-center shadow-xl ring-1 ring-foam/20">
              <div className="font-display text-2xl font-bold text-foam">{fmt(s.timerMs)}</div>
              <div className="text-[10px] tracking-widest text-foam/60">MIN</div>
            </div>
          )}
          {s.hasComputer && (
            <div className="rounded-2xl bg-sea-deep/80 px-4 py-2 text-center shadow-xl ring-1 ring-badge/60">
              {s.comp.ceil > 0 ? (
                <>
                  <div className="font-display text-2xl font-bold text-alert">{s.comp.ceil}</div>
                  <div className="text-[10px] tracking-widest text-foam/60">CEIL M</div>
                </>
              ) : (
                <>
                  <div className="font-display text-2xl font-bold text-foam">{s.comp.ndt}</div>
                  <div className="text-[10px] tracking-widest text-foam/60">NDT MIN</div>
                </>
              )}
              <div className="mt-1 text-xs font-semibold text-foam">TTS {s.comp.tts}</div>
              {s.trimix && (
                <div className="mt-1 text-[10px] font-semibold text-foam">
                  PO2 {ppO2.toFixed(2)} ·{" "}
                  <span className={ppN2 > 6 ? "text-alert" : ""}>PN2 {ppN2.toFixed(1)}</span>
                </div>
              )}
              {s.trimix && (
                <div
                  className={`mt-0.5 text-[10px] font-semibold ${
                    gasDens > 6 ? "animate-pulse text-alert" : gasDens > 5.2 ? "text-sun" : "text-sea-shallow"
                  }`}
                >
                  DENS {gasDens.toFixed(1)} g/L
                </div>
              )}

            </div>
          )}
          {s.hasPressureGauge &&
            s.tanks.map((t, i) => t.size <= 0 ? null : (
              <div key={i} className={`flex flex-col items-center gap-1 ${t.empty ? "opacity-30" : ""}`}>
              <button
                key={i}
                type="button"
                onPointerDown={() => {
                  g.current.holdTank = { i, at: g.current.clock };
                }}
                onPointerUp={() => {
                  g.current.holdTank = null;
                }}
                onPointerLeave={() => {
                  g.current.holdTank = null;
                }}
                className={`rounded-2xl px-4 py-2 text-center shadow-xl ring-1 ${
                  s.active === i ? "bg-badge/90 ring-badge" : "bg-sea-deep/80 ring-foam/20"
                }`}
              >
                <div
                  className={`font-display text-2xl font-bold ${
                    s.active === i ? "text-sea-deep" : "text-foam"
                  }`}
                >
                  {Math.round(t.bar)}
                </div>
                <div
                  className={`text-[10px] tracking-widest ${
                    s.active === i ? "text-sea-deep/70" : "text-foam/60"
                  }`}
                >
                  BAR {Math.round(t.o2 * 100)}%{(t.he ?? 0) > 0 ? `/${Math.round((t.he ?? 0) * 100)}` : ""} · {t.size}L
                </div>
              </button>
              {i > 0 && nearLine && !t.empty && (
                <button
                  type="button"
                  onClick={() => stageTank(i)}
                  className="rounded-full bg-foam/90 p-1 shadow"
                >
                  <svg viewBox="0 0 150 150" className="h-6 w-6">
                    <path d="M 0 60 H 150" stroke="var(--color-sea-deep)" strokeWidth={10} />
                    <rect x={50} y={70} width={50} height={60} rx={20} fill="var(--color-gear)" />
                  </svg>
                </button>
              )}
              </div>
            ))}
        </div>
      )}

      {/* collected gear */}
      {s.items.some((it) => it !== "techFins") && (
        <div className="absolute bottom-4 left-4 flex gap-2">
          {s.items.filter((it) => it !== "techFins").map((it) => (
            <button
              key={it}
              type="button"
              onClick={() => {
                if (it === "dsmb" && canDeploy) deployDsmb();
                if (it === "knife") cutLine();
                if (it === "reel") reelClick();
                if (it === "liftbag") deployBag();
                if (it === "torch") toggleTorch();
                if (it === "dpv") toggleDpv();
              }}
              onMouseEnter={() => {
                g.current.hover = `hud-${it}`;
              }}
              onMouseLeave={() => {
                g.current.hover = null;
              }}
              className={`relative rounded-xl p-1 ring-1 transition-transform ${
                (it === "torch" && s.torch.on) || (it === "dpv" && s.dpv.on) || (it === "reel" && s.reel)
                  ? "bg-badge/60 ring-badge"
                  : "bg-foam/10 ring-foam/20"
              } ${
                s.hover === `hud-${it}` ? "scale-150" : ""
              }`}
            >
              {(it === "spool" || it === "reel") && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-foam">
                  {Math.round(it === "spool" ? spoolLeftM : reelLeftM)}m
                </span>
              )}

              {it === "torch" && (
                <span className={`absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold ${s.torch.flooded ? "text-alert" : "text-foam"}`}>
                  {Math.round(torchPct)}%
                </span>
              )}
              {it === "dpv" && (
                <span className={`absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold ${s.dpv.flooded ? "text-alert" : "text-foam"}`}>
                  {Math.round(dpvPct)}%
                </span>
              )}
              {it === "compass" && (
                <span
                  className="pointer-events-none absolute inset-0 flex items-center justify-center transition-transform"
                  style={{ transform: `rotate(${s.facing === 1 ? 90 : -90}deg)` }}
                />
              )}
              <svg
                viewBox="-1.2 -1.2 2.4 2.4"
                className="h-8 w-8"
                style={it === "compass" ? { transform: `rotate(${s.facing === 1 ? 90 : -90}deg)` } : undefined}
              >
                <GearIcon kind={it} />
              </svg>
              {s.hover === `hud-${it}` && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-sea-deep/90 px-2 py-0.5 text-[8px] text-foam">
                  {GEAR_NAMES[it]}
                  {it === "torch" && TORCH[s.torch.lvl] ? ` · rated ${TORCH[s.torch.lvl]!.depth} m` : ""}
                  {it === "dpv" && DPV[s.dpv.lvl] ? ` · rated ${DPV[s.dpv.lvl]!.depth} m` : ""}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* cylinder volume + gas fill on the beach */}
      {!s.inWater && s.tanks.length > 1 && (
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-6 rounded-2xl bg-sea-deep/85 px-6 py-4 text-center shadow-2xl ring-1 ring-foam/20">
          {s.tanks.map((t, i) => {
            const maxSize = i === 0 && s.twinset ? 25 : 12;
            const minSize = i === 0 && s.twinset ? 5 : 0;
            const o2Editable = i > 0 || s.anyO2;
            const he = Math.round((t.he ?? 0) * 100);
            return (
              <div key={i} className="flex flex-col items-center">
                <div className="font-display text-3xl font-bold text-foam">{t.size}L</div>
                <input
                  type="range"
                  min={minSize}
                  max={maxSize}
                  step={1}
                  value={t.size}
                  onChange={(e) => {
                    g.current.tanks[i]!.size = Number(e.target.value);
                  }}
                  className="mt-2 w-32 accent-badge"
                />
                {o2Editable && (
                  <>
                    <div className="mt-2 font-display text-xl font-bold text-badge">
                      {Math.round(t.o2 * 100)}%
                    </div>
                    <input
                      type="range"
                      min={s.trimix ? 5 : 21}
                      max={Math.min(s.anyO2 ? 99 : 50, 100 - he)}
                      step={1}
                      value={Math.round(t.o2 * 100)}
                      onChange={(e) => {
                        g.current.tanks[i]!.o2 = Number(e.target.value) / 100;
                      }}
                      className="mt-1 w-32 accent-badge"
                    />
                  </>
                )}
                {s.trimix && (
                  <>
                    <div className="mt-2 font-display text-xl font-bold text-sea-shallow">He {he}%</div>
                    <input
                      type="range"
                      min={0}
                      max={100 - Math.round(t.o2 * 100)}
                      step={1}
                      value={he}
                      onChange={(e) => {
                        g.current.tanks[i]!.he = Number(e.target.value) / 100;
                      }}
                      className="mt-1 w-32 accent-badge"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* logbook: after SporTechnical, beach only */}
      {logbookUnlocked && !s.inWater && !s.modal && (
        <button
          type="button"
          onClick={() => {
            g.current.logOpen = true;
          }}
          className="absolute bottom-4 right-4 rounded-2xl bg-foam/90 px-5 py-3 font-display font-bold text-sea-deep shadow-xl hover:scale-105"
        >
          Logbook
        </button>
      )}
      {logbookUnlocked && !s.inWater && s.logOpen && (
        <Logbook
          s={s}
          onClose={() => {
            g.current.logOpen = false;
          }}
        />
      )}

      {/* stop clock */}
      {s.stop && (
        <button
          type="button"
          onPointerDown={() => {
            g.current.ff = true;
          }}
          onPointerUp={() => {
            g.current.ff = false;
          }}
          onPointerLeave={() => {
            g.current.ff = false;
          }}
          className="absolute left-1/2 top-1/3 -translate-x-1/2 rounded-full bg-badge px-8 py-6 font-display text-4xl font-black text-sea-deep shadow-2xl active:scale-95"
        >
          {fmt(s.stop.left * 1000)}
        </button>
      )}

      {/* fast forward */}
      {s.hasKit && s.inWater && !s.stop && !s.modal && (
        <button
          type="button"
          onPointerDown={() => {
            g.current.ff = true;
          }}
          onPointerUp={() => {
            g.current.ff = false;
          }}
          onPointerLeave={() => {
            g.current.ff = false;
          }}
          className={`absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full px-6 py-3 font-display text-xl font-bold shadow-2xl ${
            s.ff ? "bg-badge text-sea-deep" : "bg-foam/90 text-sea-deep"
          }`}
        >
          ⏩
        </button>
      )}

      {/* train button */}
      {trainAvailable && (
        <button
          type="button"
          onClick={openTraining}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-foam px-8 py-3 font-display text-lg font-bold tracking-wide text-sea-deep shadow-2xl transition-transform hover:scale-105 active:scale-95"
        >
          Train
        </button>
      )}

      {/* breath buttons */}
      {breathButtons && (
        <div className="absolute bottom-8 right-6 flex gap-3">
          <button
            type="button"
            onClick={inhale}
            className="rounded-2xl bg-foam/90 px-5 py-3 font-display font-semibold text-sea-deep shadow-xl active:scale-95"
          >
            Inhale
          </button>
          <button
            type="button"
            onClick={exhale}
            className="rounded-2xl bg-sea-mid px-5 py-3 font-display font-semibold text-foam shadow-xl active:scale-95"
          >
            Exhale
          </button>
        </div>
      )}

      {/* held-breath marker */}
      {s.breathHeldAt && !s.modal && (
        <div className="pointer-events-none absolute bottom-24 right-8 h-3 w-3 rounded-full bg-badge anim-glow" />
      )}

      {/* fail flash */}
      {now - s.failAt < 700 && (
        <div className="pointer-events-none absolute inset-0 bg-alert anim-fail" key={s.failAt} />
      )}

      {/* badge celebration */}
      {s.badge && now - s.badge.at < 2600 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            key={s.badge.at}
            className="anim-badge rounded-3xl bg-badge px-10 py-6 text-center shadow-2xl"
          >
            <div className="font-display text-3xl font-black text-sea-deep">{s.badge.text}</div>
          </div>
        </div>
      )}

      {/* modal */}
      {s.modal && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-sea-deep/85 p-6 backdrop-blur-sm">
          <div className="flex gap-2">
            {Array.from({ length: REQUIRED }).map((_, i) => (
              <span
                key={i}
                className={`h-3 w-3 rounded-full ${
                  i < (s.modal!.practice ? (s.modal!.prog ?? 0) : s.modal!.type === "breath" ? s.breaths : s.progress)
                    ? "bg-badge"
                    : "bg-foam/25"
                }`}
              />
            ))}
          </div>
          {s.modal.type === "dpv" && (
            <div className="relative h-80 w-80">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <DiverAnim
                    spec={{ legs: "flutter", arms: "still", extra: ["mask", "fins", "vest", "twin"] }}
                    size={130}
                    horizontal
                  />
                  <svg viewBox="-1.2 -1.2 2.4 2.4" className="absolute -right-8 bottom-2 h-12 w-12">
                    <g transform="scale(-1, 1)">
                      <GearIcon kind="dpv" />
                    </g>
                  </svg>
                </div>
              </div>
              {(["up", "down", "left", "right"] as const).map((d) => {
                const green =
                  s.modal!.dpvHit?.includes(d) ||
                  ((d === "left" || d === "right") && now - (s.modal!.okAt ?? 0) < 400);
                const wrong = s.modal!.wrongId === d && now - (s.modal!.wrongAt ?? 0) < 400;
                const pos = {
                  up: "left-1/2 top-0 -translate-x-1/2",
                  down: "left-1/2 bottom-0 -translate-x-1/2 rotate-180",
                  left: "left-0 top-1/2 -translate-y-1/2 -rotate-90",
                  right: "right-0 top-1/2 -translate-y-1/2 rotate-90",
                }[d];
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => dpvClick(d)}
                    className={`absolute ${pos} ${wrong ? "anim-shake" : ""}`}
                  >
                    <svg viewBox="0 0 40 40" className="h-16 w-16">
                      <path d="M 20 4 L 36 30 L 4 30 Z" fill={green ? "var(--color-sea-shallow)" : "var(--color-alert)"} />
                    </svg>
                  </button>
                );
              })}
            </div>
          )}
          {s.modal.type === "trimix" && (
            <div className="flex flex-col items-center gap-5 text-foam">
              <div className="font-display text-5xl font-black">{s.modal.mixDepth} m</div>
              <div className="flex gap-10">
                {(["O2", "He"] as const).map((gas) => {
                  const m = s.modal!;
                  const val = gas === "O2" ? (m.mixO2 ?? 21) : (m.mixHe ?? 0);
                  const max = gas === "O2" ? 100 - (m.mixHe ?? 0) : 100 - (m.mixO2 ?? 21);
                  return (
                    <div key={gas} className="flex flex-col items-center">
                      <div className="font-display text-3xl font-bold">{val}%</div>
                      <input
                        type="range"
                        min={gas === "O2" ? 1 : 0}
                        max={max}
                        step={1}
                        value={val}
                        onChange={(e) => {
                          if (gas === "O2") m.mixO2 = Number(e.target.value);
                          else m.mixHe = Number(e.target.value);
                        }}
                        className="mt-2 w-40 accent-badge"
                      />
                      <div className="mt-1 text-xs tracking-widest text-foam/60">{gas}</div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={trimixCommit}
                className={`rounded-2xl bg-foam/10 p-3 ring-2 ${
                  s.modal.wrongId === "tank" && now - (s.modal.wrongAt ?? 0) < 400
                    ? "ring-alert anim-shake"
                    : "ring-foam/20"
                }`}
              >
                <svg viewBox="-1.2 -1.2 2.4 2.4" className="h-16 w-16">
                  <GearIcon kind="tank2" />
                </svg>
              </button>
            </div>
          )}
          {(s.modal.type === "anim" || s.modal.type === "breath") && (
          <div
            className={
              s.modal.type === "breath"
                ? "grid grid-cols-2 gap-6"
                : "grid grid-cols-3 gap-4 sm:gap-6"
            }
          >
            {s.modal.options.map((opt) => {
              const wrong = s.modal!.wrongId === opt.id && now - (s.modal!.wrongAt ?? 0) < 400;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() =>
                    s.modal!.type === "breath" ? breathClick(opt.id) : pickOption(opt)
                  }
                  className={`rounded-2xl bg-foam/10 p-2 ring-2 transition-colors hover:bg-foam/20 ${
                    wrong ? "ring-alert anim-shake" : "ring-foam/20"
                  } ${
                    s.modal!.type === "breath" && opt.id === "inhale" && s.modal!.inhaleAt
                      ? "ring-badge"
                      : ""
                  }`}
                >
                  {opt.stage ? (
                    <StageArt variant={opt.stage} size={150} />
                  ) : opt.valve ? (
                    <ValveArt variant={opt.valve} size={150} />
                  ) : opt.art ? (
                    <ManifoldArt variant={opt.art} size={150} />
                  ) : (
                    <DiverAnim spec={opt.spec} size={150} />
                  )}
                </button>
              );
            })}
          </div>
          )}
          <button
            type="button"
            onClick={() => {
              g.current.modal = null;
            }}
            className="rounded-full bg-foam/15 px-5 py-2 text-sm font-semibold text-foam"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
