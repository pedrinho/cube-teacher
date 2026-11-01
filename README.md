# Cube Teacher

**Try it:** https://pedrinho.github.io/cube-teacher/

A web app that teaches how to solve the Rubik's cube with the **layer method**
("método de camadas") as taught by Rafael Cinoto in
[Montar Cubo Mágico com histórias](https://cinoto.com.br/cubomagico/metodo-de-camadas-com-historias/).
English by default, with a switch to Portuguese.

- **Learn**: a lesson for each of the 7 steps (plus how to read moves), with Cinoto's video,
  every case with a picture and its moves, and a 3D cube that shows each case being solved.
- **Solve my cube**: paint your scrambled cube (or follow a scramble), then follow a guided
  solution, one move at a time, that uses exactly the moves from the lessons.
- **Practice**: pick a step; the app guides you through the steps before it, then it's your turn.

The steps: white cross, first layer, second layer, yellow cross, yellow face, top corners and
top edges (Minerva). The algorithms come from Cinoto's guide
([camadas.pdf](http://www.cinoto.com.br/camadas/camadas.pdf)).

### Getting faster: the Fridrich method (CFOP)

For kids who already solve the cube, following
[Cinoto's Fridrich track](https://cinoto.com.br/cubomagico/principais/fridrich/):

- **Lessons**: finger tricks and new moves, cross on the bottom, intuitive F2L, basic OLL,
  all 21 PLLs, all 57 OLLs and all 41 F2L algorithms, with his videos. Every algorithm comes from
  his guide ([fridrich.pdf](http://cinoto.com.br/cubo/fridrich.pdf)) and is checked by simulation.
- **Trainer**: scrambles that set up one case at a time (the cases you're learning, or a whole
  set), timed, with your times per case.
- **Guided solve**: optimal cross, the four F2L pairs, OLL and PLL by name, with a basic
  (2-look) or full last layer.

## Cube Hero

**Play it:** https://pedrinho.github.io/cube-teacher/hero/

A Guitar Hero–style game: a song of turns comes down a highway as notes, and you play it on the
keyboard. Each note is played with its own letter: `R`, `R'` and `R2` with the R key, `y` with the
Y key, the middle layer `M` with the M key (wide moves like `r` use their face's letter). Each lane
is a face, and notes are painted in that face's color. Half turns have a tail: hold the key until it
has gone by. Hits are judged Perfect or Good by timing; a missed note still turns the cube.

The songs are levels, in four chapters from Easy to Extreme, and each opens once the level before it
has three stars. Chapter 1 starts with a cube of just one piece and builds up, one new move at a
time, through the 1×1×2 to 1×1×4 towers, the 1×2×2, 1×2×3 and 1×3×3, and the 2×2×3. Chapter 2
opens with the 2×2×2, the first real cube, then pyraminxes of one piece, two layers (its tips glued
on) and three, the pyraminx itself, whose tips are small notes in their corner's lane, and the Corner
Twist pyraminx, just four corners that each twist on their own. From chapter 2 on there are no hints,
and each puzzle comes scrambled: the song solves it. The keys can be changed on the levels screen.

## Development

One repository, three npm workspaces:

- `packages/cube-kit`: what both apps share. The cube model, validation, the layer and Fridrich
  solvers, the Pyraminx model and solver, the three.js cube and pyraminx, the paint editor and move keycaps, and the texts they use (en/pt).
  It is TypeScript source, imported directly (`cube-kit/cube/model`, `cube-kit/react/NetEditor`…).
- `apps/teacher`: Cube Teacher.
- `apps/hero`: Cube Hero.

```sh
npm install
npm run dev        # Cube Teacher
npm run dev:hero   # Cube Hero
npm test           # all tests (includes solving thousands of random cubes)
npm run build      # static builds in apps/*/dist
npm run site       # both builds in site/, as published
```

Every push to `main` runs the tests, builds both apps and publishes them to GitHub Pages
(`.github/workflows/deploy.yml`).

## How it's built

- `packages/cube-kit/src/cube`: the cube model (stickers, moves, rotations), validation of entered cubes.
- `packages/cube-kit/src/methods/layers`: the layer method solver, one file per step. Each step only
  uses the moves documented for it, and picks the case by trying them, so it always matches the lessons.
- `packages/cube-kit/src/methods/fridrich`: Cinoto's F2L/OLL/PLL algorithms, a case classifier, and
  the CFOP solver.
- `packages/cube-kit/src/pyraminx`: the Pyraminx model (stickers and turns from its geometry, like the
  cube's) and its beginner's-method solver.
- `packages/cube-kit/src/three`: the 3D cube and pyraminx (three.js); `src/react`: components both apps use.
- `apps/teacher/src/content/layers`: lesson content; every case picture is checked against its text in tests.
- `apps/teacher/src/components`, `apps/teacher/src/pages`: the Cube Teacher app.
- `apps/hero/src/game`: the levels and their song charts (laid out on beats), the puzzles, lanes and keys, hit judging,
  scoring, the highway renderer and the synthesized music; `apps/hero/src/screens`: the game's screens.
