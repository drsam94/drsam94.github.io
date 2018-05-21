
// Non-confidential and non-proprietary information of Sam Donow
import { Coords, Direction, Dims, Color } from "./GUITypes";

type PuzzleDescription = string[];

/// Singleton class for storing various globals
class Globals {
    public width : number;
    public height : number;
    public readonly gridSize : number;
    public grid : Block[][];
    public playerSquares : Coords[];
    private allowInput : boolean;
    private currentPuzzle : PuzzleDescription;
    constructor() {
        this.width =  document.body.getBoundingClientRect().width;
        this.height = document.body.getBoundingClientRect().height;
        this.gridSize = 10;
        this.allowInput = true;
        this.grid = [];
        this.playerSquares = [];
        this.currentPuzzle = [];
    }

    public makeMove(dir : Direction) : void {
        // TODO: draw intermediary stages of motion so allowInput is actually doing something
        G.allowInput = false;
        this.setPlayerSquaresEmpty();
        while (this.moveSingle(dir)) {
        }
        this.postMoveUpdate(dir);
        G.allowInput = true;
    }

    public isInputAllowed() : boolean {
        return this.allowInput;
    }

    public setState(loc : Coords, state : BlockType) : void {
        const block : Block = this.grid[loc.row][loc.col];
        block.state = state;
        if (state === BlockType.Player) {
            this.playerSquares.push(Coords.copy(loc));
        }
        block.updateDisplay();
    }

    public resetPuzzle(puzzle? : PuzzleDescription) : void {
        puzzle = puzzle || this.currentPuzzle;
        this.playerSquares = [];
        this.allowInput = true;
        if (puzzle.length !== G.gridSize || puzzle[0].length !== G.gridSize) {
            throw new Error("Bad puzzle size");
        }
        for (let i = 0; i < G.gridSize; ++i) {
            for (let j = 0; j < G.gridSize; ++j) {
                G.setState(new Coords(i, j), puzzle[i].charCodeAt(j));
            }
        }
        this.currentPuzzle = puzzle;
    }

    private setPlayerSquaresEmpty() {
        for (const pSquare of this.playerSquares) {
            this.grid[pSquare.row][pSquare.col].state = BlockType.Empty;
        }
    }

    private youWin() : void {
        setTimeout(function() {
            alert("You won, yay");
        }, 0);
    }

    private postMoveUpdate(dir : Direction) : void {
        for (const pSquare of this.playerSquares) {
            const current = this.grid[pSquare.row][pSquare.col];
            if (current.state === BlockType.Target) {
                this.youWin();
            }
            current.state = BlockType.Player;
            const border = this.getBlockInDirection(pSquare, dir);
            if (border !== null) {
                if (border.state === BlockType.Convertable) {
                    this.setState(border.loc, BlockType.Player);
                } else if (border.state === BlockType.Target) {
                    this.youWin();
                }
            }
        }
        // To be conservative, explicitly update everything here, but in the future
        // we should just update the things that were changed
        for (const blockRow of this.grid) {
            for (const block of blockRow) {
                block.updateDisplay();
            }
        }
    }

    private moveSingle(dir : Direction) : boolean {
        const nextSquares : Coords[] = [];
        for (const pSquare of this.playerSquares) {
            const nextBlock = this.getBlockInDirection(pSquare, dir);
            if (nextBlock === null || nextBlock.state === BlockType.Obstacle
                                   || nextBlock.state === BlockType.Convertable) {
                return false;
            }
            nextSquares.push(nextBlock.loc);
        }
        this.playerSquares = nextSquares;
        return true;
    }

    private getBlockInDirection(loc : Coords, dir : Direction) : Block | null {
        const place : Coords = Coords.copy(loc);
        switch (dir) {
            case Direction.Up:
                place.row -= 1;
                break;
            case Direction.Down:
                place.row += 1;
                break;
            case Direction.Left:
                place.col -= 1;
                break;
            case Direction.Right:
                place.col += 1;
                break;
            default:
                throw new Error("Invalid direction " + dir);
        }
        if (place.col < 0 || place.col >= this.gridSize ||
            place.row < 0 || place.row >= this.gridSize) {
            return null;
        }
        return this.grid[place.row][place.col];
    }
}

const G = new Globals();

