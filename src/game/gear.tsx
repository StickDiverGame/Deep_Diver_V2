export type GearKind =
  | "depthGauge"
  | "pressureGauge"
  | "spareMask"
  | "knife"
  | "spool"
  | "dsmb"
  | "slate"
  | "tank2"
  | "tank3"
  | "twinset"
  | "computer"
  | "compass"
  | "torch"
  | "reel"
  | "dpv"
  | "liftbag"
  | "techFins"
  | "torch2"
  | "dpv2"
  | "torch3"
  | "dpv3"
  | "reel2"
  | "reel3"
  | "reel4";

export const GEAR_NAMES: Record<GearKind, string> = {
  depthGauge: "Depth Gauge",
  pressureGauge: "Pressure Gauge",
  spareMask: "Spare Mask",
  knife: "Line Cutter Knife",
  spool: "Finger Spool",
  dsmb: "DSMB",
  slate: "Writing Slate",
  tank2: "Second Cylinder",
  tank3: "Third Cylinder",
  twinset: "Twinset",
  computer: "Dive Computer",
  compass: "Compass",
  torch: "Torch",
  reel: "Reel",
  dpv: "DPV",
  liftbag: "Lift Bag",
  techFins: "Tech Fins",
  torch2: "Deep Torch",
  dpv2: "Deep DPV",
  torch3: "250 m Torch",
  dpv3: "250 m DPV",
  reel2: "Second Reel",
  reel3: "Cave Reel",
  reel4: "100 m Reel",
};

export const TECH_GEAR: GearKind[] = ["compass", "torch", "reel", "dpv", "liftbag", "techFins"];

export const HUNT_GEAR: GearKind[] = ["spareMask", "knife", "spool", "dsmb", "slate"];

