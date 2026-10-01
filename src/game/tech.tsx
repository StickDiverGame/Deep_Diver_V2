// Wrecks, wall decorations and staging art for the technical diving stage.

export interface Span {
  x0: number;
  x1: number;
  h: number;
}

/** Wreck footprints along the wall (world x); depth follows the seabed. */
export const W1: Span = { x0: 38.9, x1: 40.8, h: 1.1 };
export const W2: Span = { x0: 47.5, x1: 70, h: 2.4 };
export const W3: Span = { x0: 76.4, x1: 84.7, h: 2.8 };
/** The fourth wreck lies along the flat 200 m bottom, right up to the far wall (x 272). */
export const W4: Span = { x0: 229, x1: 271.5, h: 3.2 };

export type StageVariant =
  | "onLine"
  | "onSand"
  | "floating"
  | "besideLine"
  | "upsideDown"
  | "onDiver"
  | "front"
  | "back"
  | "dangling"
  | "inHand"
  | "onHead"
  | "none";

export type WreckKind = "patrol" | "freighter" | "trawler" | "liner";

/** Which ship lies here: inferred from the footprint so callers need no extra wiring. */
function wreckKind(span: Span): WreckKind {
  if (span.x0 >= 200) return "liner";
  if (span.x0 >= 74) return "trawler";
  if (span.x0 >= 45) return "freighter";
  return "patrol";
}

/** Plating seams + rivet rows that read as riveted steel at any hull length. */
function Plating({ L, h }: { L: number; h: number }) {
  const seams = Math.max(3, Math.round(L / 2.2));
  const rows = [-h * 0.3, -h * 0.72, -h * 1.02];
  return (
    <g>
      {Array.from({ length: seams }).map((_, i) => {
        const x = (L * (i + 1)) / (seams + 1);
        return (
          <line
            key={`s${i}`}
            x1={x}
            y1={-h * 1.08}
            x2={x}
            y2={-h * 0.04}
            stroke="var(--color-hull-dark)"
            strokeWidth={0.05}
            opacity={0.55}
          />
        );
      })}
      {rows.map((y, r) => (
        <line
          key={`r${r}`}
          x1={L * 0.04}
          y1={y}
          x2={L * 0.96}
          y2={y - h * 0.04}
          stroke="var(--color-hull-light)"
          strokeWidth={0.04}
          opacity={0.4}
        />
      ))}
    </g>
  );
}

/** Rust bleeds weeping down the plating. */
function Rust({ L, h, n }: { L: number; h: number; n: number }) {
  return (
    <g stroke="var(--color-rust)" fill="none" opacity={0.45}>
      {Array.from({ length: n }).map((_, i) => {
        const x = L * 0.08 + ((L * 0.84) * (i + 0.5)) / n;
        const len = h * (0.35 + ((i * 17) % 5) * 0.11);
        return (
          <path
            key={i}
            d={`M ${x} ${-h * 0.95} q ${0.06} ${len * 0.5} ${-0.04} ${len}`}
            strokeWidth={0.07 + ((i * 7) % 3) * 0.02}
          />
        );
      })}
    </g>
  );
}

/** Soft growth colonising the deck line. */
function Growth({ L, h, tone }: { L: number; h: number; tone: string }) {
  const n = Math.max(4, Math.round(L / 1.6));
  return (
    <g fill={tone} opacity={0.5}>
      {Array.from({ length: n }).map((_, i) => {
        const x = L * 0.03 + ((L * 0.94) * (i + 0.5)) / n;
        const y = -h * (1.04 + ((i * 11) % 4) * 0.02);
        const r = 0.08 + ((i * 13) % 4) * 0.05;
        return <ellipse key={i} cx={x} cy={y} rx={r * 1.6} ry={r} />;
      })}
    </g>
  );
}

/** Rusted porthole row with dark glassless openings. */
function Portholes({ L, h, y, n }: { L: number; h: number; y: number; n: number }) {
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const x = L * 0.08 + ((L * 0.82) * (i + 0.5)) / n;
        const r = Math.min(0.2, h * 0.1);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={r * 1.35} fill="var(--color-rust)" opacity={0.6} />
            <circle cx={x} cy={y} r={r} fill="var(--color-sea-deep)" />
          </g>
        );
      })}
    </g>
  );
}

