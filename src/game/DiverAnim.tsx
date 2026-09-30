export type Legs = "flutter" | "frog" | "scissor" | "bicycle" | "still";
export type Arms =
  | "breast"
  | "crawl"
  | "paddle"
  | "still"
  | "nosePinch"
  | "maskHold"
  | "maskPull"
  | "inflator"
  | "regMouth"
  | "regPurge"
  | "valve"
  | "strap";
export type Extra =
  | "bubblesNose"
  | "bubblesMouth"
  | "ear"
  | "puff"
  | "chestIn"
  | "chestOut"
  | "vest"
  | "vestPuff"
  | "mask"
  | "fins"
  | "tank"
  | "tank2"
  | "tank3"
  | "twin"
  | "manifold"
  | "iso"
  | "longhose"
  | "hoseShort"
  | "hoseDangle"
  | "hoseBack"
  | "techFins"
  | "reg"
  | "tilt"
  | "jaw"
  | "arrowIn"
  | "arrowOut";

export interface AnimSpec {
  legs: Legs;
  arms: Arms;
  extra?: Extra[];
}

interface DiverAnimProps {
  spec: AnimSpec;
  size?: number;
  horizontal?: boolean;
}


const SUIT = "var(--color-suit)";
const SKIN = "var(--color-skin)";
const GEAR = "var(--color-gear)";

function legClasses(legs: Legs): [string, string] {
  switch (legs) {
    case "flutter":
      return ["anim-kick-a", "anim-kick-b"];
    case "frog":
      return ["anim-frog-a", "anim-frog-b"];
    case "scissor":
      return ["anim-scissor-a", "anim-scissor-b"];
    case "bicycle":
      return ["anim-bicycle-a", "anim-bicycle-b"];
    default:
      return ["", ""];
  }
}

function armClasses(arms: Arms): [string, string] {
  switch (arms) {
    case "breast":
      return ["anim-arm-breast", "anim-arm-breast-mirror"];
    case "crawl":
      return ["anim-arm-crawl", "anim-arm-crawl-off"];
    case "paddle":
      return ["anim-arm-paddle", "anim-arm-paddle"];
    default:
      return ["", ""];
  }
}

function Bubbles({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {[0, 0.6, 1.2].map((d) => (
        <circle
          key={d}
          cx={x}
          cy={y}
          r={1.6 + d}
          fill="var(--color-foam)"
          opacity={0.8}
          className="anim-bubble"
          style={{ animationDelay: `${d}s` }}
        />
      ))}
    </g>
  );
}

/**
 * A single silent pictogram of a diver technique. No labels by design.
 */
