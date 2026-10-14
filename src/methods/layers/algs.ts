// The algorithms of Cinoto's layer method (cinoto.com.br/camadas/camadas.pdf).

export const ALGS = {
  // Step 2: first layer corners, with the corner above its place at the front right.
  "2.1": "R U R'", // white sticker facing right
  "2.2": "F' U' F", // white sticker facing front
  "2.3": "R U2 R' U'", // white sticker facing up: turns into case 1
} as const;

export type CaseId = keyof typeof ALGS;