/** Draped anchor chain / ghost net falling away from the hull. */
function Chain({ x, y, len }: { x: number; y: number; len: number }) {
  const links = Math.max(4, Math.round(len / 0.22));
  return (
    <g>
      {Array.from({ length: links }).map((_, i) => {
        const t = i / links;
        return (
          <ellipse
            key={i}
            cx={x + Math.sin(t * 3) * 0.12 + t * 0.3}
            cy={y + t * len}
            rx={0.07}
            ry={0.1}
            fill="none"
            stroke="var(--color-hull-dark)"
            strokeWidth={0.05}
            opacity={0.8}
          />
        );
      })}
    </g>
  );
}

/**
 * A ship lying on its keel along the sloping wall: stern up-slope, bow pointing
 * down the wall. The footprint (x0, x1, h) and therefore every tie-off hitbox is
 * unchanged; only the artwork above the keel differs per ship class.
 */
export function WreckArt({ span, bed }: { span: Span; bed: (x: number) => number }) {
  const x0 = span.x0;
  const y0 = bed(span.x0);
  const x1 = span.x1;
  const y1 = bed(span.x1);
  const L = Math.hypot(x1 - x0, y1 - y0);
  const angle = Math.atan2(y1 - y0, x1 - x0);
  const ang = (angle * 180) / Math.PI;
  const h = span.h;
  const kind = wreckKind(span);
  // Move the rigid keel to a supporting line that never enters the wall. Where the
  // wall changes slope, either end of the ship can naturally overhang the sand.
  const supportSamples = Array.from({ length: 33 }, (_, i) => {
    const x = x0 + ((x1 - x0) * i) / 32;
    const y = bed(x);
    return -Math.sin(angle) * (x - x0) + Math.cos(angle) * (y - y0);
  });
  const supportY = y0 + Math.min(...supportSamples) / Math.cos(angle);
  // Local frame: x follows the keel and negative y points out into open water.
  // The keel is y=0, so no part of the hull is buried in the wall.
  const hull = `M 0 ${-h * 1.05} L ${L * 0.93} ${-h * 1.15} L ${L} ${-h * 1.3} Q ${L * 0.9} ${-h * 0.12} ${L * 0.72} 0 L ${L * 0.08} 0 Q 0 ${-h * 0.12} 0 ${-h * 1.05} Z`;
  const deck = `M 0 ${-h * 1.05} L ${L * 0.93} ${-h * 1.15} L ${L} ${-h * 1.3}`;
  const cabX = L * 0.12;
  const cabW = Math.max(h * 1.1, L * 0.16);
  return (
    <g transform={`translate(${x0}, ${supportY}) rotate(${ang})`}>
      {/* settled silt skirt where the hull meets the bottom */}
      <path
        d={`M ${-h * 0.2} 0 Q ${L * 0.5} ${h * 0.3} ${L + h * 0.2} 0 L ${L * 0.72} 0 L ${L * 0.08} 0 Z`}
        fill="var(--color-silt)"
        opacity={0.35}
      />
      <path d={hull} fill="var(--color-hull)" />
      {/* shaded lower hull */}
      <path
        d={`M ${L * 0.08} 0 L ${L * 0.72} 0 Q ${L * 0.9} ${-h * 0.12} ${L} ${-h * 1.3} L ${L * 0.95} ${-h * 0.5} L ${L * 0.06} ${-h * 0.42} Z`}
        fill="var(--color-hull-dark)"
        opacity={0.45}
      />
      <Plating L={L} h={h} />
      <Rust L={L} h={h} n={Math.max(3, Math.round(L / 2))} />
      <path d={deck} stroke="var(--color-hull-light)" strokeWidth={0.1} fill="none" opacity={0.7} />

      {kind === "patrol" && (
        <>
          {/* light cutter: open cockpit, bow pulpit, exposed screw */}
          <rect x={cabX} y={-h * 1.75} width={cabW * 0.9} height={h * 0.62} rx={0.1} fill="var(--color-hull-light)" opacity={0.9} />
          <rect x={cabX + cabW * 0.12} y={-h * 1.6} width={cabW * 0.6} height={h * 0.2} fill="var(--color-sea-deep)" opacity={0.75} />
          <path
            d={`M ${L * 0.86} ${-h * 1.18} q ${L * 0.1} ${-h * 0.1} ${L * 0.13} ${h * 0.12}`}
            stroke="var(--color-hull-light)"
            strokeWidth={0.07}
            fill="none"
          />
          <g stroke="var(--color-hull-light)" strokeWidth={0.05} opacity={0.75}>
            {Array.from({ length: Math.max(4, Math.round(L / 0.6)) }).map((_, i, arr) => {
              const x = L * 0.3 + ((L * 0.6) * i) / arr.length;
              return <line key={i} x1={x} y1={-h * 1.1} x2={x} y2={-h * 1.32} />;
            })}
            <path d={`M ${L * 0.3} ${-h * 1.32} L ${L * 0.9} ${-h * 1.42}`} />
          </g>
          <circle cx={L * 0.04} cy={-h * 0.4} r={h * 0.22} fill="var(--color-badge)" opacity={0.7} />
          <g stroke="var(--color-badge)" strokeWidth={0.06} opacity={0.8}>
            <path d={`M ${L * 0.04} ${-h * 0.4} l ${-h * 0.3} ${-h * 0.2} M ${L * 0.04} ${-h * 0.4} l ${h * 0.3} ${-h * 0.18} M ${L * 0.04} ${-h * 0.4} l ${-h * 0.05} ${h * 0.35}`} />
          </g>
          <Growth L={L} h={h} tone="var(--color-growth)" />
        </>
      )}

      {kind === "freighter" && (
        <>
          {/* cargo ship: open holds, derrick boom, wheelhouse */}
          {[0.34, 0.54, 0.72].map((t, i) => (
            <g key={i}>
              <rect x={L * t} y={-h * 1.22} width={L * 0.12} height={h * 0.3} fill="var(--color-sea-deep)" opacity={0.85} />
              <rect x={L * t} y={-h * 1.24} width={L * 0.12} height={h * 0.05} fill="var(--color-rust)" opacity={0.7} />
            </g>
          ))}
          <rect x={cabX} y={-h * 2.05} width={cabW} height={h * 0.98} fill="var(--color-hull-light)" opacity={0.9} />
          <rect x={cabX + cabW * 0.1} y={-h * 1.86} width={cabW * 0.8} height={h * 0.22} fill="var(--color-sea-deep)" opacity={0.8} />
          <rect x={cabX + cabW * 0.1} y={-h * 1.5} width={cabW * 0.8} height={h * 0.16} fill="var(--color-sea-deep)" opacity={0.6} />
          <rect x={cabX + cabW + h * 0.25} y={-h * 2.2} width={h * 0.45} height={h * 1.15} fill="var(--color-hull)" />
          <rect x={cabX + cabW + h * 0.25} y={-h * 2.2} width={h * 0.45} height={h * 0.16} fill="var(--color-hull-dark)" />
          {/* collapsed derrick boom across the deck */}
          <line x1={L * 0.46} y1={-h * 1.25} x2={L * 0.82} y2={-h * 1.95} stroke="var(--color-hull-light)" strokeWidth={0.12} />
          <line x1={L * 0.46} y1={-h * 1.25} x2={L * 0.46} y2={-h * 2.3} stroke="var(--color-hull)" strokeWidth={0.14} />
          <line x1={L * 0.46} y1={-h * 2.3} x2={L * 0.84} y2={-h * 1.98} stroke="var(--color-hull-dark)" strokeWidth={0.05} />
          {/* breached plating showing internal ribs */}
          <path d={`M ${L * 0.86} ${-h * 0.95} l ${h * 0.5} ${h * 0.25} l ${-h * 0.15} ${h * 0.4} l ${-h * 0.5} ${-h * 0.2} Z`} fill="var(--color-sea-deep)" opacity={0.85} />
          <g stroke="var(--color-hull-light)" strokeWidth={0.05} opacity={0.6}>
            <line x1={L * 0.89} y1={-h * 0.95} x2={L * 0.86} y2={-h * 0.35} />
            <line x1={L * 0.94} y1={-h * 0.88} x2={L * 0.91} y2={-h * 0.3} />
          </g>
          <Portholes L={L} h={h} y={-h * 0.62} n={Math.max(4, Math.round(L / 1.6))} />
          <Rust L={L} h={h * 1.4} n={4} />
          <Growth L={L} h={h} tone="var(--color-growth)" />
        </>
      )}

      {kind === "trawler" && (
        <>
          {/* steam trawler: funnel, boilers, rigging, spilled anchor chain */}
          <rect x={cabX} y={-h * 1.95} width={cabW} height={h * 0.9} fill="var(--color-hull-light)" opacity={0.88} />
          <rect x={cabX + cabW * 0.12} y={-h * 1.78} width={cabW * 0.76} height={h * 0.2} fill="var(--color-sea-deep)" opacity={0.8} />
          <g transform={`rotate(-12, ${cabX + cabW + h * 0.4}, ${-h * 1.05})`}>
            <rect x={cabX + cabW + h * 0.22} y={-h * 2.25} width={h * 0.48} height={h * 1.2} fill="var(--color-hull)" />
            <rect x={cabX + cabW + h * 0.18} y={-h * 2.32} width={h * 0.56} height={h * 0.14} rx={0.05} fill="var(--color-hull-dark)" />
          </g>
          {/* exposed steam boilers */}
          <g opacity={0.9}>
            <rect x={L * 0.42} y={-h * 1.5} width={h * 0.95} height={h * 0.5} rx={h * 0.25} fill="var(--color-hull-dark)" />
            <rect x={L * 0.42 + h * 1.05} y={-h * 1.42} width={h * 0.8} height={h * 0.42} rx={h * 0.21} fill="var(--color-hull-dark)" />
          </g>
          {/* leaning mast with ghost netting */}
          <line x1={L * 0.66} y1={-h * 1.12} x2={L * 0.66 + h * 0.75} y2={-h * 2.7} stroke="var(--color-hull)" strokeWidth={0.15} />
          <path
            d={`M ${L * 0.66 + h * 0.6} ${-h * 2.35} Q ${L * 0.66 + h * 0.2} ${-h * 1.7} ${L * 0.66 - h * 0.25} ${-h * 1.25}`}
            stroke="var(--color-foam)"
            strokeWidth={0.05}
            fill="none"
            opacity={0.45}
          />
          <path
            d={`M ${L * 0.66 + h * 0.68} ${-h * 2.5} Q ${L * 0.8} ${-h * 1.8} ${L * 0.9} ${-h * 1.15}`}
            stroke="var(--color-foam)"
            strokeWidth={0.05}
            fill="none"
            opacity={0.35}
          />
          <Chain x={L * 0.95} y={-h * 0.9} len={h * 1.5} />
          <Portholes L={L} h={h} y={-h * 0.66} n={Math.max(3, Math.round(L / 1.8))} />
          <Growth L={L} h={h} tone="var(--color-coral-violet)" />
        </>
      )}

      {kind === "liner" && (
        <>
          {/* abyssal liner: tiered superstructure, buckled plating, lattice mast */}
          <rect x={L * 0.1} y={-h * 2.0} width={L * 0.4} height={h * 0.95} fill="var(--color-hull-light)" opacity={0.85} />
          <rect x={L * 0.16} y={-h * 2.6} width={L * 0.26} height={h * 0.62} fill="var(--color-hull)" opacity={0.9} />
          <rect x={L * 0.22} y={-h * 3.0} width={L * 0.13} height={h * 0.42} fill="var(--color-hull-light)" opacity={0.8} />
          {[-1.9, -2.5, -2.92].map((y, r) => (
            <g key={r}>
              {Array.from({ length: 10 }).map((_, i) => (
                <rect
                  key={i}
                  x={L * (0.12 + r * 0.06) + i * L * 0.035}
                  y={h * y + h * 0.14}
                  width={L * 0.018}
                  height={h * 0.16}
                  fill="var(--color-sea-deep)"
                  opacity={0.75}
                />
              ))}
            </g>
          ))}
          {/* funnels */}
          {[0.54, 0.64].map((t, i) => (
            <g key={i}>
              <rect x={L * t} y={-h * 2.45} width={L * 0.045} height={h * 1.35} fill="var(--color-hull)" />
              <rect x={L * t} y={-h * 2.45} width={L * 0.045} height={h * 0.18} fill="var(--color-hull-dark)" />
            </g>
          ))}
          {/* collapsed lattice mast */}
          <g stroke="var(--color-hull-dark)" strokeWidth={0.1} fill="none" opacity={0.85}>
            <path d={`M ${L * 0.78} ${-h * 1.2} L ${L * 0.86} ${-h * 2.9}`} />
            <path d={`M ${L * 0.82} ${-h * 1.2} L ${L * 0.89} ${-h * 2.88}`} />
            {Array.from({ length: 6 }).map((_, i) => {
              const t = (i + 1) / 7;
              return (
                <line
                  key={i}
                  x1={L * 0.78 + (L * 0.08) * t}
                  y1={-h * (1.2 + 1.7 * t)}
                  x2={L * 0.82 + (L * 0.07) * t}
                  y2={-h * (1.2 + 1.68 * t)}
                  strokeWidth={0.05}
                />
              );
            })}
          </g>
          {/* buckled hull breach amidships */}
          <path
            d={`M ${L * 0.52} ${-h * 1.1} l ${L * 0.07} ${h * 0.35} l ${-L * 0.03} ${h * 0.5} l ${-L * 0.07} ${-h * 0.3} Z`}
            fill="var(--color-sea-deep)"
            opacity={0.9}
          />
          <Portholes L={L} h={h} y={-h * 0.8} n={Math.max(8, Math.round(L / 1.4))} />
          <Portholes L={L} h={h} y={-h * 0.48} n={Math.max(8, Math.round(L / 1.4))} />
          {/* heavy deep-sea sediment dusting the decks */}
          <path d={deck} stroke="var(--color-silt)" strokeWidth={0.18} fill="none" opacity={0.3} />
          <Chain x={L * 0.08} y={-h * 0.9} len={h * 1.8} />
          <Growth L={L} h={h} tone="var(--color-sponge)" />
        </>
      )}
    </g>
  );
}