export function DiverAnim({ spec, size = 128, horizontal = false }: DiverAnimProps) {
  const extra = spec.extra ?? [];
  const has = (e: Extra) => extra.includes(e);
  const [legA, legB] = legClasses(spec.legs);
  const [armA, armB] = armClasses(spec.arms);

  const handArms = [
    "nosePinch",
    "maskHold",
    "maskPull",
    "inflator",
    "regMouth",
    "regPurge",
    "valve",
    "strap",
  ].includes(spec.arms);

  return (
    <svg
      viewBox={horizontal ? "0 0 120 80" : "0 0 80 120"}
      width={size * (horizontal ? 1.4 : 1)}
      height={size * (horizontal ? 0.75 : 1)}
      role="img"
      aria-label="technique"
    >
      <g transform={horizontal ? "translate(20, -20) rotate(90, 40, 60)" : undefined}>

      {/* torso */}
      <g
        className={
          has("chestIn") ? "anim-chest-in" : has("chestOut") ? "anim-chest-out" : undefined
        }
        style={{ transformOrigin: "40px 48px" }}
      >
        <rect x={32} y={34} width={16} height={34} rx={7} fill={SUIT} />
        {has("vest") && (
          <g
            className={has("vestPuff") ? "anim-vest" : undefined}
            style={{ transformOrigin: "40px 48px" }}
          >
            <rect
              x={27}
              y={36}
              width={26}
              height={24}
              rx={8}
              fill={GEAR}
              opacity={0.85}
            />
          </g>
        )}
        {/* main cylinder on the back */}
        {has("tank") && <rect x={20} y={34} width={10} height={28} rx={4} fill="var(--color-sea-mid)" />}
        {/* twinset: two cylinders side by side on the back */}
        {has("twin") && (
          <g>
            <rect x={16} y={34} width={9} height={28} rx={4} fill="var(--color-sea-mid)" />
            <rect x={26} y={34} width={9} height={28} rx={4} fill="var(--color-sea-mid)" />
            {has("manifold") && (
              <g>
                <rect x={14} y={31} width={23} height={4} rx={2} fill={GEAR} />
                {has("iso") && <circle cx={25.5} cy={33} r={2.6} fill="var(--color-badge)" />}
              </g>
            )}
          </g>
        )}
        {/* long hose looping from the first stage around to the front */}
        {has("longhose") && (
          <path
            d="M28 33 C 18 50, 30 68, 47 64 C 56 60, 55 44, 44 40 C 34 37, 31 31, 44 30"
            stroke={GEAR}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
        )}
        {has("hoseShort") && (
          <path d="M28 33 q-8 6 -2 12" stroke={GEAR} strokeWidth={3} fill="none" strokeLinecap="round" />
        )}
        {has("hoseDangle") && (
          <path d="M28 33 q-12 22 -4 48" stroke={GEAR} strokeWidth={3} fill="none" strokeLinecap="round" />
        )}
        {has("hoseBack") && (
          <path d="M28 33 q-16 -4 -10 -24" stroke={GEAR} strokeWidth={3} fill="none" strokeLinecap="round" />
        )}
        {/* second cylinder on the front */}
        {has("tank2") && <rect x={51} y={40} width={7} height={24} rx={3} fill="var(--color-badge)" />}
        {/* third (staged) cylinder slung at the side */}
        {has("tank3") && <rect x={58} y={42} width={6} height={22} rx={3} fill="var(--color-sea-shallow)" />}
      </g>

      {/* head */}
      <g
        className={has("tilt") ? "anim-head-tilt" : undefined}
        style={{ transformOrigin: "40px 34px" }}
      >
        <circle cx={40} cy={22} r={11} fill={SKIN} />
        {has("mask") && (
          <rect x={30} y={16} width={20} height={9} rx={3} fill="var(--color-sea-shallow)" opacity={0.9} />
        )}
        {has("reg") && <rect x={38} y={28} width={12} height={6} rx={3} fill={GEAR} />}
        {has("puff") && (
          <g className="anim-puff" style={{ transformOrigin: "40px 27px" }}>
            <ellipse cx={33} cy={27} rx={4} ry={3.4} fill={SKIN} />
            <ellipse cx={47} cy={27} rx={4} ry={3.4} fill={SKIN} />
          </g>
        )}
        {has("jaw") && (
          <rect
            className="anim-jaw"
            x={35}
            y={29}
            width={10}
            height={4}
            rx={2}
            fill="var(--color-sand-dark)"
          />
        )}
        {has("ear") && (
          <circle
            cx={51}
            cy={22}
            r={5}
            fill="var(--color-badge)"
            className="anim-ear"
            style={{ transformOrigin: "51px 22px" }}
          />
        )}
      </g>

      {/* arms */}
      {handArms ? (
        <g className="anim-hand-press" style={{ transformOrigin: "40px 40px" }}>
          {spec.arms === "nosePinch" && (
            <path d="M48 44 L44 30" stroke={SKIN} strokeWidth={4} strokeLinecap="round" fill="none" />
          )}
          {(spec.arms === "maskHold" || spec.arms === "maskPull") && (
            <path
              d={spec.arms === "maskHold" ? "M48 44 L46 21" : "M48 44 L52 12"}
              stroke={SKIN}
              strokeWidth={4}
              strokeLinecap="round"
              fill="none"
            />
          )}
          {spec.arms === "inflator" && (
            <>
              <path d="M30 44 L34 28" stroke={SKIN} strokeWidth={4} strokeLinecap="round" fill="none" />
              <path d="M28 46 q-8 -12 6 -18" stroke={GEAR} strokeWidth={3} fill="none" />
            </>
          )}
          {(spec.arms === "regMouth" || spec.arms === "regPurge") && (
            <path d="M52 46 L46 30" stroke={SKIN} strokeWidth={4} strokeLinecap="round" fill="none" />
          )}
          {spec.arms === "valve" && (
            <path d="M50 44 q14 -6 8 -18" stroke={SKIN} strokeWidth={4} fill="none" strokeLinecap="round" />
          )}
          {spec.arms === "strap" && (
            <path d="M30 46 L50 56" stroke={SKIN} strokeWidth={4} fill="none" strokeLinecap="round" />
          )}
        </g>
      ) : (
        <>
          <g className={armA} style={{ transformOrigin: "34px 40px" }}>
            <path d="M34 40 L22 56" stroke={SKIN} strokeWidth={4} strokeLinecap="round" fill="none" />
          </g>
          <g className={armB} style={{ transformOrigin: "46px 40px" }}>
            <path d="M46 40 L58 56" stroke={SKIN} strokeWidth={4} strokeLinecap="round" fill="none" />
          </g>
        </>
      )}

      {/* legs */}
      <g className={legA} style={{ transformOrigin: "38px 68px" }}>
        <path d="M38 68 L33 100" stroke={SUIT} strokeWidth={5} strokeLinecap="round" fill="none" />
        {has("fins") && <ellipse cx={32} cy={106} rx={5} ry={9} fill={GEAR} />}
        {has("techFins") && <path d="M29 99 L22 115 L40 115 L35 99 Z" fill="var(--color-fin-grey)" />}
      </g>
      <g className={legB} style={{ transformOrigin: "42px 68px" }}>
        <path d="M42 68 L47 100" stroke={SUIT} strokeWidth={5} strokeLinecap="round" fill="none" />
        {has("fins") && <ellipse cx={48} cy={106} rx={5} ry={9} fill={GEAR} />}
        {has("techFins") && <path d="M45 99 L40 115 L58 115 L51 99 Z" fill="var(--color-fin-grey)" />}
      </g>

      {has("bubblesNose") && <Bubbles x={40} y={28} />}
      {has("bubblesMouth") && <Bubbles x={44} y={32} />}
      {has("arrowIn") && (
        <path
          className="anim-arrow-in"
          d="M18 14 L30 24 M24 24 L30 24 L30 18"
          stroke="var(--color-foam)"
          strokeWidth={2.5}
          fill="none"
        />
      )}
      {has("arrowOut") && (
        <path
          className="anim-arrow-out"
          d="M30 24 L18 14 M18 20 L18 14 L24 14"
          stroke="var(--color-foam)"
          strokeWidth={2.5}
          fill="none"
        />
      )}
      </g>
    </svg>

  );
}

