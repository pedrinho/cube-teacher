// The algorithms of Cinoto's layer method (cinoto.com.br/camadas/camadas.pdf).

export const ALGS = {
  // Step 2: first layer corners, with the corner above its place at the front right.
  "2.1": "R U R'", // white sticker facing right
  "2.2": "F' U' F", // white sticker facing front
  "2.3": "R U2 R' U'", // white sticker facing up: turns into case 1

  // Step 3: middle layer edges, with the edge at the top front above its center. Each case takes
  // a white corner out, which then goes back with a step 2 case.
  "3.1": "U R U R' U'", // edge goes to the right, then step 2 case 2
  "3.2": "U' L' U' L U", // edge goes to the left, then turn the cube and step 2 case 1

  // Step 4: yellow cross. One algorithm; the case says how to hold the cube.
  "4.1": "F U R U' R' F'", // an L at the back left: finishes the cross
  "4.2": "F U R U' R' F'", // a line from left to right: becomes an L at the back left
  "4.3": "F U R U' R' F'", // only the center: becomes a line

  // Step 5: yellow face. One algorithm (Sune); the case says how to hold the cube.
  "5.1": "R U R' U R U2 R'", // one yellow corner on top, held at the front left
  "5.2": "R U R' U R U2 R'", // two: front left corner's yellow facing front; becomes case 1
  "5.3": "R U R' U R U2 R'", // none: front left corner's yellow facing left; becomes case 1

  // Step 6: top corners to their places, then turn the top to line them up.
  "6.1": "R' F R' B2 R F' R' B2 R2", // headlights (two corners with the same side color) at the back
  "6.2": "R' F R' B2 R F' R' B2 R2", // no headlights: becomes case 1

  // Step 7 (Minerva): top edges, with the finished side at the back.
  "7.1": "F2 U M' U2 M U F2", // the other three edges go round clockwise (front edge to the left)
  "7.2": "F2 U' M' U2 M U' F2", // counterclockwise (front edge to the right)
  "7.3": "F2 U M' U2 M U F2", // opposite edges swap: case 1 from anywhere, becomes case 1
  "7.4": "F2 U M' U2 M U F2", // neighboring edges swap: case 1 from anywhere, becomes case 1 or 2
} as const;

export type CaseId = keyof typeof ALGS;
