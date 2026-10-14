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

## Development

```sh
npm install
npm run dev      # start the app
npm test         # run the tests (includes solving thousands of random cubes)
npm run build    # static build in dist/
```

Every push to `main` runs the tests, builds the app and publishes it to GitHub Pages
(`.github/workflows/deploy.yml`).

## How it's built

- `src/cube`: the cube model (stickers, moves, rotations), validation of entered cubes.
- `src/methods/layers`: the layer method solver, one file per step. Each step only uses the
  moves documented for it, and picks the case by trying them, so it always matches the lessons.
- `src/methods/fridrich`: Cinoto's F2L/OLL/PLL algorithms, a case classifier, and the CFOP solver.
- `src/content/layers`: lesson content; every case picture is checked against its text in tests.
- `src/three`: the 3D cube (three.js); `src/components`, `src/pages`: the React app.