/** Deterministic reef life, anchors, sponges and lost cargo along the wall. */
export function WallDecor({ from, to, bed }: { from: number; to: number; bed: (x: number) => number }) {
  const out = [];
  let i = 0;
  for (let x = from; x < to; x += 1.9 + ((i * 7) % 5) * 0.35, i++) {
    const y = bed(x) - 0.15;
    const d = bed(x);
    const deep = d > 45;
    const k = (i * 13) % 8;
    out.push(
      <g key={i} transform={`translate(${x}, ${y})`} opacity={deep ? 0.68 : 0.82}>
        {/* a rock ledge or boulder under most clusters */}
        {i % 3 === 0 && (
          <path
            d={`M ${-0.9} 0.2 Q ${-0.6} ${-0.45} 0 ${-0.38} Q 0.65 ${-0.5} 0.95 0.2 Z`}
            fill="var(--color-rock)"
            opacity={0.55}
          />
        )}

        {k === 0 &&
          (deep ? (
            // deep-water sea lily (crinoid)
            <g stroke="var(--color-coral-violet)" strokeWidth={0.07} fill="none">
              <path d="M 0 0 L 0.05 -0.9" />
              <path d="M 0.05 -0.9 q -0.35 -0.15 -0.5 -0.45 M 0.05 -0.9 q 0.35 -0.12 0.48 -0.42 M 0.05 -0.9 q -0.05 -0.3 0.02 -0.55" />
            </g>
          ) : (
            // gorgonian sea fan
            <g stroke="var(--color-coral-pink)" strokeWidth={0.07} fill="none">
              <path d="M 0 0 L 0 -0.45" />
              <path d="M 0 -0.45 q -0.5 -0.35 -0.62 -0.95 M 0 -0.45 q 0.5 -0.32 0.6 -0.92 M 0 -0.45 q -0.08 -0.6 0.02 -1.05" />
              <path d="M -0.38 -0.95 q 0.38 -0.2 0.78 -0.02 M -0.2 -1.3 q 0.25 -0.15 0.5 -0.02" strokeWidth={0.04} />
            </g>
          ))}

        {k === 1 && (
          // encrusted admiralty anchor with draped chain
          <g>
            <g stroke="var(--color-hull-dark)" strokeWidth={0.1} fill="none">
              <path d="M 0 -1 L 0 0 M -0.35 -0.75 L 0.35 -0.75 M -0.5 -0.25 Q 0 0.25 0.5 -0.25" />
              <circle cx={0} cy={-1.12} r={0.11} />
            </g>
            <g stroke="var(--color-rust)" strokeWidth={0.05} opacity={0.6} fill="none">
              <path d="M 0.04 -0.95 L 0.04 -0.2 M -0.3 -0.72 L 0.3 -0.72" />
            </g>
            <g stroke="var(--color-hull-dark)" strokeWidth={0.04} fill="none" opacity={0.7}>
              <path d="M 0.1 -1.1 q 0.5 0.1 0.72 0.6 q 0.1 0.3 0.05 0.55" />
            </g>
          </g>
        )}

        {k === 2 && (
          // old skeleton half-buried in silt
          <g fill="var(--color-foam)" opacity={0.6}>
            <circle cx={-0.5} cy={-0.2} r={0.2} />
            <circle cx={-0.56} cy={-0.24} r={0.05} fill="var(--color-sea-deep)" />
            <path d="M -0.3 -0.15 H 0.6 M -0.1 -0.3 V 0 M 0.1 -0.3 V 0 M 0.3 -0.3 V 0" stroke="var(--color-foam)" strokeWidth={0.06} />
            <ellipse cx={0.1} cy={0.06} rx={0.75} ry={0.14} fill="var(--color-silt)" opacity={0.7} />
          </g>
        )}

        {k === 3 &&
          (deep ? (
            // cluster of deep tube sponges
            <g fill="var(--color-sponge)" opacity={0.7}>
              <path d="M -0.35 0 q -0.1 -0.75 0.1 -0.95 q 0.22 0.2 0.12 0.95 Z" />
              <path d="M 0.05 0 q -0.12 -0.98 0.12 -1.2 q 0.26 0.24 0.12 1.2 Z" />
              <path d="M 0.42 0 q -0.08 -0.6 0.1 -0.76 q 0.2 0.16 0.08 0.76 Z" />
              <ellipse cx={0.17} cy={-1.18} rx={0.1} ry={0.05} fill="var(--color-sea-deep)" opacity={0.6} />
            </g>
          ) : (
            // brain / table coral mound
            <g>
              <ellipse cx={0} cy={-0.38} rx={0.5} ry={0.42} fill="var(--color-coral-pink)" opacity={0.6} />
              <g stroke="var(--color-sea-deep)" strokeWidth={0.04} fill="none" opacity={0.45}>
                <path d="M -0.35 -0.45 q 0.35 0.18 0.7 -0.05 M -0.3 -0.65 q 0.3 0.16 0.62 -0.04" />
              </g>
            </g>
          ))}

        {k === 4 && (
          // swaying kelp / soft whip corals
          <g stroke={deep ? "var(--color-coral-violet)" : "var(--color-kelp)"} strokeWidth={0.09} fill="none" strokeLinecap="round">
            <path d="M 0 0 Q -0.32 -0.7 -0.12 -1.45" />
            <path d="M 0.1 0 Q 0.38 -0.6 0.24 -1.2" />
            <path d="M -0.18 0 Q -0.05 -0.45 -0.3 -0.85" strokeWidth={0.06} />
          </g>
        )}

        {k === 5 && (
          // silted boulder shelf
          <g>
            <path d="M -0.7 0.1 Q -0.5 -0.5 0 -0.42 Q 0.55 -0.55 0.72 0.1 Z" fill="var(--color-rock-dark)" opacity={0.7} />
            <path d="M -0.4 -0.3 q 0.3 -0.12 0.6 0.02" stroke="var(--color-rock)" strokeWidth={0.05} fill="none" opacity={0.7} />
          </g>
        )}

        {k === 6 && (
          // lost cargo crate settled into the sand
          <g transform="rotate(-8)">
            <rect x={-0.42} y={-0.72} width={0.84} height={0.72} rx={0.05} fill="var(--color-hull)" opacity={0.85} />
            <path d="M -0.42 -0.45 H 0.42 M -0.1 -0.72 V 0 M 0.14 -0.72 V 0" stroke="var(--color-hull-dark)" strokeWidth={0.05} opacity={0.7} />
            <ellipse cx={0} cy={0.02} rx={0.55} ry={0.12} fill="var(--color-silt)" opacity={0.6} />
          </g>
        )}

        {k === 7 && (
          // toppled amphorae
          <g fill="var(--color-gear)" opacity={0.75}>
            <path d="M -0.55 -0.1 q -0.05 -0.35 0.25 -0.4 q 0.45 0.02 0.72 0.12 q 0.1 0.2 -0.1 0.34 Z" />
            <path d="M 0.42 -0.38 q 0.22 -0.04 0.3 0.1 q -0.1 0.1 -0.26 0.08 Z" />
            <ellipse cx={0} cy={0} rx={0.6} ry={0.1} fill="var(--color-silt)" opacity={0.6} />
          </g>
        )}
      </g>,
    );
  }
  return <g>{out}</g>;
}

