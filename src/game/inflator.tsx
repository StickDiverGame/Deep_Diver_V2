// Close-up K-style BCD power inflator for the inflator training mini-game.
import { useId } from "react";

export type InflatorVariant = "correct" | "d1" | "d2" | "noSleeve" | "swap" | "noCorr";

const DARK = "var(--color-hull-dark)";
const RUB = "var(--color-sea-deep)";
const RIB = "var(--color-hull)";

function Bubbles({ x, y, cls }: { x: number; y: number; cls: string }) {
  return (
    <g className={cls}>
      {[
        [0, 2, 0],
        [4, 1.5, 0.3],
        [-3, 2.4, 0.6],
        [2, 1.4, 0.9],
      ].map(([dx, r, dl], i) => (
        <circle key={i} cx={x + dx} cy={y} r={r} fill="var(--color-foam)" className="inf-rise" style={{ animationDelay: `${dl}s` }} />
      ))}
    </g>
  );
}

export function InflatorArt({ variant, size = 150 }: { variant: InflatorVariant; size?: number }) {
  const id = useId().replace(/:/g, "");
  const CH = `url(#chrome${id})`;
  const corr = variant !== "swap" && variant !== "noCorr";
  const corrPath = "M58 98 C58 118 40 128 4 142";
  const fin = variant === "noCorr" ? "M100 140 L100 61 L58 61 L58 104" : "M100 140 L100 61 L58 61 L58 100 C58 118 40 128 6 141";
  const fout = "M6 141 C40 128 58 118 58 100 L58 42 L91 22";
  return (
    <svg viewBox="0 0 160 150" width={size} height={(size * 150) / 160} className={`inf inf-${variant}`}>
      <defs>
        <linearGradient id={`chrome${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="var(--color-gear)" />
          <stop offset=".45" stopColor="var(--color-foam)" />
          <stop offset="1" stopColor="var(--color-gear)" />
        </linearGradient>
      </defs>
      {corr && (
        <>
          <path d={corrPath} stroke={DARK} strokeWidth={15} fill="none" />
          <path d={corrPath} stroke={RIB} strokeWidth={15} strokeDasharray="2 3" fill="none" />
        </>
      )}
      {variant === "swap" && (
        <>
          <path d="M100 150 L100 84" stroke={DARK} strokeWidth={15} />
          <path d="M100 150 L100 84" stroke={RIB} strokeWidth={15} strokeDasharray="2 3" />
          <path d="M58 150 L58 98" stroke={RUB} strokeWidth={5} />
          <rect x={53} y={94} width={10} height={12} fill={CH} />
        </>
      )}
      <rect x={46} y={88} width={24} height={12} rx={2} fill={RUB} />
      {variant === "noCorr" && <ellipse cx={58} cy={100} rx={10} ry={3} fill="var(--color-background)" />}
      <path d="M66 38 L86 18 L96 28 L68 50 Z" fill={RUB} />
      <ellipse cx={91} cy={23} rx={9} ry={4} transform="rotate(-45 91 23)" fill={RUB} stroke={DARK} />
      <rect x={48} y={28} width={20} height={62} rx={4} fill={DARK} />
      <rect x={66} y={54} width={46} height={14} rx={3} fill={DARK} />
      <rect className="inf-btnTop" x={51} y={15} width={14} height={14} rx={2} fill={CH} />
      <rect className="inf-btnR" x={112} y={55} width={12} height={12} rx={2} fill={CH} />
      <rect x={96} y={68} width={8} height={16} fill={CH} />
      <line x1={96} x2={104} y1={77} y2={77} stroke={DARK} strokeWidth={1.2} />
      {variant !== "swap" && (
        <>
          <g className="inf-lp">
            <path d="M100 160 L100 96" stroke={RUB} strokeWidth={6} />
            <rect x={95} y={80} width={10} height={18} rx={1} fill={CH} />
            <g className="inf-sleeve">
              <rect x={92.5} y={84} width={15} height={9} rx={1.5} fill={CH} stroke={DARK} strokeWidth={0.5} />
              {[94, 96, 98, 100, 102, 104, 106].map((x) => (
                <line key={x} x1={x} x2={x} y1={84.5} y2={92.5} stroke={DARK} strokeWidth={0.5} />
              ))}
            </g>
          </g>
          <circle className="inf-lock" cx={100} cy={84} r={9} fill="none" stroke="var(--color-badge)" strokeWidth={2} />
        </>
      )}
      <path className="inf-flowIn" d={fin} stroke="var(--color-badge)" strokeWidth={3} fill="none" strokeDasharray="5 6" strokeLinecap="round" />
      <path className="inf-flowOut" d={fout} stroke="var(--color-foam)" strokeWidth={3} fill="none" strokeDasharray="5 6" strokeLinecap="round" />
      <Bubbles x={95} y={16} cls="inf-bubOut" />
      {variant === "noCorr" && <Bubbles x={58} y={110} cls="inf-bubBottom" />}
      {variant === "noSleeve" && <Bubbles x={100} y={80} cls="inf-bubLeak" />}
    </svg>
  );
}