/** Icon drawn inside a -1..1 box so it can be scaled freely. */
export function GearIcon({ kind }: { kind: GearKind }) {
  switch (kind) {
    case "depthGauge":
      return (
        <g>
          <circle r={0.85} fill="var(--color-gear)" />
          <circle r={0.62} fill="var(--color-sea-deep)" />
          <path d="M 0 0 L 0.34 -0.4" stroke="var(--color-foam)" strokeWidth={0.1} />
        </g>
      );
    case "pressureGauge":
      return (
        <g>
          <circle r={0.85} fill="var(--color-gear)" />
          <circle r={0.62} fill="var(--color-badge)" />
          <path d="M 0 0 L -0.3 -0.42" stroke="var(--color-sea-deep)" strokeWidth={0.1} />
        </g>
      );
    case "spareMask":
      return (
        <g>
          <rect x={-0.8} y={-0.4} width={1.6} height={0.8} rx={0.25} fill="var(--color-sea-shallow)" />
          <rect x={-0.9} y={-0.12} width={1.8} height={0.14} fill="var(--color-gear)" />
        </g>
      );
    case "knife":
      return (
        <g>
          <path d="M -0.7 0.5 L 0.3 -0.6 L 0.6 -0.3 L -0.4 0.7 Z" fill="var(--color-foam)" />
          <rect x={-0.85} y={0.45} width={0.35} height={0.35} rx={0.08} fill="var(--color-gear)" />
        </g>
      );
    case "spool":
      return (
        <g>
          <circle r={0.75} fill="none" stroke="var(--color-gear)" strokeWidth={0.22} />
          <circle r={0.25} fill="var(--color-badge)" />
        </g>
      );
    case "dsmb":
      return (
        <g>
          <rect x={-0.28} y={-1} width={0.56} height={1.55} rx={0.28} fill="var(--color-alert)" />
          <rect x={-0.28} y={-0.72} width={0.56} height={0.16} fill="var(--color-foam)" />
          <path d="M 0 0.55 L 0 0.95" stroke="var(--color-foam)" strokeWidth={0.08} />
        </g>
      );
    case "slate":
      return (
        <g>
          <rect x={-0.65} y={-0.8} width={1.3} height={1.6} rx={0.12} fill="var(--color-foam)" />
          <path d="M -0.35 -0.35 H 0.35 M -0.35 0 H 0.35 M -0.35 0.35 H 0.1" stroke="var(--color-sea-deep)" strokeWidth={0.09} />
        </g>
      );
    case "computer":
      return (
        <g>
          <rect x={-0.8} y={-0.6} width={1.6} height={1.2} rx={0.25} fill="var(--color-gear)" />
          <rect x={-0.6} y={-0.42} width={1.2} height={0.84} rx={0.12} fill="var(--color-sea-deep)" />
          <path d="M -0.4 -0.1 H 0.4 M -0.4 0.15 H 0.1" stroke="var(--color-badge)" strokeWidth={0.1} />
        </g>
      );
    case "tank2":
      return (
        <g>
          <rect x={-0.35} y={-0.8} width={0.7} height={1.5} rx={0.3} fill="var(--color-gear)" />
          <rect x={-0.12} y={-1} width={0.24} height={0.3} fill="var(--color-badge)" />
        </g>
      );
    case "tank3":
      return (
        <g>
          <rect x={-0.3} y={-0.8} width={0.6} height={1.45} rx={0.28} fill="var(--color-sea-mid)" />
          <rect x={-0.1} y={-1} width={0.2} height={0.3} fill="var(--color-foam)" />
        </g>
      );
    case "twinset":
      return (
        <g>
          <rect x={-0.8} y={-0.85} width={0.6} height={1.5} rx={0.26} fill="var(--color-gear)" />
          <rect x={0.2} y={-0.85} width={0.6} height={1.5} rx={0.26} fill="var(--color-gear)" />
          <rect x={-0.8} y={-1.08} width={1.6} height={0.2} rx={0.08} fill="var(--color-foam)" />
          <circle cx={0} cy={-0.98} r={0.14} fill="var(--color-badge)" />
        </g>
      );
      case "compass":
      return (
        <g>
          <circle r={0.8} fill="var(--color-foam)" />
          <circle r={0.62} fill="var(--color-sea-deep)" />
          <path d="M 0 -0.55 L 0.14 0 L 0 0.55 L -0.14 0 Z" fill="var(--color-alert)" />
        </g>
      );
    case "torch":
    case "torch2":
    case "torch3":
      return (
        <g>
          <path d="M 0.3 -0.3 L 1 -0.7 L 1 0.7 L 0.3 0.3 Z" fill="var(--color-sun)" opacity={0.6} />
          <rect x={-0.9} y={-0.3} width={1.25} height={0.6} rx={0.15} fill={kind === "torch3" ? "var(--color-alert)" : kind === "torch2" ? "var(--color-badge)" : "var(--color-gear)"} />
        </g>
      );
    case "reel":
    case "reel2":
    case "reel3":
    case "reel4":
      return (
        <g>
          <rect x={-0.15} y={-0.95} width={0.3} height={0.5} fill="var(--color-gear)" />
          <circle r={0.6} fill="var(--color-gear)" />
          <circle r={0.4} fill={kind === "reel2" ? "var(--color-badge)" : kind === "reel4" ? "var(--color-alert)" : "var(--color-foam)"} />

          <rect x={0.55} y={-0.1} width={0.4} height={0.2} fill="var(--color-gear)" />
        </g>
      );
    case "dpv":
    case "dpv2":
    case "dpv3":
      return (
        <g>
          <rect x={-0.9} y={-0.38} width={1.5} height={0.76} rx={0.38} fill={kind === "dpv3" ? "var(--color-alert)" : kind === "dpv2" ? "var(--color-badge)" : "var(--color-sun)"} />
          <path d="M 0.6 0 L 0.95 -0.45 M 0.6 0 L 0.95 0.45" stroke="var(--color-gear)" strokeWidth={0.14} />
        </g>
      );
    case "liftbag":
      return (
        <g>
          <path d="M -0.4 0.5 Q -0.6 -0.9 0 -0.95 Q 0.6 -0.9 0.4 0.5 Z" fill="var(--color-badge)" />
          <path d="M 0 0.5 L 0 0.95" stroke="var(--color-foam)" strokeWidth={0.08} />
        </g>
      );
    case "techFins":
      return (
        <g>
          <path d="M -0.8 -0.5 L 0.9 -0.35 L 0.9 -0.05 L -0.8 -0.2 Z" fill="var(--color-sea-deep)" stroke="var(--color-foam)" strokeWidth={0.05} />
          <path d="M -0.8 0.2 L 0.9 0.05 L 0.9 0.35 L -0.8 0.5 Z" fill="var(--color-sea-deep)" stroke="var(--color-foam)" strokeWidth={0.05} />
        </g>
      );
  }
}