function Tank({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rot})`}>
      <rect x={-14} y={-5} width={28} height={10} rx={5} fill="var(--color-gear)" />
      <rect x={14} y={-2} width={5} height={4} fill="var(--color-badge)" />
    </g>
  );
}

function Diver({ tank }: { tank: StageVariant }) {
  return (
    <g>
      <ellipse cx={75} cy={75} rx={34} ry={9} fill="var(--color-sea-mid)" />
      <circle cx={115} cy={73} r={9} fill="var(--color-foam)" />
      <rect x={30} y={70} width={14} height={4} fill="var(--color-gear)" />
      {tank === "front" && (
        <>
          <Tank x={78} y={90} />
          <path d="M 64 84 L 64 90 M 92 84 L 92 90" stroke="var(--color-foam)" strokeWidth={2} />
        </>
      )}
      {tank === "back" && <Tank x={72} y={60} />}
      {tank === "dangling" && (
        <>
          <path d="M 90 84 L 90 108" stroke="var(--color-foam)" strokeWidth={2} />
          <Tank x={90} y={116} rot={80} />
        </>
      )}
      {tank === "inHand" && <Tank x={132} y={96} rot={30} />}
      {tank === "onHead" && <Tank x={118} y={56} />}
    </g>
  );
}

export function StageArt({ variant, size = 150 }: { variant: StageVariant; size?: number }) {
  const line = <path d="M 0 60 H 150" stroke="var(--color-foam)" strokeWidth={1.5} />;
  const sand = <rect x={0} y={128} width={150} height={22} fill="var(--color-sand-dark)" />;
  return (
    <svg viewBox="0 0 150 150" width={size} height={size}>
      {sand}
      {["onLine", "besideLine", "upsideDown", "onSand", "floating"].includes(variant) && line}
      {variant === "onLine" && (
        <>
          <path d="M 70 60 L 70 70" stroke="var(--color-badge)" strokeWidth={3} />
          <Tank x={75} y={76} />
          <circle cx={70} cy={60} r={3} fill="var(--color-badge)" />
        </>
      )}
      {variant === "besideLine" && <Tank x={75} y={80} />}
      {variant === "upsideDown" && (
        <>
          <path d="M 70 60 L 70 70" stroke="var(--color-badge)" strokeWidth={3} />
          <Tank x={75} y={76} rot={180} />
        </>
      )}
      {variant === "onSand" && <Tank x={75} y={122} />}
      {variant === "floating" && <Tank x={75} y={22} rot={-20} />}
      {variant === "onDiver" && (
        <>
          <path d="M 0 40 H 150" stroke="var(--color-foam)" strokeWidth={1.5} />
          <Diver tank="back" />
        </>
      )}
      {["front", "back", "dangling", "inHand", "onHead", "none"].includes(variant) && <Diver tank={variant} />}
    </svg>
  );
}
