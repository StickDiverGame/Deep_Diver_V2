import type { AnimSpec, Extra, ManifoldVariant, ValveVariant } from "./DiverAnim";
import type { StageVariant } from "./tech";

export interface PuzzleOption {
  id: string;
  spec: AnimSpec;
  art?: ManifoldVariant;
  stage?: StageVariant;
  valve?: ValveVariant;
  correct?: boolean;
}

export interface Puzzle {
  key: string;
  options: PuzzleOption[];
}

/** Puzzle 1 — surface stroke: flutter kick + breast stroke arms. */
export const swimPuzzle: Puzzle = {
  key: "swim",
  options: [
    { id: "s1", spec: { legs: "flutter", arms: "breast" }, correct: true },
    { id: "s2", spec: { legs: "frog", arms: "breast" } },
    { id: "s3", spec: { legs: "flutter", arms: "crawl" } },
    { id: "s4", spec: { legs: "scissor", arms: "crawl" } },
    { id: "s5", spec: { legs: "still", arms: "breast" } },
    { id: "s6", spec: { legs: "bicycle", arms: "paddle" } },
  ],
};

/** Puzzle 2 — equalization: pinch nose + exhale into nose + eardrum inflates. */
export const earPuzzle: Puzzle = {
  key: "ear",
  options: [
    {
      id: "e1",
      spec: { legs: "still", arms: "nosePinch", extra: ["puff", "ear", "arrowOut"] },
      correct: true,
    },
    { id: "e2", spec: { legs: "still", arms: "nosePinch" } },
    { id: "e3", spec: { legs: "still", arms: "still", extra: ["bubblesNose", "puff"] } },
    { id: "e4", spec: { legs: "still", arms: "nosePinch", extra: ["jaw"] } },
    { id: "e5", spec: { legs: "still", arms: "still", extra: ["tilt", "ear"] } },
    { id: "e6", spec: { legs: "still", arms: "nosePinch", extra: ["arrowIn", "chestIn"] } },
  ],
};

/** Puzzle 3 — mask clearing: hand holds mask, exhale through nose into mask. */
export const maskPuzzle: Puzzle = {
  key: "mask",
  options: [
    {
      id: "m1",
      spec: { legs: "still", arms: "maskHold", extra: ["mask", "puff", "bubblesNose"] },
      correct: true,
    },
    { id: "m2", spec: { legs: "still", arms: "still", extra: ["mask", "bubblesNose"] } },
    { id: "m3", spec: { legs: "still", arms: "maskHold", extra: ["mask", "chestIn", "arrowIn"] } },
    { id: "m4", spec: { legs: "still", arms: "maskPull", extra: ["mask"] } },
    { id: "m5", spec: { legs: "flutter", arms: "still", extra: ["mask", "bubblesMouth"] } },
    { id: "m6", spec: { legs: "still", arms: "maskHold", extra: ["mask", "tilt"] } },
  ],
};

/** Puzzle 4 — finning: flutter kick with fins, arms at the sides. */
export const finsPuzzle: Puzzle = {
  key: "fins",
  options: [
    { id: "f1", spec: { legs: "flutter", arms: "still", extra: ["fins", "mask"] }, correct: true },
    { id: "f2", spec: { legs: "flutter", arms: "crawl", extra: ["fins", "mask"] } },
    { id: "f3", spec: { legs: "frog", arms: "breast", extra: ["fins", "mask"] } },
    { id: "f4", spec: { legs: "bicycle", arms: "still", extra: ["fins", "mask"] } },
    { id: "f5", spec: { legs: "still", arms: "paddle", extra: ["fins", "mask"] } },
    { id: "f6", spec: { legs: "scissor", arms: "paddle", extra: ["fins", "mask"] } },
  ],
};

/** Puzzle 5 — BCD: oral inflator to the mouth, vest fills. */
export const bcdPuzzle: Puzzle = {
  key: "bcd",
  options: [
    {
      id: "b1",
      spec: { legs: "still", arms: "inflator", extra: ["vest", "vestPuff", "mask", "chestOut"] },
      correct: true,
    },
    { id: "b2", spec: { legs: "still", arms: "inflator", extra: ["vest", "mask", "arrowIn"] } },
    { id: "b3", spec: { legs: "still", arms: "strap", extra: ["vest", "mask"] } },
    { id: "b4", spec: { legs: "flutter", arms: "still", extra: ["vest", "vestPuff", "mask"] } },
    { id: "b5", spec: { legs: "still", arms: "valve", extra: ["vest", "mask"] } },
    { id: "b6", spec: { legs: "still", arms: "maskHold", extra: ["vest", "mask", "bubblesNose"] } },
  ],
};

