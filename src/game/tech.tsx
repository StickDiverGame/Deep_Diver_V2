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

/** A ship lying on its keel along the sloping wall: stern up-slope, bow pointing down the wall. */
export function WreckArt({ span, bed }: { span: Span; bed: (x: number) => number }) {
  const x0 = span.x0;
  const y0 = bed(span.x0);
  const x1 = span.x1;
  const y1 = bed(span.x1);
  const L = Math.hypot(x1 - x0, y1 - y0);
  const angle = Math.atan2(y1 - y0, x1 - x0);
  const ang = (angle * 180) / Math.PI;
  const h = span.h;
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
  const cabX = L * 0.12;
  const cabW = Math.max(h * 1.1, L * 0.16);
  const ports = Array.from({ length: Math.max(3, Math.round(L / 1.2)) });
  return (
    <g transform={`translate(${x0}, ${supportY}) rotate(${ang})`}>
      <path d={hull} fill="var(--color-gear)" opacity={0.8} />
      {/* deck rail */}
      <path d={`M 0 ${-h * 1.05} L ${L * 0.93} ${-h * 1.15} L ${L} ${-h * 1.3}`} stroke="var(--color-alert)" strokeWidth={0.12} fill="none" opacity={0.55} />
      {/* rust stripe along the waterline */}
      <path d={`M ${L * 0.03} ${-h * 0.2} L ${L * 0.85} ${-h * 0.2}`} stroke="var(--color-alert)" strokeWidth={0.1} opacity={0.35} />
      {/* bridge + funnel */}
      <rect x={cabX} y={-h * 1.95} width={cabW} height={h * 0.92} fill="var(--color-gear)" opacity={0.85} />
      <rect x={cabX + cabW * 0.15} y={-h * 1.75} width={cabW * 0.7} height={h * 0.18} fill="var(--color-sea-deep)" opacity={0.7} />
      <rect x={cabX + cabW + h * 0.2} y={-h * 2.1} width={h * 0.4} height={h * 1.05} fill="var(--color-gear)" opacity={0.75} />
      {/* broken mast leaning forward */}
      <line x1={L * 0.6} y1={-h * 1.1} x2={L * 0.6 + h * 0.6} y2={-h * 2.6} stroke="var(--color-gear)" strokeWidth={0.16} />
      <line x1={L * 0.6 + h * 0.3} y1={-h * 1.9} x2={L * 0.6 + h * 0.9} y2={-h * 1.8} stroke="var(--color-gear)" strokeWidth={0.1} />
      {/* portholes */}
      {ports.map((_, i) => {
        const x = L * 0.08 + ((L * 0.8) * (i + 0.5)) / ports.length;
        return <circle key={i} cx={x} cy={-h * 0.62} r={Math.min(0.2, h * 0.1)} fill="var(--color-sea-deep)" />;
      })}
    </g>
  );
}

/** Deterministic corals, anchors and skeletons along the deep wall. */
export function WallDecor({ from, to, bed }: { from: number; to: number; bed: (x: number) => number }) {
  const out = [];
  let i = 0;
  for (let x = from; x < to; x += 1.9 + ((i * 7) % 5) * 0.35, i++) {
    const y = bed(x) - 0.15;
    const k = (i * 13) % 6;
    out.push(
      <g key={i} transform={`translate(${x}, ${y})`} opacity={0.75}>
        {k === 0 && (
          <g stroke="var(--color-alert)" strokeWidth={0.12} fill="none">
            <path d="M 0 0 L 0 -1.1 M 0 -0.5 L -0.4 -0.9 M 0 -0.7 L 0.45 -1.1" />
          </g>
        )}
        {k === 1 && (
          <g stroke="var(--color-gear)" strokeWidth={0.1} fill="none">
            <path d="M 0 -1 L 0 0 M -0.35 -0.75 L 0.35 -0.75 M -0.5 -0.25 Q 0 0.2 0.5 -0.25" />
            <circle cx={0} cy={-1.1} r={0.1} />
          </g>
        )}
        {k === 2 && (
          <g fill="var(--color-foam)" opacity={0.6}>
            <circle cx={-0.5} cy={-0.2} r={0.2} />
            <circle cx={-0.56} cy={-0.24} r={0.05} fill="var(--color-sea-deep)" />
            <path d="M -0.3 -0.15 H 0.6 M -0.1 -0.3 V 0 M 0.1 -0.3 V 0 M 0.3 -0.3 V 0" stroke="var(--color-foam)" strokeWidth={0.06} />
          </g>
        )}
        {k === 3 && <ellipse cx={0} cy={-0.4} rx={0.45} ry={0.5} fill="var(--color-badge)" opacity={0.55} />}
        {k === 4 && (
          <g stroke="var(--color-sea-shallow)" strokeWidth={0.1} fill="none">
            <path d="M 0 0 Q -0.3 -0.6 -0.1 -1.2 M 0 0 Q 0.3 -0.5 0.2 -1" />
          </g>
        )}
        {k === 5 && <ellipse cx={0} cy={-0.2} rx={0.6} ry={0.3} fill="var(--color-sand-dark)" />}
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
