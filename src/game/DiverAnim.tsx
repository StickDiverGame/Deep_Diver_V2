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

  const uid = useId().replace(/[:]/g, "");
  const gSuit = `s${uid}`;
  const gTank = `t${uid}`;
  const gLens = `l${uid}`;
  const gWing = `w${uid}`;

  /** One leg: thigh, articulated knee, shin, boot and fin. */
  const leg = (side: "a" | "b") => {
    const a = side === "a";
    const hipX = a ? 38 : 42;
    const kneeX = a ? 35.5 : 44.5;
    const ankleX = a ? 33 : 47;
    return (
      <>
        {/* thigh */}
        <path
          d={`M${hipX} 66 L${kneeX} 86`}
          stroke={`url(#${gSuit})`}
          strokeWidth={6.4}
          strokeLinecap="round"
          fill="none"
        />
        {/* knee pad */}
        <circle cx={kneeX} cy={85} r={3.1} fill="var(--color-sea-deep)" opacity={0.45} />
        <g
          className={spec.legs === "still" ? undefined : a ? "anim-knee-a" : "anim-knee-b"}
          style={{ transformOrigin: `${kneeX}px 86px` }}
        >
          {/* shin */}
          <path
            d={`M${kneeX} 86 L${ankleX} 101`}
            stroke={`url(#${gSuit})`}
            strokeWidth={5.2}
            strokeLinecap="round"
            fill="none"
          />
          {has("fins") && (
            <g>
              {/* foot pocket */}
              <rect
                x={ankleX - 3.2}
                y={99}
                width={6.4}
                height={6}
                rx={2.6}
                fill="var(--color-sea-deep)"
              />
              {/* blade */}
              <path
                d={`M${ankleX - 4.4} 104 Q${ankleX} 101.5 ${ankleX + 4.4} 104 L${ankleX + 3.4} 115 Q${ankleX} 117 ${ankleX - 3.4} 115 Z`}
                fill={GEAR}
              />
              <path
                d={`M${ankleX} 104 L${ankleX} 115`}
                stroke="var(--color-sea-deep)"
                strokeWidth={0.7}
                opacity={0.35}
              />
            </g>
          )}
          {has("techFins") && (
            <g>
              {/* spring heel strap */}
              <path
                d={`M${ankleX - 3.6} 100 q-2.6 2.6 0 5.4`}
                stroke="var(--color-fin-grey)"
                strokeWidth={1.3}
                fill="none"
              />
              <rect
                x={ankleX - 3.4}
                y={98.5}
                width={6.8}
                height={6.4}
                rx={2}
                fill="var(--color-sea-deep)"
              />
              {/* vented jet-fin blade */}
              <path
                d={`M${ankleX - 5} 104 L${ankleX + 5} 104 L${ankleX + 6.4} 116 L${ankleX - 6.4} 116 Z`}
                fill="var(--color-fin-grey)"
              />
              <g stroke="var(--color-sea-deep)" strokeWidth={0.8} opacity={0.5}>
                <path d={`M${ankleX - 2.4} 106 L${ankleX - 3} 115`} />
                <path d={`M${ankleX} 106 L${ankleX} 115`} />
                <path d={`M${ankleX + 2.4} 106 L${ankleX + 3} 115`} />
              </g>
              {/* vent slots */}
              <rect
                x={ankleX - 4}
                y={105}
                width={2.6}
                height={1.6}
                rx={0.8}
                fill="var(--color-sea-deep)"
                opacity={0.55}
              />
              <rect
                x={ankleX + 1.4}
                y={105}
                width={2.6}
                height={1.6}
                rx={0.8}
                fill="var(--color-sea-deep)"
                opacity={0.55}
              />
            </g>
          )}
        </g>
      </>
    );
  };

  /** One arm: upper arm, elbow, forearm and hand. */
  const arm = (side: "a" | "b") => {
    const a = side === "a";
    const sx = a ? 34 : 46;
    const ex = a ? 27 : 53;
    const hx = a ? 22 : 58;
    return (
      <>
        <path
          d={`M${sx} 40 L${ex} 49`}
          stroke={`url(#${gSuit})`}
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d={`M${ex} 49 L${hx} 56`}
          stroke={SKIN}
          strokeWidth={4.2}
          strokeLinecap="round"
          fill="none"
        />
        <circle cx={hx} cy={57} r={2.4} fill={SKIN} />
        {/* wrist dive computer on the right arm */}
        {!a && has("tank") && (
          <g>
            <rect x={hx - 4} y={51} width={4.4} height={3.6} rx={1} fill="var(--color-sea-deep)" />
            <rect x={hx - 3.4} y={51.6} width={3.2} height={2.4} rx={0.6} fill="var(--color-badge)" />
          </g>
        )}
      </>
    );
  };

  return (
    <svg
      viewBox={horizontal ? "0 0 120 80" : "0 0 80 120"}
      width={size * (horizontal ? 1.4 : 1)}
      height={size * (horizontal ? 0.75 : 1)}
      role="img"
      aria-label="technique"
    >
      <defs>
        <linearGradient id={gSuit} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-sea-deep)" />
          <stop offset="45%" stopColor={SUIT} />
          <stop offset="100%" stopColor="var(--color-sea-deep)" />
        </linearGradient>
        <linearGradient id={gTank} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--color-sea-deep)" />
          <stop offset="40%" stopColor="var(--color-sea-shallow)" />
          <stop offset="100%" stopColor="var(--color-sea-mid)" />
        </linearGradient>
        <linearGradient id={gWing} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GEAR} />
          <stop offset="100%" stopColor="var(--color-sea-deep)" />
        </linearGradient>
        <linearGradient id={gLens} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-foam)" stopOpacity={0.85} />
          <stop offset="55%" stopColor="var(--color-sea-shallow)" stopOpacity={0.75} />
          <stop offset="100%" stopColor="var(--color-sea-mid)" stopOpacity={0.9} />
        </linearGradient>
      </defs>
      <g transform={horizontal ? "translate(20, -20) rotate(90, 40, 60)" : undefined}>

      {/* torso */}
      <g
        className={
          has("chestIn") ? "anim-chest-in" : has("chestOut") ? "anim-chest-out" : undefined
        }
        style={{ transformOrigin: "40px 48px" }}
      >
        {/* contoured wetsuit: shoulders, tapered waist, hips */}
        <path
          d="M40 32 C47 32, 49.5 36, 50 41 C50.6 48, 49 55, 47.8 61 C47.2 65, 45 68, 40 68 C35 68, 32.8 65, 32.2 61 C31 55, 29.4 48, 30 41 C30.5 36, 33 32, 40 32 Z"
          fill={`url(#${gSuit})`}
        />
        {/* chest zip + seam */}
        <path d="M40 35 L40 64" stroke="var(--color-sea-deep)" strokeWidth={0.7} opacity={0.5} />
        {has("vest") && (
          <g
            className={has("vestPuff") ? "anim-vest" : undefined}
            style={{ transformOrigin: "40px 48px" }}
          >
            {/* wing bladder behind the diver */}
            <path
              d="M27 38 C22 44, 22 56, 27.5 61 L33 59 L33 40 Z"
              fill={`url(#${gWing})`}
              opacity={0.9}
            />
            <path
              d="M53 38 C58 44, 58 56, 52.5 61 L47 59 L47 40 Z"
              fill={`url(#${gWing})`}
              opacity={0.9}
            />
            {/* harness webbing + D-rings */}
            <path
              d="M34 35 L33 62 M46 35 L47 62"
              stroke="var(--color-sea-deep)"
              strokeWidth={1.6}
              opacity={0.8}
              fill="none"
            />
            <circle cx={32.4} cy={41} r={1.5} fill="var(--color-fin-grey)" />
            <circle cx={47.6} cy={41} r={1.5} fill="var(--color-fin-grey)" />
            {/* corrugated inflator hose over the left shoulder */}
            <path
              d="M34 36 q-6 5 -5 12"
              stroke={GEAR}
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        )}
        {/* main cylinder on the back */}
        {has("tank") && (
          <g>
            <rect x={20} y={34} width={10} height={28} rx={4.5} fill={`url(#${gTank})`} />
            {/* tank boot */}
            <rect x={20} y={57} width={10} height={5} rx={2.2} fill="var(--color-sea-deep)" opacity={0.75} />
            {/* valve + DIN first stage */}
            <rect x={24} y={30.5} width={2.4} height={4} fill={GEAR} />
            <circle cx={25.2} cy={29.6} r={2.4} fill="var(--color-badge)" />
            <rect x={27} y={32} width={4.6} height={4.2} rx={1.4} fill="var(--color-fin-grey)" />
          </g>
        )}
        {/* twinset: two cylinders side by side on the back */}
        {has("twin") && (
          <g>
            <rect x={16} y={34} width={9} height={28} rx={4} fill={`url(#${gTank})`} />
            <rect x={26} y={34} width={9} height={28} rx={4} fill={`url(#${gTank})`} />
            <rect x={16} y={57.5} width={9} height={4.5} rx={2} fill="var(--color-sea-deep)" opacity={0.7} />
            <rect x={26} y={57.5} width={9} height={4.5} rx={2} fill="var(--color-sea-deep)" opacity={0.7} />
            {/* tank bands */}
            <rect x={15} y={41} width={21} height={2.2} rx={1.1} fill="var(--color-fin-grey)" opacity={0.8} />
            <rect x={15} y={52} width={21} height={2.2} rx={1.1} fill="var(--color-fin-grey)" opacity={0.8} />
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
        {has("tank2") && (
          <g>
            <rect x={51} y={40} width={7} height={24} rx={3.2} fill="var(--color-badge)" />
            <rect x={51} y={60} width={7} height={4} rx={1.8} fill="var(--color-sea-deep)" opacity={0.6} />
            <circle cx={54.5} cy={38.6} r={1.8} fill="var(--color-fin-grey)" />
          </g>
        )}
        {/* third (staged) cylinder slung at the side */}
        {has("tank3") && (
          <g>
            <rect x={58} y={42} width={6} height={22} rx={3} fill="var(--color-sea-shallow)" />
            <circle cx={61} cy={40.8} r={1.6} fill="var(--color-fin-grey)" />
          </g>
        )}
      </g>

      {/* head */}
      <g
        className={has("tilt") ? "anim-head-tilt" : undefined}
        style={{ transformOrigin: "40px 34px" }}
      >
        {/* neoprene hood */}
        <path
          d="M40 10.5 C47.5 10.5, 51.5 16, 51.5 23 C51.5 29, 47 33.5, 40 33.5 C33 33.5, 28.5 29, 28.5 23 C28.5 16, 32.5 10.5, 40 10.5 Z"
          fill="var(--color-sea-deep)"
        />
        {/* face opening */}
        <path
          d="M40 13 C45.6 13, 48.6 17, 48.6 22.6 C48.6 27.4, 45.2 31, 40 31 C34.8 31, 31.4 27.4, 31.4 22.6 C31.4 17, 34.4 13, 40 13 Z"
          fill={SKIN}
        />
        {has("mask") && (
          <g>
            {/* silicone skirt */}
            <rect x={29.4} y={15} width={21.2} height={11} rx={4} fill="var(--color-sea-deep)" opacity={0.85} />
            {/* lens */}
            <rect x={31} y={16.4} width={18} height={7.6} rx={2.6} fill={`url(#${gLens})`} />
            <path d="M33 17.4 L38 17.4 L34 22.6 L32.6 20 Z" fill="var(--color-foam)" opacity={0.55} />
            {/* strap */}
            <path d="M29.4 20 L27 19.4 M50.6 20 L53 19.4" stroke="var(--color-sea-deep)" strokeWidth={1.6} />
          </g>
        )}
        {has("reg") && (
          <g>
            <rect x={36.6} y={27.4} width={9.6} height={6.4} rx={2.6} fill={GEAR} />
            <circle cx={41.4} cy={30.6} r={1.9} fill="var(--color-fin-grey)" />
            {/* exhaust tee */}
            <path d="M43.4 33.4 l2.4 2.4" stroke={GEAR} strokeWidth={1.6} strokeLinecap="round" />
          </g>
        )}
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
            <>
              <path d="M48 44 L46 36 L44 30" stroke={SKIN} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx={43.6} cy={29.4} r={2.2} fill={SKIN} />
            </>
          )}
          {(spec.arms === "maskHold" || spec.arms === "maskPull") && (
            <>
              <path
                d={spec.arms === "maskHold" ? "M48 44 L47.4 32 L46 21" : "M48 44 L50 28 L52 12"}
                stroke={SKIN}
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <circle
                cx={spec.arms === "maskHold" ? 46 : 52}
                cy={spec.arms === "maskHold" ? 20.6 : 11.6}
                r={2.2}
                fill={SKIN}
              />
            </>
          )}
          {spec.arms === "inflator" && (
            <>
              <path d="M30 44 L31.6 36 L34 28" stroke={SKIN} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M28 46 q-8 -12 6 -18" stroke={GEAR} strokeWidth={3} fill="none" />
              <circle cx={34.2} cy={27.6} r={2.2} fill={SKIN} />
            </>
          )}
          {(spec.arms === "regMouth" || spec.arms === "regPurge") && (
            <>
              <path d="M52 46 L49.4 38 L46 30" stroke={SKIN} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx={45.8} cy={29.6} r={2.2} fill={SKIN} />
            </>
          )}
          {spec.arms === "valve" && (
            <>
              <path d="M50 44 q14 -6 8 -18" stroke={SKIN} strokeWidth={4} fill="none" strokeLinecap="round" />
              <circle cx={57.6} cy={26.4} r={2.2} fill={SKIN} />
            </>
          )}
          {spec.arms === "strap" && (
            <>
              <path d="M30 46 L40 50.4 L50 56" stroke={SKIN} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={50.2} cy={56.2} r={2.2} fill={SKIN} />
            </>
          )}
        </g>
      ) : (
        <>
          <g className={armA} style={{ transformOrigin: "34px 40px" }}>
            {arm("a")}
          </g>
          <g className={armB} style={{ transformOrigin: "46px 40px" }}>
            {arm("b")}
          </g>
        </>
      )}

      {/* legs */}
      <g className={legA} style={{ transformOrigin: "38px 68px" }}>
        {leg("a")}
      </g>
      <g className={legB} style={{ transformOrigin: "42px 68px" }}>
        {leg("b")}
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
