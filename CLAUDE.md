# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A classic Tetris game implemented in vanilla JavaScript with HTML5 Canvas and CSS. No dependencies, no build process, no package.json.

## Running the game

Open `index.html` directly in a browser, or serve it locally:

```bash
python3 -m http.server 8000
# or
npx serve .
```

There is no build, lint, or test command — the project has no tooling configured.

## Architecture

Everything lives in three files with no module system (plain `<script src="game.js">`):

- `index.html` — DOM structure: main `<canvas id="board">` (300×600), a side panel (score/lines/level/tint-countdown/next-piece preview), and a pause/game-over overlay.
- `style.css` — dark/retro visual theme.
- `game.js` — all game logic, structured around a small set of global `let` variables (`board`, `current`, `next`, `score`, `lines`, `level`, `paused`, `gameOver`, `dropInterval`, etc.) mutated in place rather than passed around.

Key mechanics in `game.js`:

- **Board model**: a `ROWS × COLS` matrix where each cell is `0` (empty), a color index `1–8` identifying which piece locked there, or that same index plus `WILD_FLAG` (`100`) if the "Tinte" effect turned it into a wildcard (see below). `baseType(v)` (`v % WILD_FLAG`) recovers the original color for drawing/comparison; `isWild(v)` (`v >= WILD_FLAG`) tells whether a cell is a wildcard. `collide`/`merge`/`ghostY` only check truthiness, so they need no special-casing for wildcards.
- **Pieces**: defined as square matrices in `PIECES`. Rotation (`rotateCW`) is done via transpose + row reversal, not by storing pre-rotated states. Piece type 8 is the "Nut" — a 3×3 ring with a hollow center (`[[8,8,8],[8,0,8],[8,8,8]]`, `NUT_TYPE` constant). It's rotationally symmetric so rotation is a no-op, and its center cell (a `0`) is invisible to collision/merge, so it can settle over a 1-wide stack poking up through the hole. The hole itself is drawn as a circle (`drawNutHole`) only while the piece is active/ghosted/in the NEXT preview — once locked it's just an ordinary empty board cell, which is what makes lines through it hard to clear.
- **"Tinte" piece**: type 9 (`TINT_TYPE`), a 1×1 magenta piece that appears deterministically every `TINT_INTERVAL` (20) pieces generated (tracked by the `piecesGenerated` counter in `randomPiece`, reset in `init`). It never merges into the board: on lock (`lockPiece`), `applyTint()` reads the color of the board cell directly beneath its landing spot and converts every board cell of that color into a wildcard (`+= WILD_FLAG`), everywhere on the board. It has no effect if it lands on the floor or over an empty cell. Wildcards are drawn with a white diamond overlay (`drawWildMark`) on top of their original color; the active/ghost/NEXT Tinte piece itself is marked with `drawTintMark`.
- **Collision** (`collide`): checks board bounds and overlap with locked cells for a given shape/offset.
- **Wall kicks** (`tryRotate`): after rotating, tries offsets `[0, -1, 1, -2, 2]` columns until a non-colliding position is found.
- **Game loop** (`loop`): driven by `requestAnimationFrame`, accumulates elapsed time (`dropAccum`) and drops the piece one row once it exceeds `dropInterval`.
- **Line clearing** (`clearLines`): scans bottom-up, splices full rows out and unshifts empty rows at the top. A row counts as complete via `isRowComplete`: every empty cell in the row must be adjacent (left or right) to an unused wildcard, each wildcard covering at most one hole — this is what makes wildcards useful (a row need not be literally full of locked blocks to clear).
- **Scoring**: `LINE_SCORES = [0, 100, 300, 500, 800]` multiplied by `level`; hard drop adds 2 pts/cell, soft drop adds 1 pt/row.
- **Level/speed**: level increases every 10 lines; `dropInterval = max(100, 1000 - (level - 1) * 90)` ms.
- **Ghost piece**: `ghostY()` projects the current piece straight down to its landing row, drawn at `globalAlpha = 0.2`.

Tunable constants at the top of `game.js`: `COLS`, `ROWS`, `BLOCK`, `COLORS`, `LINE_SCORES`, `dropInterval`, `TINT_INTERVAL`, `WILD_FLAG`. If `COLS`/`ROWS`/`BLOCK` change, the `<canvas id="board">` `width`/`height` in `index.html` must be updated to match (`COLS × BLOCK`, `ROWS × BLOCK`).

Controls: arrow keys to move/rotate/soft-drop, `Space` for hard drop, `P` to pause.