export type ManifoldVariant =
  | "full"
  | "single"
  | "noManifold"
  | "noIso"
  | "isoClosed"
  | "noLonghose"
  | "noBands";

/**
 * Wordless pictograms of back-mounted twin cylinders, one per training option.
 * Only "full" shows both cylinders with bands, an isolation manifold and a long hose.
 */
export function ManifoldArt({ variant, size = 150 }: { variant: ManifoldVariant; size?: number }) {
  const two = variant !== "single";
  const bands = variant !== "noBands";
  const manifold = two && variant !== "noManifold";
  const iso = manifold && variant !== "noIso";
  const isoOpen = iso && variant !== "isoClosed";
  const longhose =
    variant === "full" || variant === "noIso" || variant === "isoClosed" || variant === "noBands";
  const cyl = (x: number) => <rect x={x} y={30} width={14} height={58} rx={6} fill="var(--color-sea-mid)" />;
  return (
    <svg viewBox="0 0 120 100" width={size} height={(size * 100) / 120} role="img" aria-label="technique">
      {two ? cyl(34) : cyl(48)}
      {two && cyl(62)}
      {bands && two && (
        <g fill={GEAR}>
          <rect x={31} y={40} width={48} height={6} rx={3} />
          <rect x={31} y={72} width={48} height={6} rx={3} />
        </g>
      )}
      {manifold && !isoOpen && variant !== "isoClosed" && (
        <rect x={30} y={24} width={50} height={7} rx={3.5} fill={GEAR} />
      )}
      {variant === "isoClosed" && (
        <g fill={GEAR}>
          <rect x={30} y={24} width={17} height={7} rx={3.5} />
          <rect x={63} y={24} width={17} height={7} rx={3.5} />
          <circle cx={55} cy={27.5} r={3} fill="var(--color-alert)" />
        </g>
      )}
      {isoOpen && (
        <g>
          <rect x={49} y={16} width={4} height={10} fill={GEAR} />
          <circle cx={51} cy={14} r={4} fill="var(--color-badge)" />
        </g>
      )}
      <rect x={42} y={30} width={4} height={7} fill={GEAR} />
      {longhose ? (
        <path
          d="M44 37 q-18 18 4 34 q10 8 24 2"
          stroke={GEAR}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
        />
      ) : (
        <path d="M44 37 q-8 12 6 18" stroke={GEAR} strokeWidth={4} fill="none" strokeLinecap="round" />
      )}
    </svg>
  );
}

export type ValveVariant = "three" | "noIso" | "noBar" | "single" | "four" | "noKnobs";

/**
 * Close-up of an isolation manifold: only the tops of the two cylinders, the crossbar
 * and three valves (left post, right post, centre isolator).
 */
export function ValveArt({ variant, size = 150 }: { variant: ValveVariant; size?: number }) {
  const two = variant !== "single";
  const bar = two && variant !== "noBar";
  const knobs = variant !== "noKnobs";
  const tankTop = (x: number) => (
    <g>
      <rect x={x} y={62} width={36} height={50} rx={16} fill="var(--color-sea-mid)" />
      <rect x={x + 14} y={50} width={8} height={14} fill={GEAR} />
    </g>
  );
  const valve = (x: number, key: string) => (
    <g key={key}>
      <rect x={x - 2.5} y={30} width={5} height={14} fill={GEAR} />
      {knobs && <circle cx={x} cy={28} r={7} fill="var(--color-badge)" />}
      {knobs && <circle cx={x} cy={28} r={2.4} fill={GEAR} />}
    </g>
  );
  const posts = two ? [36, 84] : [60];
  const valves = [...posts];
  if (bar && variant !== "noIso") valves.push(60);
  if (variant === "four") valves.push(48);
  return (
    <svg viewBox="0 0 120 100" width={size} height={(size * 100) / 120} role="img" aria-label="technique">
      {two ? (
        <>
          {tankTop(18)}
          {tankTop(66)}
        </>
      ) : (
        tankTop(42)
      )}
      {bar && <rect x={30} y={42} width={60} height={8} rx={4} fill={GEAR} />}
      {!bar && posts.map((x) => <rect key={x} x={x - 6} y={42} width={12} height={8} rx={4} fill={GEAR} />)}
      {valves.map((x, i) => valve(x, `v${i}`))}
    </svg>
  );
}