/** Puzzle 6 — regulator: in the mouth, slow exhale bubbles from the second stage. */
export const regPuzzle: Puzzle = {
  key: "reg",
  options: [
    {
      id: "r1",
      spec: {
        legs: "still",
        arms: "regMouth",
        extra: ["reg", "mask", "tank", "bubblesMouth", "chestOut"],
      },
      correct: true,
    },
    { id: "r2", spec: { legs: "still", arms: "regPurge", extra: ["mask", "tank", "bubblesMouth"] } },
    { id: "r3", spec: { legs: "still", arms: "nosePinch", extra: ["reg", "mask", "tank"] } },
    { id: "r4", spec: { legs: "still", arms: "regMouth", extra: ["mask", "tank", "puff"] } },
    { id: "r5", spec: { legs: "flutter", arms: "still", extra: ["reg", "mask", "tank", "arrowIn"] } },
    { id: "r6", spec: { legs: "still", arms: "maskPull", extra: ["reg", "mask", "tank"] } },
  ],
};

/** Puzzle 7 — tank: open the valve fully, straps secured. */
export const tankPuzzle: Puzzle = {
  key: "tank",
  options: [
    {
      id: "t1",
      spec: { legs: "still", arms: "valve", extra: ["tank", "vest", "mask", "reg"] },
      correct: true,
    },
    { id: "t2", spec: { legs: "still", arms: "strap", extra: ["tank", "mask"] } },
    { id: "t3", spec: { legs: "still", arms: "inflator", extra: ["tank", "vest", "mask"] } },
    { id: "t4", spec: { legs: "still", arms: "valve", extra: ["tank", "bubblesMouth"] } },
    { id: "t5", spec: { legs: "bicycle", arms: "still", extra: ["tank", "vest", "mask"] } },
    { id: "t6", spec: { legs: "still", arms: "regPurge", extra: ["tank", "vest", "mask"] } },
  ],
};

export const breathOptions: PuzzleOption[] = [
  { id: "inhale", spec: { legs: "still", arms: "still", extra: ["chestIn", "arrowIn", "puff"] } },
  {
    id: "exhale",
    spec: { legs: "still", arms: "still", extra: ["chestOut", "arrowOut", "bubblesMouth"] },
  },
];

/** Puzzle 8 — twinset: twin cylinders with an isolation manifold and a long hose. */
export const twinsetPuzzle: Puzzle = {
  key: "twinset",
  options: [
    {
      id: "w1",
      spec: { legs: "still", arms: "still" },
      art: "full",
      correct: true,
    },
    { id: "w2", spec: { legs: "still", arms: "still" }, art: "single" },
    { id: "w3", spec: { legs: "still", arms: "still" }, art: "noManifold" },
    { id: "w4", spec: { legs: "still", arms: "still" }, art: "noIso" },
    { id: "w5", spec: { legs: "still", arms: "still" }, art: "noLonghose" },
    { id: "w6", spec: { legs: "still", arms: "still" }, art: "noBands" },
  ],
};

/** Puzzle 9 — manifold: both cylinders joined with an open isolation manifold. */
export const manifoldPuzzle: Puzzle = {
  key: "manifold",
  options: [
    { id: "n1", spec: { legs: "still", arms: "still" }, valve: "three", correct: true },
    { id: "n2", spec: { legs: "still", arms: "still" }, valve: "noIso" },
    { id: "n3", spec: { legs: "still", arms: "still" }, valve: "noBar" },
    { id: "n4", spec: { legs: "still", arms: "still" }, valve: "single" },
    { id: "n5", spec: { legs: "still", arms: "still" }, valve: "four" },
    { id: "n6", spec: { legs: "still", arms: "still" }, valve: "noKnobs" },
  ],
};

/** Puzzle 10 — long hose: down the right hip, across the chest, around the neck to the mouth. */
const hoseDiver = (hose: Extra[]): AnimSpec => ({
  legs: "still",
  arms: "still",
  extra: ["mask", "fins", "vest", "twin", "manifold", "iso", "reg", ...hose],
});
export const longhosePuzzle: Puzzle = {
  key: "longhose",
  options: [
    { id: "h1", spec: hoseDiver(["longhose"]), correct: true },
    { id: "h2", spec: hoseDiver([]) },
    { id: "h3", spec: hoseDiver(["hoseShort"]) },
    { id: "h4", spec: hoseDiver(["hoseDangle"]) },
    { id: "h5", spec: hoseDiver(["hoseBack"]) },
    { id: "h6", spec: { legs: "still", arms: "still", extra: ["mask", "fins", "vest", "tank", "reg", "longhose"] } },
  ],
};

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const ai = a[i]!;
    a[i] = a[j]!;
    a[j] = ai;
  }
  return a;
}

const still: AnimSpec = { legs: "still", arms: "still" };

/** Puzzle 11 — stage drop: the cylinder is clipped to a line. */
export const stageLeavePuzzle: Puzzle = {
  key: "stageLeave",
  options: (["onLine", "onSand", "floating", "besideLine", "upsideDown", "onDiver"] as StageVariant[]).map(
    (v, i) => ({ id: `sl${i}`, spec: still, stage: v, correct: v === "onLine" }),
  ),
};

/** Puzzle 12 — stage carry: the cylinder is clipped along the diver's front. */
export const stageCarryPuzzle: Puzzle = {
  key: "stageCarry",
  options: (["front", "back", "dangling", "inHand", "onHead", "none"] as StageVariant[]).map((v, i) => ({
    id: `sc${i}`,
    spec: still,
    stage: v,
    correct: v === "front",
  })),
};
