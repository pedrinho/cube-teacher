// The smaller "2-look" last layer: first the top edges, then the top corners (OLL), and first the
// top corners, then the top edges (PLL). Fewer algorithms to learn, a bit slower to do.
import { OLL_CASES, PLL_CASES } from "./algs";

/** Yellow edges on top: a line goes left to right, an L points to the back left. */
export const OLL_EDGES = {
  line: "F R U R' U' F'",
  ell: "F U R U' R' F'",
} as const;

/** The seven corner cases, by their position in Cinoto's OLL list (all have the cross done). */
export const OLL_CORNER_CASES = ["Sune", "Anti-Sune", "Sune duplo", "T cantos", "Torre", "Vesgo", "Olhos"].map((name) =>
  OLL_CASES.findIndex((c) => c.name === name),
);

const pll = (name: string) => PLL_CASES.findIndex((c) => c.name === name);
/** Corners first (T for two swapped neighbors, Y for two swapped across), then edges. */
export const PLL_CORNER_CASES = ["T", "Y"].map(pll);
export const PLL_EDGE_CASES = ["U1", "U2", "H", "Z"].map(pll);
