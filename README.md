# GridGame

Attempting to make a puzzle game based on a grid with interesting notions of adjacency. A learning project in terms of getting back into the web, learning Typescript, and actually trying to design a somewhat interesting set of rules that leads to a playable and generatable puzzle.

Progress in the game:
- Ruleset 1: based on complex distance calculation; flaw -- unintuivie, many bad stable solutions
- Ruleset 2: can rotate (in a rubix cube like sense) the rows of the grid and the cols of the colors. flaw -- color space actually doesn't add to powers from the base soln, so no interesting puzzle can be made
- Ruleset 3: swap (grid row) with (color col); flaw -- slightly more inutuitive, but less so. Bad stable solutions when color cols are aligned to grid rows
- Ruleset 4: like (2), but with row/col swapped between moves. I think this is workable, but not intuitive, and not invertible which makes it hard to reason about
- Ruleset 5: can rotate (in a rubix cube like sense) a single selected row of the grid or a single selected col of the color grid. Advantages -- invertible, relatively intuitive. Will use two sets of controls (arrow keys for one grid, WASD for the other). flaws -- trivial strategy, align one sid,e then the other, then tweak
- Ruleset 6 (TODO): Like 5, but each move applies to both boards?