enum KeyCode {
    Enter = 13,
    LeftArrow = 37,
    UpArrow = 38,
    RightArrow = 39,
    DownArrow = 40,
    W = 'W'.charCodeAt(0),
    A = 'A'.charCodeAt(0),
    S = 'S'.charCodeAt(0),
    D = 'D'.charCodeAt(0),
    R = 'R'.charCodeAt(0)
}

function makeDiv(dim : Dims) : HTMLElement {
    const ret : HTMLElement = document.createElement("div");
    ret.style.width = dim.width.toString();
    ret.style.height = dim.height.toString();
    ret.style.cssFloat = "left";
    return ret;
}

enum BlockType {
    Empty = 'e'.charCodeAt(0),
    Obstacle = 'o'.charCodeAt(0),
    Player = 'p'.charCodeAt(0),
    Target = 't'.charCodeAt(0),
    Convertable = 'c'.charCodeAt(0)
}

class Block {
    // Display value / location in the solution
    public loc : Coords;
    public state : BlockType;
    public node : HTMLElement;
    constructor(parentDims : Dims, parent : HTMLElement, loc : Coords) {
        const makeBlock = function() : HTMLElement {
                      return makeDiv({ width  :  (parentDims.width) / G.gridSize - 10,
                                       height :  (parentDims.height) / G.gridSize - 10});
                      };

        this.node = makeBlock();
        this.loc = Coords.copy(loc);
        parent.appendChild(this.node);
        this.node.style.borderWidth = "5px 5px 5px 5px";
        this.node.style.border = "5px solid #0c0c0c";
        this.state = BlockType.Empty;
        this.updateDisplay();
    }

    public updateDisplay() : void {
        let col : Color;
        switch (this.state) {
            case BlockType.Empty:
                col = Color.white();
                break;
            case BlockType.Obstacle:
                col = Color.black();
                break;
            case BlockType.Player:
                col = Color.red();
                break;
            case BlockType.Target:
                col = Color.blue();
                break;
            case BlockType.Convertable:
                col = Color.green();
                break;
            default:
                throw new Error("Bad blocktype " + this.state);
        }
        this.node.style.backgroundColor = col.toCSSString();
    }
}

function onKeyEvent(evt : KeyCode) : void  {
    if (!G.isInputAllowed()) {
        return;
    }
    let dir : Direction;
    switch (evt) {
        case KeyCode.UpArrow:
        case KeyCode.W:
            dir = Direction.Up;
            break;
        case KeyCode.LeftArrow:
        case KeyCode.A:
            dir = Direction.Left;
            break;
        case KeyCode.RightArrow:
        case KeyCode.D:
            dir = Direction.Right;
            break;
        case KeyCode.DownArrow:
        case KeyCode.S:
            dir = Direction.Down;
            break;
        case KeyCode.R:
            G.resetPuzzle();
            return;
        default:
            return;
    }
    G.makeMove(dir);
}
document.body.onkeydown = function(evt : KeyboardEvent) : void { onKeyEvent(evt.keyCode); };

function populateGameBoard(rootDims : Dims) : void {
    const rootNode : HTMLElement = makeDiv(rootDims);
    const childDims : Dims = { width : rootDims.height, height : rootDims.height };
    const locDiv : HTMLElement = makeDiv(childDims);
    for (let i : number = 0; i < G.gridSize; ++i) {
        const gridRow : Block[] = [];
        G.grid.push(gridRow);
        for (let j : number = 0; j < G.gridSize; ++j) {
            const block = new Block(childDims, locDiv, new Coords(i, j));
            gridRow.push(block);
        }
    }
    rootNode.appendChild(locDiv);
    document.body.appendChild(rootNode);
}

const level1 : string[] = [
"peeeceeeee",
"oeeceeeeee",
"oeeoeeeecc",
"eeeeeeeeee",
"oeeeeccooo",
"eeeeeeeoee",
"eeeeeeeooo",
"coooeeeeee",
"eeeeeeeeee",
"eeeeeceeet"
];

function main() : void {
    const tbDim : Dims = { width: G.width, height: G.height / 7 };
    const titleBar : HTMLElement = makeDiv(tbDim);
    titleBar.innerHTML = "<h1>You are red. Goal is blue. Obstacles are black. </br>" +
                         "Joinable obstacles are green. Use arrow keys. R to reset</h1>";
    document.body.appendChild(titleBar);
    populateGameBoard({ width: G.width, height: G.height / 1.5 - tbDim.height});
    G.resetPuzzle(level1);
}
document.body.onload = main;
